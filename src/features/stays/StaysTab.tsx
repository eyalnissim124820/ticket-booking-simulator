import { useEffect, useMemo, useState } from 'react'
import {
  AMENITY_IDS,
  DESTINATIONS,
  DESTINATION_BY_ID,
  PROPERTY_TYPE_OPTIONS,
  amenityKey,
  cachedPropertiesFor,
  findProperty,
  pairText,
  propertyTypeKey,
  searchDestinations,
  type Property,
  type PropertyType,
  type RoomOption,
} from '../../data/hotels'
import { destinationCity, destinationCountry, type Destination } from '../../data/destinations'
import { useStore } from '../../state/store'
import {
  Autocomplete,
  Counter,
  DateField,
  Empty,
  Modal,
  Select,
  SkeletonStayCard,
  Stars,
} from '../../components/ui'
import { AMENITY_ICONS, IconBed, IconHeart, IconSearch } from '../../components/icons'
import { PropertyDetail } from './PropertyDetail'
import { StayBookingFlow } from './StayBookingFlow'
import { StayImage } from './StayImage'
import { prefetchStayPhotos } from '../../data/stayPhotos'
import { addDays, cx, nightsBetween, todayIso } from '../../lib/format'
import { useI18n } from '../../i18n'

type Sort = 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'distance'

interface StaySearch {
  destinationId: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
}

