import { useMemo, useState } from 'react'
import {
  AIRLINE_BY_CODE,
  buildSeatMap,
  cabinLabel,
  type FlightOffer,
} from '../../data/flights'
import type { Passenger } from '../../state/types'
import { useStore } from '../../state/store'
import { Modal, Steps } from '../../components/ui'
import { clock, cx, duration, money, shortDate } from '../../lib/format'

const STEPS = ['Review', 'Seats', 'Travellers', 'Payment']

const BAG_FEE = 45
const INSURANCE_FEE = 29
const FLEX_RATE = 0.12

function OfferSummary({ offer, label }: { offer: FlightOffer; label: string }) {
  const airline = AIRLINE_BY_CODE.get(offer.airline)
  const first = offer.legs[0]
  const last = offer.legs[offer.legs.length - 1]
  return (
    <div className="card card-pad" style={{ background: 'var(--surface)' }}>
      <div className="row-between" style={{ marginBottom: 8 }}>
        <span className="panel-title">{label}</span>
        <span className="faint" style={{ fontSize: 12 }}>{shortDate(offer.departDate)}</span>
      </div>
      <div className="row" style={{ gap: 8, marginBottom: 8 }}>
        <span className="airline-dot" style={{ background: airline?.color }} />
        <strong style={{ fontSize: 13 }}>{airline?.name}</strong>
        <span className="faint mono" style={{ fontSize: 12 }}>
          {offer.legs.map((l) => l.flightNumber).join(' · ')}
        </span>
      </div>
      <div className="row-between">
        <div>
          <div className="mono" style={{ fontSize: 18, fontWeight: 650 }}>{clock(first.departMinutes)}</div>
          <div className="faint" style={{ fontSize: 11.5 }}>{first.from}</div>
        </div>
        <div className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
          {duration(offer.totalMinutes)}
          <br />
          {offer.stops === 0 ? 'Direct' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 18, fontWeight: 650 }}>
            {clock(last.arriveMinutes)}
            {offer.dayOffset > 0 && <span className="sup">+{offer.dayOffset}</span>}
          </div>
          <div className="faint" style={{ fontSize: 11.5 }}>{last.to}</div>
        </div>
      </div>
    </div>
  )
}

