import { useMemo, useState } from 'react'
import { searchAirports, getAirport, type Airport } from '../../data/airports'
import {
  AIRLINES,
  AIRLINE_BY_CODE,
  CABINS,
  cabinLabel,
  searchFlights,
  type CabinClass,
  type FlightOffer,
  type FlightSearch,
} from '../../data/flights'
import { useStore } from '../../state/store'
import { Autocomplete, Counter, Empty, Modal } from '../../components/ui'
import { FlightCard } from './FlightCard'
import { BookingFlow } from './BookingFlow'
import { addDays, cx, duration, mediumDate, money, shortDate, todayIso } from '../../lib/format'

type Sort = 'price' | 'duration' | 'departure' | 'arrival'

const SORTS: { id: Sort; label: string }[] = [
  { id: 'price', label: 'Cheapest' },
  { id: 'duration', label: 'Fastest' },
  { id: 'departure', label: 'Earliest departure' },
  { id: 'arrival', label: 'Earliest arrival' },
]

const TIME_WINDOWS = [
  { id: 'any', label: 'Any time', from: 0, to: 1440 },
  { id: 'morning', label: 'Morning', from: 300, to: 720 },
  { id: 'afternoon', label: 'Afternoon', from: 720, to: 1080 },
  { id: 'evening', label: 'Evening', from: 1080, to: 1440 },
]

