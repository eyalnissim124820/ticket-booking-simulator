import { useEffect, useMemo, useState } from 'react'
import {
  AIRLINE_BY_CODE,
  airlineName,
  buildSeatMap,
  cabinKey,
  type FlightOffer,
} from '../../data/flights'
import type { Passenger } from '../../state/types'
import { useStore } from '../../state/store'
import { Modal, Steps } from '../../components/ui'
import { AirlineLogo } from '../../components/AirlineLogo'
import { IconTicket } from '../../components/icons'
import { clock, cx, duration, durationHe } from '../../lib/format'
import { useI18n } from '../../i18n'

const BAG_FEE = 45
const INSURANCE_FEE = 29
const FLEX_RATE = 0.12

function OfferSummary({ offer, label }: { offer: FlightOffer; label: string }) {
  const { locale, formatDate, plural } = useI18n()
  const airline = AIRLINE_BY_CODE.get(offer.airline)
  const first = offer.legs[0]
  const last = offer.legs[offer.legs.length - 1]
  const dur = locale === 'he' ? durationHe : duration
  return (
    <div className="card card-pad">
      <div className="row-between" style={{ marginBottom: 10 }}>
        <span className="panel-title">{label}</span>
        <span className="faint" style={{ fontSize: 12 }}>{formatDate(offer.departDate, 'short')}</span>
      </div>
      <div className="row" style={{ gap: 10, marginBottom: 12 }}>
        {airline && <AirlineLogo mark={airline.mark} color={airline.color} size={22} />}
        <strong style={{ fontSize: 13.5 }}>{airline && airlineName(airline, locale)}</strong>
        <span className="faint mono" style={{ fontSize: 11.5 }}>
          {offer.legs.map((l) => l.flightNumber).join(' · ')}
        </span>
      </div>
      <div className="row-between">
        <div>
          <div className="mono" style={{ fontSize: 19 }}>{clock(first.departMinutes)}</div>
          <div className="faint" style={{ fontSize: 11.5 }}>{first.from}</div>
        </div>
        <div className="faint" style={{ fontSize: 12, textAlign: 'center' }}>
          {dur(offer.totalMinutes)}
          <br />
          {plural.stops(offer.stops)}
        </div>
        <div style={{ textAlign: 'end' }}>
          <div className="mono" style={{ fontSize: 19 }}>
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
  const { t, money } = useI18n()
  const rows = useMemo(() => buildSeatMap(offer.id, offer.cabin), [offer.id, offer.cabin])
  const [active, setActive] = useState(0)
  const allSeats = useMemo(() => rows.flatMap((r) => r.seats), [rows])
  const feeOf = (id: string) => allSeats.find((s) => s.id === id)?.fee ?? 0

  return (
    <div className="stack" style={{ gap: 14 }}>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {Array.from({ length: passengers }, (_, i) => (
          <button key={i} className="chip" aria-pressed={active === i} onClick={() => setActive(i)}>
            {t('flights.traveller', { n: i + 1 })} ·{' '}
            {assignments[i] ?? t('flights.pickASeat')}
          </button>
        ))}
      </div>

      <div className="seatmap">
        <div className="panel-title" style={{ marginBottom: 6 }}>{t('flights.seatFrontOfAircraft')}</div>
        <div style={{ maxHeight: 302, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                    title={seat.taken ? t('flights.seatOccupied') : `${seat.id} · ${money(seat.fee)}`}
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
        <div className="seat-legend" style={{ marginTop: 12 }}>
          <span><i style={{ background: 'var(--card)', border: '1px solid var(--rule-strong)' }} />{t('flights.seatAvailable')}</span>
          <span><i style={{ background: 'var(--tint)' }} />{t('flights.seatOccupied')}</span>
          <span><i style={{ border: '1px solid var(--accent)' }} />{t('flights.seatLegroom', { amount: money(38) })}</span>
          <span><i style={{ background: 'var(--brand)' }} />{t('flights.seatYours')}</span>
        </div>
      </div>

      <p className="faint" style={{ fontSize: 12.5 }}>
        {t('flights.seatFeesSoFar', {
          amount: money(assignments.reduce((sum, s) => sum + (s ? feeOf(s) : 0), 0)),
        })}{' '}
        {t('flights.seatsOptional')}
      </p>
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
  const { t, money, formatDate, plural, arrow } = useI18n()
  const { state, dispatch, notify } = useStore()
  const [step, setStep] = useState(0)
  const [seats, setSeats] = useState<(string | null)[]>(Array(passengerCount).fill(null))
  const [people, setPeople] = useState<Passenger[]>(
    Array.from({ length: passengerCount }, () => ({ firstName: '', lastName: '', email: '', seat: null })),
  )
  const [bags, setBags] = useState(0)
  const [insurance, setInsurance] = useState(false)
  const [flexible, setFlexible] = useState(false)
  const [done, setDone] = useState(false)

  // Once a booking clears a mission the handoff screen takes over, so this
  // flow steps aside instead of waiting behind it.
  useEffect(() => {
    if (state.session.handoff) onClose()
  }, [state.session.handoff, onClose])

  const STEPS = [t('common.review'), t('flights.stepSeats'), t('flights.stepTravellers'), t('common.payment')]

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

  const route = `${outbound.legs[0].from} ${arrow} ${outbound.legs.at(-1)!.to}`

  const confirm = () => {
    if (!affordable) {
      notify({ tone: 'error', title: t('flights.notEnoughCash'), body: t('flights.notEnoughCashBody') })
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
    setDone(true)
    notify({ tone: 'success', title: t('flights.bookedToast'), body: `${money(total)} · ${route}` })
  }

  if (done) {
    return (
      <Modal
        open
        size="narrow"
        title={t('flights.bookedTitle')}
        onClose={onClose}
        footer={<button className="btn btn-primary btn-block" onClick={onClose}>{t('common.done')}</button>}
      >
        <div style={{ textAlign: 'center', display: 'grid', gap: 14, padding: '8px 0', justifyItems: 'center' }}>
          <IconTicket size={40} style={{ color: 'var(--brand)' }} />
          <h3 style={{ fontSize: 22 }}>{t('flights.bookedHeadline')}</h3>
          <p className="muted">
            {t('flights.bookedBody', {
              route: route + (inbound ? t('flights.andBack') : ''),
              date: formatDate(outbound.departDate, 'short'),
            })}
          </p>
          <div className="order-summary" style={{ textAlign: 'start', width: '100%' }}>
            <div className="row-between"><span className="muted">{t('flights.travellers')}</span><strong>{plural.travellers(passengerCount)}</strong></div>
            <div className="row-between"><span className="muted">{t('flights.cabin')}</span><strong>{t(cabinKey(outbound.cabin))}</strong></div>
            <div className="row-between">
              <span className="muted">{t('flights.seats')}</span>
              <strong className="mono">{seats.filter(Boolean).join(', ') || t('flights.atCheckIn')}</strong>
            </div>
            <hr className="divider" />
            <div className="row-between"><span className="muted">{t('flights.charged')}</span><strong className="mono">{money(total)}</strong></div>
          </div>
          <p className="faint" style={{ fontSize: 12.5 }}>{t('flights.findItUnder')}</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      size="wide"
      title={t('flights.completeBooking')}
      subtitle={<Steps steps={STEPS} current={step} />}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
            {step === 0 ? t('common.cancel') : t('common.back')}
          </button>
          <div className="grow" style={{ textAlign: 'end' }}>
            <div className="faint" style={{ fontSize: 11 }}>{t('common.total')}</div>
            <strong className="mono" style={{ fontSize: 18 }}>{money(total)}</strong>
          </div>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-lg" disabled={step === 2 && !detailsComplete} onClick={() => setStep((s) => s + 1)}>
              {t('common.continue')}
            </button>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={confirm} disabled={!affordable}>
              {affordable ? t('common.pay', { amount: money(total) }) : t('common.insufficient')}
            </button>
          )}
        </>
      }
    >
      {step === 0 && (
        <div className="stack" style={{ gap: 14 }}>
          <OfferSummary offer={outbound} label={t('flights.outbound')} />
          {inbound && <OfferSummary offer={inbound} label={t('flights.return')} />}
          <div className="order-summary">
            <div className="row-between">
              <span className="muted">{t('flights.fareTimes', { count: plural.travellers(passengerCount) })}</span>
              <span className="mono">{money(fareTotal)}</span>
            </div>
            <div className="row-between"><span className="muted">{t('common.taxesFees')}</span><span className="mono">{money(taxes)}</span></div>
          </div>
        </div>
      )}

      {step === 1 && (
        <>
          {inbound && <p className="faint" style={{ fontSize: 12.5 }}>{t('flights.seatOutboundOnly')}</p>}
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
              <div className="row-between" style={{ marginBottom: 12 }}>
                <span className="panel-title">{t('flights.traveller', { n: i + 1 })}</span>
                {seats[i] && <span className="pill pill-brand">{t('flights.seatN', { seat: seats[i]! })}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>{t('common.firstName')}</label>
                  <input className="input" value={person.firstName} onChange={(e) => updatePerson(i, { firstName: e.target.value })} />
                </div>
                <div className="field">
                  <label>{t('common.lastName')}</label>
                  <input className="input" value={person.lastName} onChange={(e) => updatePerson(i, { lastName: e.target.value })} />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label>{t('common.email')}</label>
                  <input className="input" type="email" dir="ltr" value={person.email} onChange={(e) => updatePerson(i, { email: e.target.value })} />
                </div>
              </div>
            </div>
          ))}
          {!detailsComplete && <p className="faint" style={{ fontSize: 12.5 }}>{t('flights.fillEveryTraveller')}</p>}
        </div>
      )}

      {step === 3 && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad stack" style={{ gap: 14 }}>
            <span className="panel-title">{t('flights.extras')}</span>
            <div className="row-between">
              <div>
                <strong>{t('flights.checkedBags')}</strong>
                <div className="faint" style={{ fontSize: 12.5 }}>{t('flights.checkedBagsBody', { amount: money(BAG_FEE) })}</div>
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
                <strong>{t('flights.insurance')}</strong>
                <div className="faint" style={{ fontSize: 12.5 }}>{t('flights.insuranceBody', { amount: money(INSURANCE_FEE) })}</div>
              </div>
              <input type="checkbox" checked={insurance} onChange={(e) => setInsurance(e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--brand)' }} />
            </label>
            <hr className="divider" />
            <label className="row-between" style={{ cursor: 'pointer' }}>
              <div>
                <strong>{t('flights.flexible')}</strong>
                <div className="faint" style={{ fontSize: 12.5 }}>{t('flights.flexibleBody')}</div>
              </div>
              <input type="checkbox" checked={flexible} onChange={(e) => setFlexible(e.target.checked)} style={{ width: 17, height: 17, accentColor: 'var(--brand)' }} />
            </label>
          </div>

          <div className="order-summary">
            <div className="row-between"><span className="muted">{t('flights.fareTimes', { count: plural.travellers(passengerCount) })}</span><span className="mono">{money(fareTotal)}</span></div>
            <div className="row-between"><span className="muted">{t('common.taxesFees')}</span><span className="mono">{money(taxes)}</span></div>
            {seatFees > 0 && <div className="row-between"><span className="muted">{t('flights.seatSelection')}</span><span className="mono">{money(seatFees)}</span></div>}
            {bagTotal > 0 && <div className="row-between"><span className="muted">{t('flights.bagsTimes', { count: bags })}</span><span className="mono">{money(bagTotal)}</span></div>}
            {insuranceTotal > 0 && <div className="row-between"><span className="muted">{t('flights.insurance')}</span><span className="mono">{money(insuranceTotal)}</span></div>}
            {flexTotal > 0 && <div className="row-between"><span className="muted">{t('flights.flexible')}</span><span className="mono">{money(flexTotal)}</span></div>}
            <hr className="divider" />
            <div className="row-between">
              <strong>{t('common.totalDue')}</strong>
              <strong className="mono" style={{ fontSize: 17 }}>{money(total)}</strong>
            </div>
            <div className="row-between faint" style={{ fontSize: 12.5 }}>
              <span>{t('common.walletBalance')}</span>
              <span className={cx('mono', !affordable && 'down')}>{money(state.cash)}</span>
            </div>
          </div>

          {!affordable && <p className="down" style={{ fontSize: 13 }}>{t('flights.overBalance')}</p>}
        </div>
      )}
    </Modal>
  )
}
