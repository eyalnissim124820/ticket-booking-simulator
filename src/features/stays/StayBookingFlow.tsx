import { useState } from 'react'
import { AMENITY_BY_ID, stayTotal, type Property, type RoomOption } from '../../data/hotels'
import { useStore } from '../../state/store'
import { Modal, Steps } from '../../components/ui'
import { cx, money, nightsBetween, shortDate } from '../../lib/format'

const STEPS = ['Room', 'Guest', 'Payment']

export function StayBookingFlow({
  property,
  room,
  checkIn,
  checkOut,
  guests,
  rooms,
  onClose,
}: {
  property: Property
  room: RoomOption
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  onClose: () => void
}) {
  const { state, dispatch, notify } = useStore()
  const [step, setStep] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(room)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState('')
  const [breakfast, setBreakfast] = useState(false)
  const [done, setDone] = useState(false)

  const nights = nightsBetween(checkIn, checkOut)
  const breakfastFee = breakfast && !selectedRoom.breakfast ? 18 * nights * guests : 0
  const cost = stayTotal(selectedRoom.rate, checkIn, checkOut, rooms)
  const total = cost.total + breakfastFee
  const affordable = total <= state.cash
  const detailsComplete = name.trim().length > 1 && /.+@.+\..+/.test(email)

  const confirm = () => {
    if (!affordable) {
      notify({ tone: 'error', title: 'Not enough cash', body: 'Top up your wallet to book this stay.' })
      return
    }
    dispatch({
      type: 'book-stay',
      booking: {
        propertyId: property.id,
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        guests,
        rooms,
        nights,
        guestName: name,
        total,
        breakfast: breakfast || selectedRoom.breakfast,
      },
    })
    setDone(true)
    notify({
      tone: 'success',
      title: 'Stay reserved',
      body: `${property.name} · ${nights} night${nights > 1 ? 's' : ''} · ${money(total)}`,
    })
  }

  if (done) {
    return (
      <Modal open title="Reservation confirmed" onClose={onClose} size="narrow"
        footer={<button className="btn btn-primary btn-block" onClick={onClose}>Done</button>}>
        <div style={{ textAlign: 'center', display: 'grid', gap: 12, padding: '12px 0' }}>
          <div style={{ fontSize: 44 }}>🛎️</div>
          <h3 style={{ fontSize: 20 }}>See you at check-in.</h3>
          <p className="muted">{property.name}, {property.neighbourhood}</p>
          <div className="order-summary" style={{ textAlign: 'left' }}>
            <div className="row-between"><span className="muted">Check-in</span><strong>{shortDate(checkIn)}</strong></div>
            <div className="row-between"><span className="muted">Check-out</span><strong>{shortDate(checkOut)}</strong></div>
            <div className="row-between"><span className="muted">Room</span><strong>{selectedRoom.name}</strong></div>
            <hr className="divider" />
            <div className="row-between"><span className="muted">Charged</span><strong className="mono">{money(total)}</strong></div>
          </div>
          <p className="faint" style={{ fontSize: 12 }}>Manage it under <strong>My reservations</strong>.</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      title={property.name}
      subtitle={<Steps steps={STEPS} current={step} />}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          <div className="grow" style={{ textAlign: 'right' }}>
            <div className="faint" style={{ fontSize: 11 }}>
              {nights} night{nights > 1 ? 's' : ''} · {rooms} room{rooms > 1 ? 's' : ''}
            </div>
            <strong className="mono" style={{ fontSize: 18 }}>{money(total)}</strong>
          </div>
          {step < STEPS.length - 1 ? (
            <button
              className="btn btn-primary btn-lg"
              disabled={step === 1 && !detailsComplete}
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
        <div className="stack" style={{ gap: 12 }}>
          <span className="panel-title">Choose your room</span>
          {property.rooms.map((option) => {
            const optionCost = stayTotal(option.rate, checkIn, checkOut, rooms)
            return (
              <button
                key={option.id}
                className={cx('room-row', selectedRoom.id === option.id && 'picked')}
                style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                onClick={() => setSelectedRoom(option)}
              >
                <div className="stack" style={{ gap: 6 }}>
                  <strong>{option.name}</strong>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {option.bed} · sleeps {option.sleeps}
                  </span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {option.refundable ? (
                      <span className="pill pill-accent">Free cancellation</span>
                    ) : (
                      <span className="pill">Non-refundable</span>
                    )}
                    {option.breakfast && <span className="pill">🥐 Breakfast included</span>}
                    {option.left <= 3 && <span className="pill pill-amber">Only {option.left} left</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontSize: 19, fontWeight: 650 }}>{money(option.rate)}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>per night</div>
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
                    {money(optionCost.total)} total
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {step === 1 && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad" style={{ display: 'grid', gap: 12 }}>
            <span className="panel-title">Lead guest</span>
            <div className="field">
              <label>Full name</label>
              <input className="input" value={name} placeholder="Alex Moreau" onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>Email</label>
              <input className="input" type="email" value={email} placeholder="alex@example.com" onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>Special requests (optional)</label>
              <textarea
                className="input"
                rows={3}
                value={requests}
                placeholder="Late arrival, high floor, quiet room…"
                onChange={(e) => setRequests(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          {!selectedRoom.breakfast && (
            <label className="card card-pad row-between" style={{ cursor: 'pointer' }}>
              <div>
                <strong>Add breakfast</strong>
                <div className="faint" style={{ fontSize: 12 }}>
                  {money(18)} per guest per night · {money(18 * nights * guests)} for this stay
                </div>
              </div>
              <input
                type="checkbox"
                checked={breakfast}
                onChange={(e) => setBreakfast(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: 'var(--accent-strong)' }}
              />
            </label>
          )}
          {!detailsComplete && (
            <p className="faint" style={{ fontSize: 12.5 }}>
              A name and a valid email are needed to continue.
            </p>
          )}
        </div>
      )}

      {step === 2 && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad stack" style={{ gap: 8 }}>
            <span className="panel-title">Your stay</span>
            <div className="row-between"><span className="muted">Property</span><strong>{property.name}</strong></div>
            <div className="row-between"><span className="muted">Room</span><strong>{selectedRoom.name}</strong></div>
            <div className="row-between"><span className="muted">Dates</span>
              <strong>{shortDate(checkIn)} → {shortDate(checkOut)}</strong>
            </div>
            <div className="row-between"><span className="muted">Guests</span><strong>{guests}</strong></div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {property.amenities.slice(0, 6).map((id) => (
                <span key={id} className="pill">
                  {AMENITY_BY_ID.get(id)?.icon} {AMENITY_BY_ID.get(id)?.label}
                </span>
              ))}
            </div>
          </div>

          <div className="order-summary">
            <div className="row-between">
              <span className="muted">{money(selectedRoom.rate)} × {nights} night{nights > 1 ? 's' : ''} × {rooms} room{rooms > 1 ? 's' : ''}</span>
              <span className="mono">{money(cost.subtotal)}</span>
            </div>
            <div className="row-between"><span className="muted">Taxes (12%)</span><span className="mono">{money(cost.taxes)}</span></div>
            <div className="row-between"><span className="muted">Service fee</span><span className="mono">{money(cost.serviceFee)}</span></div>
            {breakfastFee > 0 && (
              <div className="row-between"><span className="muted">Breakfast</span><span className="mono">{money(breakfastFee)}</span></div>
            )}
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

          {requests.trim() && (
            <p className="faint" style={{ fontSize: 12.5 }}>
              Note to the property: “{requests.trim()}”
            </p>
          )}
          {!affordable && (
            <p className="down" style={{ fontSize: 13 }}>
              This reservation exceeds your wallet balance. Top up from the header.
            </p>
          )}
        </div>
      )}
    </Modal>
  )
}