export function FlightsTab() {
  const { state, dispatch, notify } = useStore()

  const [search, setSearch] = useState<FlightSearch>({
    from: 'JFK',
    to: 'LIS',
    departDate: addDays(todayIso(), 21),
    returnDate: addDays(todayIso(), 28),
    passengers: 1,
    cabin: 'economy',
  })
  const [tripType, setTripType] = useState<'round' | 'one-way'>('round')
  const [query, setQuery] = useState({ from: '', to: '' })
  const [submitted, setSubmitted] = useState<FlightSearch | null>(null)

  const [sort, setSort] = useState<Sort>('price')
  const [maxStops, setMaxStops] = useState(2)
  const [excludedAirlines, setExcludedAirlines] = useState<string[]>([])
  const [timeWindow, setTimeWindow] = useState('any')
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [directionTab, setDirectionTab] = useState<'outbound' | 'return'>('outbound')

  const [pickedOutbound, setPickedOutbound] = useState<FlightOffer | null>(null)
  const [pickedReturn, setPickedReturn] = useState<FlightOffer | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [tripsOpen, setTripsOpen] = useState(false)

  const outboundOffers = useMemo(
    () => (submitted ? searchFlights(submitted, 'outbound') : []),
    [submitted],
  )
  const returnOffers = useMemo(
    () => (submitted ? searchFlights(submitted, 'return') : []),
    [submitted],
  )

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
    const sorted = [...filtered]
    sorted.sort((a, b) => {
      switch (sort) {
        case 'duration':
          return a.totalMinutes - b.totalMinutes
        case 'departure':
          return a.legs[0].departMinutes - b.legs[0].departMinutes
        case 'arrival':
          return a.legs.at(-1)!.arriveMinutes - b.legs.at(-1)!.arriveMinutes
        default:
          return a.price - b.price
      }
    })
    return sorted
  }, [activeOffers, maxStops, excludedAirlines, maxPrice, timeWindow, sort])

  const runSearch = () => {
    if (search.from === search.to) {
      notify({ tone: 'error', title: 'Pick two different airports' })
      return
    }
    const next: FlightSearch = {
      ...search,
      returnDate: tripType === 'round' ? search.returnDate : null,
    }
    setSubmitted(next)
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

  return (
    <div>
      <section className="search-bar">
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button
            className="chip"
            aria-pressed={tripType === 'round'}
            onClick={() => setTripType('round')}
          >
            Round trip
          </button>
          <button
            className="chip"
            aria-pressed={tripType === 'one-way'}
            onClick={() => setTripType('one-way')}
          >
            One way
          </button>
          <div style={{ marginLeft: 'auto' }} className="row">
            <button className="btn btn-sm" onClick={() => setTripsOpen(true)}>
              🎫 My trips {activeTrips.length > 0 && `(${activeTrips.length})`}
            </button>
          </div>
        </div>

        <div
          className="search-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}
        >
          <Autocomplete<Airport>
            label="From"
            value={search.from}
            display={`${getAirport(search.from).city} (${search.from})`}
            placeholder="City or airport"
            options={searchAirports(query.from)}
            onQuery={(q) => setQuery((p) => ({ ...p, from: q }))}
            onPick={(a) => setSearch((s) => ({ ...s, from: a.code }))}
            keyOf={(a) => a.code}
            renderOption={(a) => (
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 600 }}>{a.city}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>{a.name}</div>
                </div>
                <span className="mono faint">{a.code}</span>
              </div>
            )}
          />
          <Autocomplete<Airport>
            label="To"
            value={search.to}
            display={`${getAirport(search.to).city} (${search.to})`}
            placeholder="City or airport"
            options={searchAirports(query.to)}
            onQuery={(q) => setQuery((p) => ({ ...p, to: q }))}
            onPick={(a) => setSearch((s) => ({ ...s, to: a.code }))}
            keyOf={(a) => a.code}
            renderOption={(a) => (
              <div className="row-between">
                <div>
                  <div style={{ fontWeight: 600 }}>{a.city}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>{a.name}</div>
                </div>
                <span className="mono faint">{a.code}</span>
              </div>
            )}
          />
          <div className="field">
            <label>Departing</label>
            <input
              className="input"
              type="date"
              min={todayIso()}
              value={search.departDate}
              onChange={(e) => {
                const departDate = e.target.value
                setSearch((s) => ({
                  ...s,
                  departDate,
                  returnDate:
                    s.returnDate && s.returnDate < departDate ? addDays(departDate, 7) : s.returnDate,
                }))
              }}
            />
          </div>
          <div className="field">
            <label>Returning</label>
            <input
              className="input"
              type="date"
              min={search.departDate}
              disabled={tripType === 'one-way'}
              value={search.returnDate ?? ''}
              onChange={(e) => setSearch((s) => ({ ...s, returnDate: e.target.value }))}
            />
          </div>
          <Counter
            label="Travellers"
            value={search.passengers}
            min={1}
            max={6}
            onChange={(passengers) => setSearch((s) => ({ ...s, passengers }))}
          />
          <div className="field">
            <label>Cabin</label>
            <select
              className="select"
              value={search.cabin}
              onChange={(e) => setSearch((s) => ({ ...s, cabin: e.target.value as CabinClass }))}
            >
              {CABINS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>&nbsp;</label>
            <button className="btn btn-primary btn-lg btn-block" onClick={runSearch}>
              Search flights
            </button>
          </div>
        </div>
      </section>

      {!submitted && (
        <div className="card" style={{ marginTop: 18 }}>
          <Empty
            icon="✈️"
            title="Where are you going?"
            body="Pick an origin, a destination and your dates, then search. Every fare, schedule and seat map here is simulated — nothing is charged to a real card."
          />
        </div>
      )}

      {submitted && (
        <>
          <div className="results-layout">
            <aside className="card filters">
              <div className="row-between">
                <span className="panel-title">Filters</span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setMaxStops(2)
                    setExcludedAirlines([])
                    setTimeWindow('any')
                    setMaxPrice(null)
                  }}
                >
                  Reset
                </button>
              </div>

              <div className="filter-group">
                <span className="panel-title">Stops</span>
                {[
                  { value: 0, label: 'Direct only' },
                  { value: 1, label: 'Up to 1 stop' },
                  { value: 2, label: 'Any number' },
                ].map((o) => (
                  <label className="checkline" key={o.value}>
                    <input
                      type="radio"
                      name="stops"
                      checked={maxStops === o.value}
                      onChange={() => setMaxStops(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>

              <div className="filter-group">
                <span className="panel-title">Departure time</span>
                <div className="row" style={{ flexWrap: 'wrap', gap: 6 }}>
                  {TIME_WINDOWS.map((w) => (
                    <button
                      key={w.id}
                      className="chip"
                      aria-pressed={timeWindow === w.id}
                      onClick={() => setTimeWindow(w.id)}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>

              {priceCeiling > 0 && (
                <div className="filter-group">
                  <span className="panel-title">Max price</span>
                  <input
                    type="range"
                    min={0}
                    max={priceCeiling}
                    step={10}
                    value={maxPrice ?? priceCeiling}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                  />
                  <span className="faint" style={{ fontSize: 12 }}>
                    Up to {money(maxPrice ?? priceCeiling)}
                  </span>
                </div>
              )}

              <div className="filter-group">
                <span className="panel-title">Airlines</span>
                {AIRLINES.map((a) => (
                  <label className="checkline" key={a.code}>
                    <input
                      type="checkbox"
                      checked={!excludedAirlines.includes(a.code)}
                      onChange={() =>
                        setExcludedAirlines((prev) =>
                          prev.includes(a.code)
                            ? prev.filter((c) => c !== a.code)
                            : [...prev, a.code],
                        )
                      }
                    />
                    <span className="airline-dot" style={{ background: a.color }} />
                    {a.name}
                  </label>
                ))}
              </div>
            </aside>

            <div>
              {submitted.returnDate && (
                <div className="toolbar">
                  <div className="tabs">
                    <button
                      className="tab"
                      aria-selected={directionTab === 'outbound'}
                      onClick={() => setDirectionTab('outbound')}
                    >
                      Outbound · {getAirport(submitted.from).city} → {getAirport(submitted.to).city}
                      {pickedOutbound && <span className="badge">✓</span>}
                    </button>
                    <button
                      className="tab"
                      aria-selected={directionTab === 'return'}
                      onClick={() => setDirectionTab('return')}
                    >
                      Return · {getAirport(submitted.to).city} → {getAirport(submitted.from).city}
                      {pickedReturn && <span className="badge">✓</span>}
                    </button>
                  </div>
                </div>
              )}

              <div className="toolbar">
                <strong>{visible.length}</strong>
                <span className="muted">
                  of {activeOffers.length} flights ·{' '}
                  {shortDate(directionTab === 'outbound' ? submitted.departDate : submitted.returnDate!)} ·{' '}
                  {cabinLabel(submitted.cabin)}
                </span>
                <div className="grow" />
                <span className="faint" style={{ fontSize: 12 }}>Sort</span>
                <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  {SORTS.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>

              {cheapest && (
                <div
                  className="card card-pad row"
                  style={{ marginBottom: 12, gap: 10, borderColor: 'rgba(94,234,212,.28)' }}
                >
                  <span className="pill pill-accent">Best value</span>
                  <span className="muted">
                    {AIRLINE_BY_CODE.get(cheapest.airline)?.name} at{' '}
                    <strong className="mono" style={{ color: 'var(--text)' }}>{money(cheapest.price)}</strong>,{' '}
                    {duration(cheapest.totalMinutes)}
                    {cheapest.stops === 0 ? ', direct' : `, ${cheapest.stops} stop`}
                  </span>
                </div>
              )}

              {visible.length === 0 ? (
                <div className="card">
                  <Empty
                    icon="🔍"
                    title="No flights match these filters"
                    body="Try allowing more stops, widening the departure window, or raising the price cap."
                  />
                </div>
              ) : (
                <div className="result-list">
                  {visible.map((offer) => (
                    <FlightCard
                      key={offer.id}
                      offer={offer}
                      passengers={submitted.passengers}
                      selected={
                        directionTab === 'outbound'
                          ? pickedOutbound?.id === offer.id
                          : pickedReturn?.id === offer.id
                      }
                      onSelect={selectOffer}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {readyToBook && !checkingOut && (
            <div
              className="card card-pad row"
              style={{ position: 'sticky', bottom: 16, marginTop: 16, boxShadow: 'var(--shadow-lg)' }}
            >
              <span className="pill pill-accent">Selection ready</span>
              <span className="muted grow truncate">
                {pickedOutbound && `${pickedOutbound.legs[0].from} → ${pickedOutbound.legs.at(-1)!.to}`}
                {pickedReturn && ` · return ${pickedReturn.legs[0].from} → ${pickedReturn.legs.at(-1)!.to}`}
              </span>
              <button className="btn btn-primary" onClick={() => setCheckingOut(true)}>
                Continue to booking
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
        title="My trips"
        subtitle={`${activeTrips.length} upcoming · ${state.flightBookings.length} total`}
        onClose={() => setTripsOpen(false)}
      >
        {state.flightBookings.length === 0 ? (
          <Empty icon="🧳" title="No flights booked yet" body="Your confirmed itineraries show up here." />
        ) : (
          state.flightBookings.map((booking) => {
            const first = booking.outbound.legs[0]
            const last = booking.outbound.legs.at(-1)!
            return (
              <div
                key={booking.id}
                className={cx('card', 'card-pad', 'stack')}
                style={{ opacity: booking.status === 'cancelled' ? 0.55 : 1 }}
              >
                <div className="row-between">
                  <div>
                    <strong>
                      {getAirport(first.from).city} → {getAirport(last.to).city}
                      {booking.inbound && ' → back'}
                    </strong>
                    <div className="faint" style={{ fontSize: 12 }}>
                      {mediumDate(booking.outbound.departDate)} ·{' '}
                      {AIRLINE_BY_CODE.get(booking.outbound.airline)?.name} ·{' '}
                      {cabinLabel(booking.cabin)}
                    </div>
                  </div>
                  <span className={cx('pill', booking.status === 'confirmed' ? 'pill-accent' : 'pill-down')}>
                    {booking.status === 'confirmed' ? 'Confirmed' : 'Cancelled'}
                  </span>
                </div>
                <hr className="divider" />
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Reference</span>
                  <strong className="mono">{booking.reference}</strong>
                </div>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">
                    {booking.passengers.length} traveller{booking.passengers.length > 1 ? 's' : ''}
                  </span>
                  <span className="mono">
                    {booking.passengers.map((p) => p.seat ?? '—').join(', ')}
                  </span>
                </div>
                <div className="row-between" style={{ fontSize: 13 }}>
                  <span className="muted">Paid</span>
                  <strong className="mono">{money(booking.total)}</strong>
                </div>
                {booking.status === 'confirmed' && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      dispatch({ type: 'cancel-flight', id: booking.id })
                      notify({
                        tone: 'info',
                        title: 'Booking cancelled',
                        body: booking.extras.flexible
                          ? 'Flexible fare — refunded in full.'
                          : '80% of the fare was refunded to your wallet.',
                      })
                    }}
                  >
                    Cancel booking
                    {!booking.extras.flexible && ' (20% fee)'}
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
