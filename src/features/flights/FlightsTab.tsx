import { useEffect, useMemo, useState } from 'react'
import {
  airportCity,
  airportCountry,
  airportName,
  getAirport,
  searchAirports,
  type Airport,
} from '../../data/airports'
import {
  AIRLINES,
  AIRLINE_BY_CODE,
  CABINS,
  airlineName,
  cabinKey,
  searchFlights,
  type CabinClass,
  type FlightOffer,
  type FlightSearch,
} from '../../data/flights'
import { useStore } from '../../state/store'
import {
  Autocomplete,
  Counter,
  DateField,
  Empty,
  Modal,
  Select,
  SkeletonFlightCard,
} from '../../components/ui'
import { AirlineLogo } from '../../components/AirlineLogo'
import { IconCheck, IconPlane, IconSearch, IconTicket } from '../../components/icons'
import { FlightCard } from './FlightCard'
import { BookingFlow } from './BookingFlow'
import { addDays, cx, duration, durationHe, todayIso } from '../../lib/format'
import { useI18n } from '../../i18n'

type Sort = 'price' | 'duration' | 'departure' | 'arrival'

const TIME_WINDOWS = [
  { id: 'any', key: 'flights.anyTime', from: 0, to: 1440 },
  { id: 'morning', key: 'flights.morning', from: 300, to: 720 },
  { id: 'afternoon', key: 'flights.afternoon', from: 720, to: 1080 },
  { id: 'evening', key: 'flights.evening', from: 1080, to: 1440 },
] as const