function SeatPicker({
  offer,
  passengers,
  assignments,
  onAssign,
}: {
  offer: FlightOffer
  passengers: number
  assignments: (string | null)[]
  onAssign: (index: number, seat: string | null) => void
}) {
  const rows = useMemo(() => buildSeatMap(offer.id, offer.cabin), [offer.id, offer.cabin])
  const [active, setActive] = useState(0)
  const seatFeeOf = (seatId: string) =>
    rows.flatMap((r) => r.seats).find((s) => s.id === seatId)?.fee ?? 0

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: passengers }, (_, i) => (
          <button
            key={i}
            className="chip"
            aria-pressed={active === i}
            onClick={() => setActive(i)}
          >
            Traveller {i + 1}
            {assignments[i] ? ` · ${assignments[i]}` : ' · pick a seat'}
          </button>
        ))}
      </div>

      <div className="seatmap">
        <div
          className="faint"
          style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}
        >
          ▲ Front of aircraft
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((row) => (
            <div className="seat-row" key={row.row}>
              <span className="seat-row-num">{row.row}</span>
              {row.seats.map((seat, index) => (
                <div key={seat.id} style={{ display: 'contents' }}>
                  {index === Math.ceil(row.seats.length / 2) && <span className="seat-aisle" />}
                  <button
                    className={cx(
                      'seat',
                      seat.taken && 'taken',
                      seat.extraLegroom && 'legroom',
                      assignments.includes(seat.id) && 'picked',
                    )}
                    disabled={seat.taken}
                    title={
                      seat.taken
                        ? 'Occupied'
                        : `${seat.id}${seat.fee ? ` · +${money(seat.fee)}` : ' · free'}`
                    }
                    onClick={() => {
                      const alreadyAt = assignments.indexOf(seat.id)
                      if (alreadyAt >= 0) {
                        onAssign(alreadyAt, null)
                        return
                      }
                      onAssign(active, seat.id)
                      setActive((a) => Math.min(passengers - 1, a + 1))
                    }}
                  >
                    {seat.id.replace(/^\d+/, '')}
                  </button>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="seat-legend" style={{ marginTop: 10 }}>
          <span><i style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }} />Available</span>
          <span><i style={{ background: 'var(--surface)', border: '1px solid var(--line-soft)' }} />Occupied</span>
          <span><i style={{ background: 'transparent', border: '1px solid rgba(251,191,36,.5)' }} />Extra legroom · {money(38)}</span>
          <span><i style={{ background: 'var(--accent)' }} />Your seat</span>
        </div>
      </div>

      <div className="faint" style={{ fontSize: 12.5 }}>
        Seat fees so far:{' '}
        <strong className="mono">
          {money(assignments.reduce((sum, s) => sum + (s ? seatFeeOf(s) : 0), 0))}
        </strong>
        . Seats are optional — skip to have them assigned at check-in.
      </div>
    </div>
  )
}

export function BookingFlow({
  outbound,
  inbound,
  passengerCount,
  onClose,
}: {
  outbound: FlightOffer
  inbound: FlightOffer | null
  passengerCount: number
  onClose: () => void
}) {
  const { state, dispatch, notify } = useStore()
  const [step, setStep] = useState(0)
  const [seats, setSeats] = useState<(string | null)[]>(Array(passengerCount).fill(null))
  const [people, setPeople] = useState<Passenger[]>(
    Array.from({ length: passengerCount }, () => ({
      firstName: '',
      lastName: '',
      email: '',
      seat: null,
    })),
  )
  const [bags, setBags] = useState(0)
  const [insurance, setInsurance] = useState(false)
  const [flexible, setFlexible] = useState(false)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const seatRows = useMemo(() => buildSeatMap(outbound.id, outbound.cabin), [outbound.id, outbound.cabin])
  const seatFees = useMemo(() => {
    const all = seatRows.flatMap((r) => r.seats)
    return seats.reduce((sum, id) => sum + (id ? all.find((s) => s.id === id)?.fee ?? 0 : 0), 0)
  }, [seats, seatRows])

  const fareTotal = (outbound.price + (inbound?.price ?? 0)) * passengerCount
  const bagTotal = bags * BAG_FEE
  const insuranceTotal = insurance ? INSURANCE_FEE * passengerCount : 0
  const flexTotal = flexible ? Math.round(fareTotal * FLEX_RATE) : 0
  const taxes = Math.round(fareTotal * 0.11)
  const total = fareTotal + taxes + seatFees + bagTotal + insuranceTotal + flexTotal
  const affordable = total <= state.cash

  const detailsComplete = people.every(
    (p) => p.firstName.trim() && p.lastName.trim() && /.+@.+\..+/.test(p.email),
  )

  const updatePerson = (index: number, patch: Partial<Passenger>) =>
    setPeople((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)))

  const confirm = () => {
    if (!affordable) {
      notify({ tone: 'error', title: 'Not enough cash', body: 'Add funds from the wallet menu.' })
      return
    }
    dispatch({
      type: 'book-flight',
      booking: {
        outbound,
        inbound,
        passengers: people.map((p, i) => ({ ...p, seat: seats[i] })),
        cabin: outbound.cabin,
        seatFees,
        extras: { bags, insurance, flexible },
        total,
      },
    })
    const reference = `SKY-${outbound.id.slice(-4).toUpperCase()}`
    setConfirmation(reference)
    notify({
      tone: 'success',
      title: 'Flight booked',
      body: `${money(total)} charged · ${outbound.legs[0].from} → ${outbound.legs.at(-1)!.to}`,
    })
  }

  if (confirmation) {
    return (
      <Modal open title="Booking confirmed" onClose={onClose} size="narrow"
        footer={<button className="btn btn-primary btn-block" onClick={onClose}>Done</button>}>
        <div style={{ textAlign: 'center', display: 'grid', gap: 12, padding: '12px 0' }}>
          <div style={{ fontSize: 44 }}>🎫</div>
          <h3 style={{ fontSize: 20 }}>You're flying.</h3>
          <p className="muted">
            {outbound.legs[0].from} → {outbound.legs.at(-1)!.to}
            {inbound && ' and back'} on {shortDate(outbound.departDate)}.
          </p>
          <div className="order-summary" style={{ textAlign: 'left' }}>
            <div className="row-between"><span className="muted">Travellers</span><strong>{passengerCount}</strong></div>
            <div className="row-between"><span className="muted">Cabin</span><strong>{cabinLabel(outbound.cabin)}</strong></div>
            <div className="row-between"><span className="muted">Seats</span>
              <strong className="mono">{seats.filter(Boolean).join(', ') || 'At check-in'}</strong>
            </div>
            <hr className="divider" />
            <div className="row-between"><span className="muted">Charged</span>
              <strong className="mono">{money(total)}</strong>
            </div>
          </div>
          <p className="faint" style={{ fontSize: 12 }}>
            Find it any time under <strong>My trips</strong>.
          </p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      size="wide"
      title="Complete your booking"
      subtitle={<Steps steps={STEPS} current={step} />}
      onClose={onClose}
      footer={
        <>
          <button
            className="btn"
            onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <div className="grow" style={{ textAlign: 'right' }}>
            <div className="faint" style={{ fontSize: 11 }}>Total</div>
            <strong className="mono" style={{ fontSize: 18 }}>{money(total)}</strong>
          </div>
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary btn-lg"
              disabled={step === 2 && !detailsComplete}
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={confirm} disabled={!affordable}>
              {affordable ? `Pay ${money(total)}` : 'Insufficient funds'}
            </button>
          )}
        </>
      }
    >
      {step === 0 && (
        <div className="stack" style={{ gap: 14 }}>
          <OfferSummary offer={outbound} label="Outbound" />
          {inbound && <OfferSummary offer={inbound} label="Return" />}
          <div className="order-summary">
            <div className="row-between">
              <span className="muted">
                Fare × {passengerCount} traveller{passengerCount > 1 ? 's' : ''}
              </span>
              <span className="mono">{money(fareTotal)}</span>
            </div>
            <div className="row-between">
              <span className="muted">Taxes & carrier charges</span>
              <span className="mono">{money(taxes)}</span>
            </div>
          </div>
        </div>
      )}

      {step === 1 && (
        <>
          {inbound && (
            <p className="faint" style={{ fontSize: 12.5 }}>
              These seats are for the outbound flight. Return seats are assigned at check-in.
            </p>
          )}
          <SeatPicker
            offer={outbound}
            passengers={passengerCount}
            assignments={seats}
            onAssign={(i, seat) => setSeats((prev) => prev.map((s, idx) => (idx === i ? seat : s)))}
          />
        </>
      )}

      {step === 2 && (
        <div className="stack" style={{ gap: 14 }}>
          {people.map((person, i) => (
            <div key={i} className="card card-pad">
              <div className="row-between" style={{ marginBottom: 10 }}>
                <span className="panel-title">Traveller {i + 1}</span>
                {seats[i] && <span className="pill pill-accent">Seat {seats[i]}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>First name</label>
                  <input
                    className="input"
                    value={person.firstName}
                    placeholder="Alex"
                    onChange={(e) => updatePerson(i, { firstName: e.target.value })}
                  />
                </div>
                <div className="field">
                  <label>Last name</label>
                  <input
                    className="input"
                    value={person.lastName}
                    placeholder="Moreau"
                    onChange={(e) => updatePerson(i, { lastName: e.target.value })}
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>Email for the itinerary</label>
                  <input
                    className="input"
                    type="email"
                    value={person.email}
                    placeholder="alex@example.com"
                    onChange={(e) => updatePerson(i, { email: e.target.value })}
                  />
                </div>
              </div>
            </div>
          ))}
          {!detailsComplete && (
            <p className="faint" style={{ fontSize: 12.5 }}>
              Fill in every traveller (a valid email included) to continue.
            </p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad stack" style={{ gap: 12 }}>
            <span className="panel-title">Extras</span>
            <div className="row-between">
              <div>
                <strong>Checked bags</strong>
                <div className="faint" style={{ fontSize: 12 }}>{money(BAG_FEE)} each, up to 23 kg</div>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm" onClick={() => setBags((b) => Math.max(0, b - 1))} disabled={bags === 0}>−</button>
                <span className="mono" style={{ width: 22, textAlign: 'center' }}>{bags}</span>
                <button className="btn btn-sm" onClick={() => setBags((b) => Math.min(8, b + 1))}>+</button>
              </div>
            </div>
            <hr className="divider" />
            <label className="row-between" style={{ cursor: 'pointer' }}>
              <div>
                <strong>Travel insurance</strong>
                <div className="faint" style={{ fontSize: 12 }}>
                  {money(INSURANCE_FEE)} per traveller · medical and delay cover
                </div>
              </div>
              <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--accent-strong)' }} />
            </label>
            <hr className="divider" />
            <label className="row-between" style={{ cursor: 'pointer' }}>
              <div>
                <strong>Flexible fare</strong>
                <div className="faint" style={{ fontSize: 12 }}>
                  +12% · cancel any time for a full refund
                </div>
              </div>
              <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--accent-strong)' }} />
            </label>
          </div>

          <div className="order-summary">
            <div className="row-between"><span className="muted">Fare × {passengerCount}</span><span className="mono">{money(fareTotal)}</span></div>
            <div className="row-between"><span className="muted">Taxes & charges</span><span className="mono">{money(taxes)}</span></div>
            {seatFees > 0 && <div className="row-between"><span className="muted">Seat selection</span><span className="mono">{money(seatFees)}</span></div>}
            {bagTotal > 0 && <div className="row-between"><span className="muted">Checked bags × {bags}</span><span className="mono">{money(bagTotal)}</span></div>}
            {insuranceTotal > 0 && <div className="row-between"><span className="muted">Insurance</span><span className="mono">{money(insuranceTotal)}</span></div>}
            {flexTotal > 0 && <div className="row-between"><span className="muted">Flexible fare</span><span className="mono">{money(flexTotal)}</span></div>}
            <hr className="divider" />
            <div className="row-between">
              <strong>Total due</strong>
              <strong className="mono" style={{ fontSize: 17 }}>{money(total)}</strong>
            </div>
            <div className="row-between faint" style={{ fontSize: 12 }}>
              <span>Wallet balance</span>
              <span className={cx('mono', !affordable && 'down')}>{money(state.cash)}</span>
            </div>
          </div>

          {!affordable && (
            <p className="down" style={{ fontSize: 13 }}>
              This booking exceeds your wallet balance. Top up from the wallet menu in the header.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