function PropertyCard({
  property,
  nights,
  rooms,
  saved,
  eager = false,
  onOpen,
  onToggleSave,
}: {
  property: Property
  nights: number
  rooms: number
  saved: boolean
  /** Set on the first row, which is above the fold and should not wait to be
   *  scrolled into view before it is allowed to load. */
  eager?: boolean
  onOpen: () => void
  onToggleSave: () => void
}) {
  const { t, locale, money, plural } = useI18n()
  const cheapest = property.rooms.reduce((a, b) => (a.rate <= b.rate ? a : b))
  const total = cheapest.rate * nights * rooms

  return (
    <article className="card stay-card" onClick={onOpen}>
      <div className="stay-photo">
        <StayImage seed={property.artSeed} width={640} eager={eager} alt={pairText(property.name, locale)} />
        <button
          className="save"
          aria-label={saved ? t('stays.unsavedToast') : t('common.save')}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave()
          }}
        >
          <IconHeart size={16} filled={saved} />
        </button>
        {property.freeCancellation && (
          <span className="pill corner-tag">{t('stays.freeCancellation')}</span>
        )}
      </div>
      <div className="stay-body">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            <strong style={{ fontSize: 15 }}>{pairText(property.name, locale)}</strong>
            <div><Stars count={property.stars} /></div>
          </div>
          <span className={cx('score', property.rating < 8 && 'mid', property.rating < 7 && 'low')}>
            {property.rating.toFixed(1)}
          </span>
        </div>
        <div className="faint" style={{ fontSize: 12.5 }}>
          {t(propertyTypeKey(property.type))} · {pairText(property.neighbourhood, locale)} ·{' '}
          {t('stays.fromCentre', { km: property.distanceToCentreKm })}
        </div>
        <div className="amenity-row">
          {property.amenities.slice(0, 3).map((id) => {
            const Icon = AMENITY_ICONS[id]
            return (
              <span key={id} className="pill">
                {Icon && <Icon size={13} />}
                {t(amenityKey(id))}
              </span>
            )
          })}
          {property.amenities.length > 3 && <span className="pill">+{property.amenities.length - 3}</span>}
        </div>
        <div className="row-between" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <span className="faint" style={{ fontSize: 12 }}>
            {t('stays.reviewsCount', { count: property.reviewCount.toLocaleString() })}
          </span>
          <div style={{ textAlign: 'end' }}>
            <div className="mono" style={{ fontSize: 18 }}>{money(total)}</div>
            <div className="faint" style={{ fontSize: 11 }}>
              {plural.nights(nights)} · {money(cheapest.rate)}/{t('common.perNight')}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function StaysTab() {
  const { t, locale, money, formatDate, plural, arrow } = useI18n()
  const { state, dispatch, notify } = useStore()

  const [search, setSearch] = useState<StaySearch>({
    destinationId: 'lisbon-portugal',
    checkIn: addDays(todayIso(), 21),
    checkOut: addDays(todayIso(), 25),
    guests: 2,
    rooms: 1,
  })
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState<StaySearch | null>(null)
  const [loading, setLoading] = useState(false)
  const [sort, setSort] = useState<Sort>('recommended')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [minRating, setMinRating] = useState(0)
  const [types, setTypes] = useState<PropertyType[]>([])
  const [requiredAmenities, setRequiredAmenities] = useState<string[]>([])
  const [onlyFreeCancellation, setOnlyFreeCancellation] = useState(false)
  const [detail, setDetail] = useState<Property | null>(null)
  const [booking, setBooking] = useState<{ property: Property; room: RoomOption } | null>(null)
  const [reservationsOpen, setReservationsOpen] = useState(false)

  useEffect(() => {
    if (!submitted) return
    setLoading(true)
    const id = window.setTimeout(() => setLoading(false), 750)
    return () => window.clearTimeout(id)
  }, [submitted])

  const nights = nightsBetween(search.checkIn, search.checkOut)
  const submittedNights = submitted ? nightsBetween(submitted.checkIn, submitted.checkOut) : 0
  const destination = DESTINATION_BY_ID.get(search.destinationId) ?? DESTINATIONS[0]
  const submittedDestination = submitted ? DESTINATION_BY_ID.get(submitted.destinationId) : undefined

  const all = useMemo(() => (submitted ? cachedPropertiesFor(submitted.destinationId) : []), [submitted])
  const priceCeiling = useMemo(() => (all.length ? Math.max(...all.map((p) => p.nightlyRate)) : 0), [all])

  // The popular tiles are the first photographs anyone sees on this tab, and
  // they are on screen before any search happens.
  useEffect(() => {
    prefetchStayPhotos(searchDestinations('').map((d) => d.city.length * 977 + d.basePrice))
  }, [])

  // The results are held behind skeletons for three quarters of a second. Spend
  // that window fetching the photographs instead of idling through it, and warm
  // every listing for the destination rather than only the ones that pass the
  // current filters — changing a filter then costs nothing.
  useEffect(() => {
    if (all.length) prefetchStayPhotos(all.map((p) => p.artSeed))
  }, [all])

  const visible = useMemo(() => {
    const filtered = all.filter((p) => {
      if (maxPrice != null && p.nightlyRate > maxPrice) return false
      if (p.rating < minRating) return false
      if (types.length && !types.includes(p.type)) return false
      if (onlyFreeCancellation && !p.freeCancellation) return false
      return requiredAmenities.every((a) => p.amenities.includes(a))
    })
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'price-asc': return a.nightlyRate - b.nightlyRate
        case 'price-desc': return b.nightlyRate - a.nightlyRate
        case 'rating': return b.rating - a.rating
        case 'distance': return a.distanceToCentreKm - b.distanceToCentreKm
        default:
          // Recommended blends rating against price so good value floats up.
          return b.rating * 100 - b.nightlyRate * 0.35 - (a.rating * 100 - a.nightlyRate * 0.35)
      }
    })
  }, [all, maxPrice, minRating, types, requiredAmenities, onlyFreeCancellation, sort])

  const runSearch = (destinationId = search.destinationId) => {
    if (nights < 1) {
      notify({ tone: 'error', title: t('stays.badDates') })
      return
    }
    setSubmitted({ ...search, destinationId })
    setMaxPrice(null)
    setMinRating(0)
    setTypes([])
    setRequiredAmenities([])
    setOnlyFreeCancellation(false)
  }

  const activeReservations = state.stayBookings.filter((b) => b.status === 'confirmed')

  return (
    <div className="page-enter">
      <section className="search-bar">
        <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
          <span className="pill pill-brand"><IconBed size={13} />{t('stays.title')}</span>
          <span className="faint" style={{ fontSize: 12.5 }}>
            {t('stays.destinationCount', { count: DESTINATIONS.length })}
          </span>
          <button className="btn btn-sm" style={{ marginInlineStart: 'auto' }} onClick={() => setReservationsOpen(true)}>
            {t('stays.myReservations')}
            {activeReservations.length > 0 && ` (${activeReservations.length})`}
          </button>
        </div>

        <div className="search-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}>
          <Autocomplete<Destination>
            label={t('stays.destination')}
            display={`${destinationCity(destination, locale)}, ${destinationCountry(destination, locale)}`}
            placeholder={t('stays.whereTo')}
            options={searchDestinations(query)}
            onQuery={setQuery}
            onPick={(d) => setSearch((s) => ({ ...s, destinationId: d.id }))}
            keyOf={(d) => d.id}
            renderOption={(d) => (
              <div className="row-between">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{destinationCity(d, locale)}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>{destinationCountry(d, locale)}</div>
                </div>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  {money(Math.round(d.basePrice * 0.6))}
                </span>
              </div>
            )}
          />
          <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
            <DateField
              label={`${t('stays.checkIn')} — ${t('stays.checkOut')}`}
              range
              value={search.checkIn}
              endValue={search.checkOut}
              onChange={(start, end) =>
                setSearch((s) => ({ ...s, checkIn: start, checkOut: end ?? addDays(start, 3) }))
              }
            />
          </div>
          <Counter label={t('stays.guests')} value={search.guests} min={1} max={8} onChange={(guests) => setSearch((s) => ({ ...s, guests }))} />
          <Counter label={t('stays.rooms')} value={search.rooms} min={1} max={4} onChange={(rooms) => setSearch((s) => ({ ...s, rooms }))} />
          <div className="field">
            <label>&nbsp;</label>
            <button className="btn btn-primary btn-lg btn-block" onClick={() => runSearch()}>
              <IconSearch size={16} />
              {t('stays.searchCta')}
            </button>
          </div>
        </div>
        <div className="faint" style={{ fontSize: 12.5 }}>
          {nights > 0
            ? `${plural.nights(nights)} · ${formatDate(search.checkIn, 'short')} ${arrow} ${formatDate(search.checkOut, 'short')}`
            : t('stays.badDates')}
        </div>
      </section>

      {!submitted && (
        <div style={{ marginTop: 24 }}>
          <div className="rule-heading"><span className="panel-title">{t('stays.popular')}</span></div>
          <div className="stay-grid stagger">
            {searchDestinations('').map((d) => (
              <button
                key={d.id}
                className="card stay-card"
                onClick={() => {
                  setSearch((s) => ({ ...s, destinationId: d.id }))
                  runSearch(d.id)
                }}
              >
                <div className="stay-photo">
                  <StayImage
                    seed={d.city.length * 977 + d.basePrice}
                    width={640}
                    alt={destinationCity(d, locale)}
                  />
                </div>
                <div className="stay-body">
                  <strong style={{ fontSize: 15 }}>{destinationCity(d, locale)}</strong>
                  <span className="faint" style={{ fontSize: 12.5 }}>{destinationCountry(d, locale)}</span>
                  <span className="muted" style={{ fontSize: 13 }}>
                    {t('stays.staysFrom', { amount: money(Math.round(d.basePrice * 0.6)) })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {submitted && (
        <div className="results-layout">
          <aside className="card filters">
            <div className="row-between">
              <span className="panel-title">{t('common.filters')}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setMaxPrice(null)
                  setMinRating(0)
                  setTypes([])
                  setRequiredAmenities([])
                  setOnlyFreeCancellation(false)
                }}
              >
                {t('common.reset')}
              </button>
            </div>

            {priceCeiling > 0 && (
              <div className="filter-group">
                <span className="panel-title">{t('stays.nightlyBudget')}</span>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={5}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  aria-label={t('stays.nightlyBudget')}
                />
                <span className="faint" style={{ fontSize: 12.5 }}>
                  {t('stays.upToPerNight', { amount: money(maxPrice ?? priceCeiling) })}
                </span>
              </div>
            )}

            <div className="filter-group">
              <span className="panel-title">{t('stays.guestRating')}</span>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {[0, 7, 8, 9].map((r) => (
                  <button key={r} className="chip" aria-pressed={minRating === r} onClick={() => setMinRating(r)}>
                    {r === 0 ? t('common.any') : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="panel-title">{t('stays.propertyType')}</span>
              {PROPERTY_TYPE_OPTIONS.map((type) => (
                <label className="checkline" key={type.id}>
                  <input
                    type="checkbox"
                    checked={types.includes(type.id)}
                    onChange={() =>
                      setTypes((prev) =>
                        prev.includes(type.id) ? prev.filter((x) => x !== type.id) : [...prev, type.id],
                      )
                    }
                  />
                  {t(propertyTypeKey(type.id))}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <span className="panel-title">{t('stays.mustHave')}</span>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {AMENITY_IDS.map((id) => {
                  const Icon = AMENITY_ICONS[id]
                  return (
                    <button
                      key={id}
                      className="chip"
                      aria-pressed={requiredAmenities.includes(id)}
                      onClick={() =>
                        setRequiredAmenities((prev) =>
                          prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                        )
                      }
                    >
                      {Icon && <Icon size={13} />}
                      {t(amenityKey(id))}
                    </button>
                  )
                })}
              </div>
            </div>

            <label className="checkline">
              <input type="checkbox" checked={onlyFreeCancellation} onChange={(e) => setOnlyFreeCancellation(e.target.checked)} />
              {t('stays.freeCancellationOnly')}
            </label>
          </aside>

          <div>
            <div className="toolbar">
              {loading ? (
                <span className="row muted" style={{ gap: 8 }}>
                  <span className="spinner-inline" />
                  {t('loading.stays', {
                    city: submittedDestination ? destinationCity(submittedDestination, locale) : '',
                  })}
                </span>
              ) : (
                <>
                  <strong>{visible.length}</strong>
                  <span className="muted">
                    {t('stays.staysIn', {
                      city: submittedDestination ? destinationCity(submittedDestination, locale) : '',
                    })}{' '}
                    · {plural.nights(submittedNights)} · {plural.guests(submitted.guests)}
                  </span>
                </>
              )}
              <div className="grow" />
              <span className="faint" style={{ fontSize: 12.5 }}>{t('common.sort')}</span>
              <Select value={sort} onChange={(v) => setSort(v as Sort)} style={{ width: 'auto' }} ariaLabel={t('common.sort')}>
                <option value="recommended">{t('stays.sortRecommended')}</option>
                <option value="price-asc">{t('stays.sortPriceAsc')}</option>
                <option value="price-desc">{t('stays.sortPriceDesc')}</option>
                <option value="rating">{t('stays.sortRating')}</option>
                <option value="distance">{t('stays.sortDistance')}</option>
              </Select>
            </div>

            {loading ? (
              <div className="stay-grid">
                {Array.from({ length: 6 }, (_, i) => <SkeletonStayCard key={i} />)}
              </div>
            ) : visible.length === 0 ? (
              <div className="card">
                <Empty icon={<IconSearch size={32} />} title={t('stays.noMatch')} body={t('stays.noMatchBody')} />
              </div>
            ) : (
              <div className="stay-grid stagger">
                {visible.map((property, i) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    eager={i < 4}
                    nights={submittedNights}
                    rooms={submitted.rooms}
                    saved={state.savedProperties.includes(property.id)}
                    onOpen={() => setDetail(property)}
                    onToggleSave={() => {
                      const wasSaved = state.savedProperties.includes(property.id)
                      dispatch({ type: 'toggle-saved', propertyId: property.id })
                      notify({ tone: 'info', title: wasSaved ? t('stays.unsavedToast') : t('stays.savedToast') })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {detail && submitted && (
        <PropertyDetail
          property={detail}
          checkIn={submitted.checkIn}
          checkOut={submitted.checkOut}
          rooms={submitted.rooms}
          onClose={() => setDetail(null)}
          onBook={(room) => {
            setBooking({ property: detail, room })
            setDetail(null)
          }}
        />
      )}

      {booking && submitted && (
        <StayBookingFlow
          property={booking.property}
          room={booking.room}
          checkIn={submitted.checkIn}
          checkOut={submitted.checkOut}
          guests={submitted.guests}
          rooms={submitted.rooms}
          onClose={() => setBooking(null)}
        />
      )}

      <Modal
        open={reservationsOpen}
        title={t('stays.myReservations')}
        subtitle={t('flights.upcomingTotal', { active: activeReservations.length, total: state.stayBookings.length })}
        onClose={() => setReservationsOpen(false)}
      >
        {state.stayBookings.length === 0 ? (
          <Empty icon={<IconBed size={32} />} title={t('stays.noReservations')} body={t('stays.noReservationsBody')} />
        ) : (
          state.stayBookings.map((b) => {
            const property = findProperty(b.propertyId)
            const room = property?.rooms.find((r) => r.id === b.roomId)
            return (
              <div key={b.id} className="card card-pad stack" style={{ opacity: b.status === 'cancelled' ? 0.55 : 1 }}>
                <div className="row-between">
                  <div>
                    <strong>{property ? pairText(property.name, locale) : t('stays.property')}</strong>
                    <div className="faint" style={{ fontSize: 12.5 }}>
                      {property && pairText(property.neighbourhood, locale)}
                      {room && ` · ${t(room.nameKey)}`}
                    </div>
                  </div>
                  <span className={cx('pill', b.status === 'confirmed' ? 'pill-brand' : 'pill-down')}>
                    {b.status === 'confirmed' ? t('common.confirmed') : t('common.cancelled')}
                  </span>
                </div>
                <hr className="divider" />
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{t('stays.dates')}</span>
                  <strong>{formatDate(b.checkIn)} {arrow} {formatDate(b.checkOut)}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{t('common.reference')}</span>
                  <strong className="mono">{b.reference}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{t('stays.guest')}</span>
                  <span>{b.guestName}</span>
                </div>
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{t('common.paid')}</span>
                  <strong className="mono">{money(b.total)}</strong>
                </div>
                {b.status === 'confirmed' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      dispatch({ type: 'cancel-stay', id: b.id })
                      notify({
                        tone: 'info',
                        title: t('stays.cancelledToast'),
                        body: t('stays.refundedToWallet', { amount: money(b.total) }),
                      })
                    }}
                  >
                    {t('stays.cancelReservation')}
                  </button>
                )}
              </div>
            )
          })
        )}
      </Modal>
    </div>
  )
}