export function FlightsTab() {
  const { t, locale, money, plural, arrow } = useI18n()
  const { state, dispatch, notify } = useStore()
  const dur = locale === 'he' ? durationHe : duration

  const [search, setSearch] = useState<FlightSearch>({
    from: 'TLV',
    to: 'LIS',
    departDate: addDays(todayIso(), 21),
    returnDate: addDays(todayIso(), 28),
    passengers: 1,
    cabin: 'economy',
  })
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round')
  const [query, setQuery] = useState({ from: '', to: '' })
  const [submitted, setSubmitted] = useState<FlightSearch | null>(null)
  const [loading, setLoading] = useState(false)

  const [sort, setSort] = useState<Sort>('price')
  const [maxStops, setMaxStops] = useState(2)
  const [excludedAirlines, setExcludedAirlines] = useState<string[]>([])
  const [timeWindow, setTimeWindow] = useState<string>('any')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [directionTab, setDirectionTab] = useState<'outbound' | 'return'>('outbound')

  const [pickedOutbound, setPickedOutbound] = useState<FlightOffer | null>(null)
  const [pickedReturn, setPickedReturn] = useState<FlightOffer | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [tripsOpen, setTripsOpen] = useState(false)

  // A short simulated round-trip to the "airlines" so the search reads as work
  // being done, and the skeletons have a moment to show.
  useEffect(() => {
    if (!submitted) return
    setLoading(true)
    const id = window.setTimeout(() => setLoading(false), 850)
    return () => window.clearTimeout(id)
  }, [submitted])

  const outboundOffers = useMemo(() => (submitted ? searchFlights(submitted, 'outbound') : []), [submitted])
  const returnOffers = useMemo(() => (submitted ? searchFlights(submitted, 'return') : []), [submitted])
  const activeOffers = directionTab === 'outbound' ? outboundOffers : returnOffers

  const priceCeiling = useMemo(
    () => (activeOffers.length ? Math.max(...activeOffers.map((o) => o.price)) : 0),
    [activeOffers],
  )

  const visible = useMemo(() => {
    const window = TIME_WINDOWS.find((w) => w.id === timeWindow) ?? TIME_WINDOWS[0]
    const filtered = activeOffers.filter((o) => {
      if (o.stops > maxStops) return false
      if (excludedAirlines.includes(o.airline)) return false
      if (maxPrice != null && o.price > maxPrice) return false
      const departure = o.legs[0].departMinutes % 1440
      return departure >= window.from && departure <= window.to
    })
    return [...filtered].sort((a, b) => {
      switch (sort) {
        case 'duration': return a.totalMinutes - b.totalMinutes
        case 'departure': return a.legs[0].departMinutes - b.legs[0].departMinutes
        case 'arrival': return a.legs.at(-1)!.arriveMinutes - b.legs.at(-1)!.arriveMinutes
        default: return a.price - b.price
      }
    })
  }, [activeOffers, maxStops, excludedAirlines, maxPrice, timeWindow, sort])

  const runSearch = () => {
    if (search.from === search.to) {
      notify({ tone: 'error', title: t('flights.sameAirport') })
      return
    }
    setSubmitted({ ...search, returnDate: tripType === 'round' ? search.returnDate : null })
    setPickedOutbound(null)
    setPickedReturn(null)
    setDirectionTab('outbound')
    setMaxPrice(null)
    setExcludedAirlines([])
  }

  const selectOffer = (offer: FlightOffer) => {
    if (directionTab === 'outbound') {
      setPickedOutbound(offer)
      if (submitted?.returnDate) setDirectionTab('return')
      else setCheckingOut(true)
    } else {
      setPickedReturn(offer)
      setCheckingOut(true)
    }
  }

  const readyToBook = pickedOutbound && (!submitted?.returnDate || pickedReturn)
  const activeTrips = state.flightBookings.filter((b) => b.status === 'confirmed')
  const cheapest = visible[0]

  const renderAirportOption = (airport: Airport) => (
    <div className="row-between">
      <div style={{ minWidth: 0 }}>
        <div style={{ fontWeight: 600 }}>{airportCity(airport, locale)}</div>
        <div className="faint truncate" style={{ fontSize: 11.5 }}>
          {airportName(airport, locale)} · {airportCountry(airport, locale)}
        </div>
      </div>
      <span className="mono faint">{airport.code}</span>
    </div>
  )

  return (
    <div className="page-enter">
      <section className="search-bar">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="chip" aria-pressed={tripType === 'round'} onClick={() => setTripType('round')}>
            {t('flights.roundTrip')}
          </button>
          <button className="chip" aria-pressed={tripType === 'one-way'} onClick={() => setTripType('one-way')}>
            {t('flights.oneWay')}
          </button>
          <button className="btn btn-sm" style={{ marginInlineStart: 'auto' }} onClick={() => setTripsOpen(true)}>
            <IconTicket size={15} />
            {t('flights.myTrips')}
            {activeTrips.length > 0 && ` (${activeTrips.length})`}
          </button>
        </div>

        <div className="search-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(158px, 1fr))' }}>
          <Autocomplete<Airport>
            label={t('flights.origin')}
            display={`${airportCity(getAirport(search.from), locale)} (${search.from})`}
            placeholder={t('flights.cityOrAirport')}
            options={searchAirports(query.from, locale)}
            onQuery={(q) => setQuery((p) => ({ ...p, from: q }))}
            onPick={(a) => setSearch((s) => ({ ...s, from: a.code }))}
            keyOf={(a) => a.code}
            renderOption={renderAirportOption}
          />
          <Autocomplete<Airport>
            label={t('flights.destination')}
            display={`${airportCity(getAirport(search.to), locale)} (${search.to})`}
            placeholder={t('flights.cityOrAirport')}
            options={searchAirports(query.to, locale)}
            onQuery={(q) => setQuery((p) => ({ ...p, to: q }))}
            onPick={(a) => setSearch((s) => ({ ...s, to: a.code }))}
            keyOf={(a) => a.code}
            renderOption={renderAirportOption}
          />
          {tripType === 'round' ? (
            <div style={{ gridColumn: 'span 2', minWidth: 0 }}>
              <DateField
                label={`${t('flights.departing')} — ${t('flights.returning')}`}
                range
                value={search.departDate}
                endValue={search.returnDate}
                onChange={(start, end) =>
                  setSearch((s) => ({ ...s, departDate: start, returnDate: end ?? addDays(start, 7) }))
                }
              />
            </div>
          ) : (
            <DateField
              label={t('flights.departing')}
              value={search.departDate}
              onChange={(start) => setSearch((s) => ({ ...s, departDate: start }))}
            />
          )}
          <Counter
            label={t('flights.travellers')}
            value={search.passengers}
            min={1}
            max={6}
            onChange={(passengers) => setSearch((s) => ({ ...s, passengers }))}
          />
          <div className="field">
            <label>{t('flights.cabin')}</label>
            <Select value={search.cabin} onChange={(v) => setSearch((s) => ({ ...s, cabin: v as CabinClass }))}>
              {CABINS.map((c) => (
                <option key={c.id} value={c.id}>{t(cabinKey(c.id))}</option>
              ))}
            </Select>
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="btn btn-primary btn-lg btn-block" onClick={runSearch}>
              <IconSearch size={16} />
              {t('flights.searchCta')}
            </button>
          </div>
        </div>
      </section>

      {!submitted && (
        <div className="card" style={{ marginTop: 22 }}>
          <Empty icon={<IconPlane size={34} />} title={t('flights.emptyTitle')} body={t('flights.emptyBody')} />
        </div>
      )}

      {submitted && (
        <>
          <div className="results-layout">
            <aside className="card filters">
              <div className="row-between">
                <span className="panel-title">{t('common.filters')}</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setMaxStops(2)
                    setExcludedAirlines([])
                    setTimeWindow('any')
                    setMaxPrice(null)
                  }}
                >
                  {t('common.reset')}
                </button>
              </div>

              <div className="filter-group">
                <span className="panel-title">{t('flights.stopsFilter')}</span>
                {[
                  { value: 0, label: t('flights.directOnly') },
                  { value: 1, label: t('flights.upToOneStop') },
                  { value: 2, label: t('flights.anyStops') },
                ].map((o) => (
                  <label className="checkline" key={o.value}>
                    <input type="radio" name="stops" checked={maxStops === o.value} onChange={() => setMaxStops(o.value)} />
                    {o.label}
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <span className="panel-title">{t('flights.departureTime')}</span>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {TIME_WINDOWS.map((w) => (
                    <button key={w.id} className="chip" aria-pressed={timeWindow === w.id} onClick={() => setTimeWindow(w.id)}>
                      {t(w.key)}
                    </button>
                  ))}
                </div>
              </div>

              {priceCeiling > 0 && (
                <div className="filter-group">
                  <span className="panel-title">{t('flights.maxPrice')}</span>
                  <input
                    type="range"
                    min={0}
                    max={priceCeiling}
                    step={10}
                    value={maxPrice ?? priceCeiling}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    aria-label={t('flights.maxPrice')}
                  />
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {t('flights.upTo', { amount: money(maxPrice ?? priceCeiling) })}
                  </span>
                </div>
              )}

              <div className="filter-group">
                <span className="panel-title">{t('flights.airlines')}</span>
                {AIRLINES.map((a) => (
                  <label className="checkline" key={a.code}>
                    <input
                      type="checkbox"
                      checked={!excludedAirlines.includes(a.code)}
                      onChange={() =>
                        setExcludedAirlines((prev) =>
                          prev.includes(a.code) ? prev.filter((c) => c !== a.code) : [...prev, a.code],
                        )
                      }
                    />
                    <AirlineLogo mark={a.mark} color={a.color} size={18} />
                    {airlineName(a, locale)}
                  </label>
                ))}
              </div>
            </aside>

            <div>
              {submitted.returnDate && (
                <div className="toolbar">
                  <div className="tabs" style={{ gap: 10 }}>
                    <button className="tab" aria-selected={directionTab === 'outbound'} onClick={() => setDirectionTab('outbound')}>
                      {t('flights.outbound')} · {airportCity(getAirport(submitted.from), locale)} {arrow} {airportCity(getAirport(submitted.to), locale)}
                      {pickedOutbound && <span className="badge"><IconCheck size={11} /></span>}
                    </button>
                    <button className="tab" aria-selected={directionTab === 'return'} onClick={() => setDirectionTab('return')}>
                      {t('flights.return')} · {airportCity(getAirport(submitted.to), locale)} {arrow} {airportCity(getAirport(submitted.from), locale)}
                      {pickedReturn && <span className="badge"><IconCheck size={11} /></span>}
                    </button>
                  </div>
                </div>
              )}

              <div className="toolbar">
                {loading ? (
                  <span className="row muted" style={{ gap: 8 }}>
                    <span className="spinner-inline" />
                    {t('loading.flights', { count: AIRLINES.length })}
                  </span>
                ) : (
                  <>
                    <strong>{visible.length}</strong>
                    <span className="muted">
                      {t('flights.ofFlights', { total: activeOffers.length })} · {t(cabinKey(submitted.cabin))}
                    </span>
                  </>
                )}
                <div className="grow" />
                <span className="faint" style={{ fontSize: 12.5 }}>{t('common.sort')}</span>
                <Select value={sort} onChange={(v) => setSort(v as Sort)} style={{ width: 'auto' }} ariaLabel={t('common.sort')}>
                  <option value="price">{t('flights.sortCheapest')}</option>
                  <option value="duration">{t('flights.sortFastest')}</option>
                  <option value="departure">{t('flights.sortDeparture')}</option>
                  <option value="arrival">{t('flights.sortArrival')}</option>
                </Select>
              </div>

              {loading ? (
                <div className="result-list">
                  {Array.from({ length: 4 }, (_, i) => <SkeletonFlightCard key={i} />)}
                </div>
              ) : visible.length === 0 ? (
                <div className="card">
                  <Empty icon={<IconSearch size={32} />} title={t('flights.noMatch')} body={t('flights.noMatchBody')} />
                </div>
              ) : (
                <>
                  {cheapest && (
                    <div className="card card-pad row" style={{ marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
                      <span className="pill pill-brand">{t('flights.bestValue')}</span>
                      <span className="muted">
                        {t('flights.bestValueBody', {
                          airline: airlineName(AIRLINE_BY_CODE.get(cheapest.airline)!, locale),
                          price: money(cheapest.price),
                          duration: `${dur(cheapest.totalMinutes)}, ${plural.stops(cheapest.stops)}`,
                        })}
                      </span>
                    </div>
                  )}
                  <div className="result-list stagger">
                    {visible.map((offer) => (
                      <FlightCard
                        key={offer.id}
                        offer={offer}
                        passengers={submitted.passengers}
                        selected={directionTab === 'outbound' ? pickedOutbound?.id === offer.id : pickedReturn?.id === offer.id}
                        onSelect={selectOffer}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {readyToBook && !checkingOut && (
            <div className="card card-pad row" style={{ position: 'sticky', bottom: 16, marginTop: 16, boxShadow: 'var(--shadow-lg)', flexWrap: 'wrap' }}>
              <span className="pill pill-brand">{t('flights.selectionReady')}</span>
              <span className="muted grow truncate">
                {pickedOutbound && `${pickedOutbound.legs[0].from} ${arrow} ${pickedOutbound.legs.at(-1)!.to}`}
                {pickedReturn && ` · ${pickedReturn.legs[0].from} ${arrow} ${pickedReturn.legs.at(-1)!.to}`}
              </span>
              <button className="btn btn-primary" onClick={() => setCheckingOut(true)}>
                {t('flights.continueBooking')}
              </button>
            </div>
          )}
        </>
      )}

      {checkingOut && pickedOutbound && (
        <BookingFlow
          outbound={pickedOutbound}
          inbound={pickedReturn}
          passengerCount={submitted?.passengers ?? 1}
          onClose={() => setCheckingOut(false)}
        />
      )}

      <Modal
        open={tripsOpen}
        title={t('flights.myTrips')}
        subtitle={t('flights.upcomingTotal', { active: activeTrips.length, total: state.flightBookings.length })}
        onClose={() => setTripsOpen(false)}
      >
        {state.flightBookings.length === 0 ? (
          <Empty icon={<IconTicket size={32} />} title={t('flights.noTrips')} body={t('flights.noTripsBody')} />
        ) : (
          state.flightBookings.map((booking) => {
            const first = booking.outbound.legs[0]
            const last = booking.outbound.legs.at(-1)!
            const airline = AIRLINE_BY_CODE.get(booking.outbound.airline)
            return (
              <div key={booking.id} className="card card-pad stack" style={{ opacity: booking.status === 'cancelled' ? 0.55 : 1 }}>
                <div className="row-between">
                  <div className="row">
                    {airline && <AirlineLogo mark={airline.mark} color={airline.color} size={22} />}
                    <div>
                      <strong>
                        {airportCity(getAirport(first.from), locale)} {arrow} {airportCity(getAirport(last.to), locale)}
                        {booking.inbound && t('flights.andBack')}
                      </strong>
                      <div className="faint" style={{ fontSize: 12.5 }}>
                        {airline && airlineName(airline, locale)} · {t(cabinKey(booking.cabin))}
                      </div>
                    </div>
                  </div>
                  <span className={cx('pill', booking.status === 'confirmed' ? 'pill-brand' : 'pill-down')}>
                    {booking.status === 'confirmed' ? t('common.confirmed') : t('common.cancelled')}
                  </span>
                </div>
                <hr className="divider" />
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{t('common.reference')}</span>
                  <strong className="mono">{booking.reference}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{plural.travellers(booking.passengers.length)}</span>
                  <span className="mono">{booking.passengers.map((p) => p.seat ?? '—').join(', ')}</span>
                </div>
                <div className="row-between" style={{ fontSize: 13.5 }}>
                  <span className="muted">{t('common.paid')}</span>
                  <strong className="mono">{money(booking.total)}</strong>
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      dispatch({ type: 'cancel-flight', id: booking.id })
                      notify({
                        tone: 'info',
                        title: t('flights.cancelledToast'),
                        body: booking.extras.flexible ? t('flights.refundFull') : t('flights.refundPartial'),
                      })
                    }}
                  >
                    {t('flights.cancelBooking')}
                    {!booking.extras.flexible && t('flights.cancelFee')}
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
