import { useMemo, useState } from 'react'
import {
  AMENITIES,
  AMENITY_BY_ID,
  DESTINATIONS,
  DESTINATION_BY_ID,
  PROPERTY_INDEX,
  PROPERTY_TYPE_OPTIONS,
  propertiesFor,
  propertyTypeLabel,
  searchDestinations,
  type Property,
  type PropertyType,
  type RoomOption,
  type StayDestination,
} from '../../data/hotels'
import { useStore } from '../../state/store'
import { Autocomplete, Counter, Empty, Modal, Stars } from '../../components/ui'
import { PropertyDetail } from './PropertyDetail'
import { StayBookingFlow } from './StayBookingFlow'
import { propertyGradient, propertyIcon } from './PropertyArt'
import { addDays, cx, mediumDate, money, nightsBetween, shortDate, todayIso } from '../../lib/format'

type Sort = 'recommended' | 'price-asc' | 'price-desc' | 'rating' | 'distance'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Guest rating' },
  { id: 'distance', label: 'Distance to centre' },
]

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
  onOpen,
  onToggleSave,
}: {
  property: Property
  nights: number
  rooms: number
  saved: boolean
  onOpen: () => void
  onToggleSave: () => void
}) {
  const cheapest = property.rooms.reduce((a, b) => (a.rate <= b.rate ? a : b))
  const total = cheapest.rate * nights * rooms
  return (
    <article className="card stay-card" onClick={onOpen}>
      <div className="stay-photo" style={{ background: propertyGradient(property.hue) }}>
        {propertyIcon(property.hue)}
        <button
          className="save"
          aria-label={saved ? 'Remove from saved' : 'Save property'}
          onClick={(e) => {
            e.stopPropagation()
            onToggleSave()
          }}
        >
          {saved ? '♥' : '♡'}
        </button>
        {property.freeCancellation && (
          <span className="pill pill-accent" style={{ position: 'absolute', left: 10, bottom: 10 }}>
            Free cancellation
          </span>
        )}
      </div>
      <div className="stay-body">
        <div className="row-between" style={{ alignItems: 'flex-start' }}>
          <div className="grow">
            <strong style={{ fontSize: 14.5 }}>{property.name}</strong>
            <div>
              <Stars count={property.stars} />
            </div>
          </div>
          <span className={cx('score', property.rating < 8 && 'mid', property.rating < 7 && 'low')}>
            {property.rating.toFixed(1)}
          </span>
        </div>
        <div className="faint" style={{ fontSize: 12 }}>
          {propertyTypeLabel(property.type)} · {property.neighbourhood} ·{' '}
          {property.distanceToCentreKm} km from centre
        </div>
        <div className="amenity-row">
          {property.amenities.slice(0, 3).map((id) => (
            <span key={id} className="pill">
              {AMENITY_BY_ID.get(id)?.icon} {AMENITY_BY_ID.get(id)?.label}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="pill">+{property.amenities.length - 3}</span>
          )}
        </div>
        <div className="row-between" style={{ marginTop: 'auto', paddingTop: 8 }}>
          <span className="faint" style={{ fontSize: 12 }}>
            {property.reviewCount.toLocaleString()} reviews
          </span>
          <div style={{ textAlign: 'right' }}>
            <div className="mono" style={{ fontSize: 18, fontWeight: 650 }}>{money(total)}</div>
            <div className="faint" style={{ fontSize: 11 }}>
              {nights} night{nights > 1 ? 's' : ''} · {money(cheapest.rate)}/night
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

export function StaysTab() {
  const { state, dispatch, notify } = useStore()

  const [search, setSearch] = useState<StaySearch>({
    destinationId: 'lisbon',
    checkIn: addDays(todayIso(), 21),
    checkOut: addDays(todayIso(), 25),
    guests: 2,
    rooms: 1,
  })
  const [query, setQuery] = useState('')
  const [submitted, setSubmitted] = useState<StaySearch | null>(null)
  const [sort, setSort] = useState<Sort>('recommended')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [minRating, setMinRating] = useState(0)
  const [types, setTypes] = useState<PropertyType[]>([])
  const [requiredAmenities, setRequiredAmenities] = useState<string[]>([])
  const [onlyFreeCancellation, setOnlyFreeCancellation] = useState(false)
  const [detail, setDetail] = useState<Property | null>(null)
  const [booking, setBooking] = useState<{ property: Property; room: RoomOption } | null>(null)
  const [reservationsOpen, setReservationsOpen] = useState(false)

  const nights = nightsBetween(search.checkIn, search.checkOut)
  const submittedNights = submitted ? nightsBetween(submitted.checkIn, submitted.checkOut) : 0

  const all = useMemo(
    () => (submitted ? propertiesFor(submitted.destinationId) : []),
    [submitted],
  )
  const priceCeiling = useMemo(
    () => (all.length ? Math.max(...all.map((p) => p.nightlyRate)) : 0),
    [all],
  )

  const visible = useMemo(() => {
    const filtered = all.filter((p) => {
      if (maxPrice != null && p.nightlyRate > maxPrice) return false
      if (p.rating < minRating) return false
      if (types.length && !types.includes(p.type)) return false
      if (onlyFreeCancellation && !p.freeCancellation) return false
      return requiredAmenities.every((a) => p.amenities.includes(a))
    })
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'price-asc':
          return a.nightlyRate - b.nightlyRate
        case 'price-desc':
          return b.nightlyRate - a.nightlyRate
        case 'rating':
          return b.rating - a.rating
        case 'distance':
          return a.distanceToCentreKm - b.distanceToCentreKm
        default:
          // Recommended blends rating against price so good value floats up.
          return b.rating * 100 - b.nightlyRate * 0.35 - (a.rating * 100 - a.nightlyRate * 0.35)
      }
    })
    return sorted
  }, [all, maxPrice, minRating, types, requiredAmenities, onlyFreeCancellation, sort])

  const runSearch = () => {
    if (nights < 1) {
      notify({ tone: 'error', title: 'Check-out must be after check-in' })
      return
    }
    setSubmitted({ ...search })
    setMaxPrice(null)
    setMinRating(0)
    setTypes([])
    setRequiredAmenities([])
    setOnlyFreeCancellation(false)
  }

  const destination = DESTINATION_BY_ID.get(search.destinationId) ?? DESTINATIONS[0]
  const activeReservations = state.stayBookings.filter((b) => b.status === 'confirmed')

  return (
    <div>
      <section className="search-bar">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className="pill pill-accent">🛏️ Stays</span>
          <span className="faint" style={{ fontSize: 12.5 }}>
            {DESTINATIONS.length} destinations · simulated inventory
          </span>
          <div style={{ marginLeft: 'auto' }} className="row">
            <button className="btn btn-sm" onClick={() => setReservationsOpen(true)}>
              🛎️ My reservations {activeReservations.length > 0 && `(${activeReservations.length})`}
            </button>
          </div>
        </div>

        <div
          className="search-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
        >
          <Autocomplete<StayDestination>
            label="Destination"
            value={search.destinationId}
            display={`${destination.city}, ${destination.country}`}
            placeholder="Where to?"
            options={searchDestinations(query)}
            onQuery={setQuery}
            onPick={(d) => setSearch((s) => ({ ...s, destinationId: d.id }))}
            keyOf={(d) => d.id}
            renderOption={(d) => (
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 600 }}>{d.city}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>{d.country}</div>
                </div>
                <span className="faint mono" style={{ fontSize: 12 }}>
                  from {money(Math.round(d.basePrice * 0.6))}
                </span>
              </div>
            )}
          />
          <div className="field">
            <label>Check-in</label>
            <input
              className="input"
              type="date"
              min={todayIso()}
              value={search.checkIn}
              onChange={(e) => {
                const checkIn = e.target.value
                setSearch((s) => ({
                  ...s,
                  checkIn,
                  checkOut: s.checkOut <= checkIn ? addDays(checkIn, 3) : s.checkOut,
                }))
              }}
            />
          </div>
          <div className="field">
            <label>Check-out</label>
            <input
              className="input"
              type="date"
              min={addDays(search.checkIn, 1)}
              value={search.checkOut}
              onChange={(e) => setSearch((s) => ({ ...s, checkOut: e.target.value }))}
            />
          </div>
          <Counter
            label="Guests"
            value={search.guests}
            min={1}
            max={8}
            onChange={(guests) => setSearch((s) => ({ ...s, guests }))}
          />
          <Counter
            label="Rooms"
            value={search.rooms}
            min={1}
            max={4}
            onChange={(rooms) => setSearch((s) => ({ ...s, rooms }))}
          />
          <div className="field">
            <label>&nbsp;</label>
            <button className="btn btn-primary btn-lg btn-block" onClick={runSearch}>
              Search stays
            </button>
          </div>
        </div>
        <div className="faint" style={{ fontSize: 12 }}>
          {nights > 0
            ? `${nights} night${nights > 1 ? 's' : ''} · ${shortDate(search.checkIn)} → ${shortDate(search.checkOut)}`
            : 'Choose a check-out date after check-in.'}
        </div>
      </section>

      {!submitted && (
        <div style={{ marginTop: 18 }}>
          <span className="panel-title">Popular destinations</span>
          <div className="stay-grid" style={{ marginTop: 10 }}>
            {DESTINATIONS.slice(0, 8).map((d, i) => (
              <button
                key={d.id}
                className="card stay-card"
                style={{ textAlign: 'left', font: 'inherit', color: 'inherit', border: '1px solid var(--line-soft)' }}
                onClick={() => {
                  setSearch((s) => ({ ...s, destinationId: d.id }))
                  setSubmitted({ ...search, destinationId: d.id })
                }}
              >
                <div className="stay-photo" style={{ background: propertyGradient(i * 43) }}>
                  {propertyIcon(i * 7)}
                </div>
                <div className="stay-body">
                  <strong>{d.city}</strong>
                  <span className="faint" style={{ fontSize: 12 }}>{d.country}</span>
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    Stays from <strong className="mono">{money(Math.round(d.basePrice * 0.6))}</strong>/night
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
              <span className="panel-title">Filters</span>
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
                Reset
              </button>
            </div>

            {priceCeiling > 0 && (
              <div className="filter-group">
                <span className="panel-title">Nightly budget</span>
                <input
                  type="range"
                  min={0}
                  max={priceCeiling}
                  step={5}
                  value={maxPrice ?? priceCeiling}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                />
                <span className="faint" style={{ fontSize: 12 }}>
                  Up to {money(maxPrice ?? priceCeiling)} per night
                </span>
              </div>
            )}

            <div className="filter-group">
              <span className="panel-title">Guest rating</span>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {[0, 7, 8, 9].map((r) => (
                  <button key={r} className="chip" aria-pressed={minRating === r} onClick={() => setMinRating(r)}>
                    {r === 0 ? 'Any' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <span className="panel-title">Property type</span>
              {PROPERTY_TYPE_OPTIONS.map((t) => (
                <label className="checkline" key={t.id}>
                  <input
                    type="checkbox"
                    checked={types.includes(t.id)}
                    onChange={() =>
                      setTypes((prev) =>
                        prev.includes(t.id) ? prev.filter((x) => x !== t.id) : [...prev, t.id],
                      )
                    }
                  />
                  {t.label}
                </label>
              ))}
            </div>

            <div className="filter-group">
              <span className="panel-title">Must have</span>
              <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                {AMENITIES.map((a) => (
                  <button
                    key={a.id}
                    className="chip"
                    aria-pressed={requiredAmenities.includes(a.id)}
                    onClick={() =>
                      setRequiredAmenities((prev) =>
                        prev.includes(a.id) ? prev.filter((x) => x !== a.id) : [...prev, a.id],
                      )
                    }
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="checkline">
              <input
                type="checkbox"
                checked={onlyFreeCancellation}
                onChange={(e) => setOnlyFreeCancellation(e.target.checked)}
              />
              Free cancellation only
            </label>
          </aside>

          <div>
            <div className="toolbar">
              <strong>{visible.length}</strong>
              <span className="muted">
                stays in {DESTINATION_BY_ID.get(submitted.destinationId)?.city} ·{' '}
                {submittedNights} night{submittedNights > 1 ? 's' : ''} · {submitted.guests} guest
                {submitted.guests > 1 ? 's' : ''}
              </span>
              <div className="grow" />
              <span className="faint" style={{ fontSize: 12 }}>Sort</span>
              <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>

            {visible.length === 0 ? (
              <div className="card">
                <Empty
                  icon="🔍"
                  title="Nothing matches those filters"
                  body="Loosen the budget, drop a required amenity, or allow more property types."
                />
              </div>
            ) : (
              <div className="stay-grid">
                {visible.map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    nights={submittedNights}
                    rooms={submitted.rooms}
                    saved={state.savedProperties.includes(property.id)}
                    onOpen={() => setDetail(property)}
                    onToggleSave={() => dispatch({ type: 'toggle-saved', propertyId: property.id })}
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
        title="My reservations"
        subtitle={`${activeReservations.length} upcoming · ${state.stayBookings.length} total`}
        onClose={() => setReservationsOpen(false)}
      >
        {state.stayBookings.length === 0 ? (
          <Empty icon="🛎️" title="No stays booked yet" body="Reserved rooms appear here with their references." />
        ) : (
          state.stayBookings.map((b) => {
            const property = PROPERTY_INDEX.get(b.propertyId)
            const room = property?.rooms.find((r) => r.id === b.roomId)
            return (
              <div
                key={b.id}
                className="card card-pad stack"
                style={{ opacity: b.status === 'cancelled' ? 0.55 : 1 }}
              >
                <div className="row-between">
                  <div>
                    <strong>{property?.name ?? 'Property'}</strong>
                    <div className="faint" style={{ fontSize: 12 }}>
                      {property?.neighbourhood} · {room?.name ?? 'Room'}
                    </div>
                  </div>
                  <span className={cx('pill', b.status === 'confirmed' ? 'pill-accent' : 'pill-down')}>
                    {b.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                  </span>
                </div>
                <hr className="divider" />
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Dates</span>
                  <strong>{mediumDate(b.checkIn)} → {mediumDate(b.checkOut)}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Reference</span>
                  <strong className="mono">{b.reference}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Guest</span>
                  <span>{b.guestName}</span>
                </div>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Paid</span>
                  <strong className="mono">{money(b.total)}</strong>
                </div>
                {b.status === 'confirmed' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      dispatch({ type: 'cancel-stay', id: b.id })
                      notify({
                        tone: 'info',
                        title: 'Reservation cancelled',
                        body: `${money(b.total)} refunded to your wallet.`,
                      })
                    }}
                  >
                    Cancel reservation (full refund)
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
