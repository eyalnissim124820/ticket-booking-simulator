import { useState } from 'react'
import {
  amenityKey,
  pairText,
  stayTotal,
  type Property,
  type RoomOption,
} from '../../data/hotels'
import { useStore } from '../../state/store'
import { Modal, Steps } from '../../components/ui'
import { AMENITY_ICONS, IconBell } from '../../components/icons'
import { cx, nightsBetween } from '../../lib/format'
import { useI18n } from '../../i18n'

const BREAKFAST_RATE = 18

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
  const { t, locale, money, formatDate, plural, arrow } = useI18n()
  const { state, dispatch, notify } = useStore()
  const [step, setStep] = useState(0)
  const [selectedRoom, setSelectedRoom] = useState(room)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [requests, setRequests] = useState('')
  const [breakfast, setBreakfast] = useState(false)
  const [done, setDone] = useState(false)

  const STEPS = [t('stays.room'), t('stays.guest'), t('common.payment')]
  const nights = nightsBetween(checkIn, checkOut)
  const breakfastFee = breakfast && !selectedRoom.breakfast ? BREAKFAST_RATE * nights * guests : 0
  const cost = stayTotal(selectedRoom.rate, checkIn, checkOut, rooms)
  const total = cost.total + breakfastFee
  const affordable = total <= state.cash
  const detailsComplete = name.trim().length > 1 && /.+@.+\..+/.test(email)

  const confirm = () => {
    if (!affordable) {
      notify({ tone: 'error', title: t('flights.notEnoughCash'), body: t('stays.notEnoughCash') })
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
      title: t('stays.reservedToast'),
      body: `${pairText(property.name, locale)} · ${plural.nights(nights)} · ${money(total)}`,
    })
  }

  if (done) {
    return (
      <Modal
        open
        size="narrow"
        title={t('stays.confirmedTitle')}
        onClose={onClose}
        footer={<button className="btn btn-primary btn-block" onClick={onClose}>{t('common.done')}</button>}
      >
        <div style={{ textAlign: 'center', display: 'grid', gap: 14, padding: '8px 0', justifyItems: 'center' }}>
          <IconBell size={40} style={{ color: 'var(--brand)' }} />
          <h3 style={{ fontSize: 22 }}>{t('stays.confirmedHeadline')}</h3>
          <p className="muted">
            {pairText(property.name, locale)}, {pairText(property.neighbourhood, locale)}
          </p>
          <div className="order-summary" style={{ textAlign: 'start', width: '100%' }}>
            <div className="row-between"><span className="muted">{t('stays.checkIn')}</span><strong>{formatDate(checkIn, 'short')}</strong></div>
            <div className="row-between"><span className="muted">{t('stays.checkOut')}</span><strong>{formatDate(checkOut, 'short')}</strong></div>
            <div className="row-between"><span className="muted">{t('stays.room')}</span><strong>{t(selectedRoom.nameKey)}</strong></div>
            <hr className="divider" />
            <div className="row-between"><span className="muted">{t('flights.charged')}</span><strong className="mono">{money(total)}</strong></div>
          </div>
          <p className="faint" style={{ fontSize: 12.5 }}>{t('stays.manageUnder')}</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      open
      title={pairText(property.name, locale)}
      subtitle={<Steps steps={STEPS} current={step} />}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => (step === 0 ? onClose() : setStep((s) => s - 1))}>
            {step === 0 ? t('common.cancel') : t('common.back')}
          </button>
          <div className="grow" style={{ textAlign: 'end' }}>
            <div className="faint" style={{ fontSize: 11 }}>
              {plural.nights(nights)} · {plural.rooms(rooms)}
            </div>
            <strong className="mono" style={{ fontSize: 18 }}>{money(total)}</strong>
          </div>
          {step < STEPS.length - 1 ? (
            <button className="btn btn-primary btn-lg" disabled={step === 1 && !detailsComplete} onClick={() => setStep((s) => s + 1)}>
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
        <div className="stack" style={{ gap: 12 }}>
          <span className="panel-title">{t('stays.chooseRoom')}</span>
          {property.rooms.map((option) => {
            const optionCost = stayTotal(option.rate, checkIn, checkOut, rooms)
            return (
              <button
                key={option.id}
                className={cx('room-row', selectedRoom.id === option.id && 'picked')}
                style={{ textAlign: 'start', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                onClick={() => setSelectedRoom(option)}
              >
                <div className="stack" style={{ gap: 7 }}>
                  <strong>{t(option.nameKey)}</strong>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {t(option.bedKey)} · {t('stays.sleeps', { count: option.sleeps })}
                  </span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <span className={cx('pill', option.refundable && 'pill-brand')}>
                      {option.refundable ? t('stays.freeCancellation') : t('stays.nonRefundable')}
                    </span>
                    {option.breakfast && <span className="pill">{t('stays.breakfastIncluded')}</span>}
                    {option.left <= 3 && <span className="pill pill-accent">{t('stays.onlyLeft', { count: option.left })}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'end', alignSelf: 'center' }}>
                  <div className="mono" style={{ fontSize: 19 }}>{money(option.rate)}</div>
                  <div className="faint" style={{ fontSize: 11.5 }}>{t('common.perNight')}</div>
                  <div className="faint" style={{ fontSize: 11.5, marginTop: 4 }}>
                    {money(optionCost.total)} {t('common.total')}
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
            <span className="panel-title">{t('stays.leadGuest')}</span>
            <div className="field">
              <label>{t('common.fullName')}</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('common.email')}</label>
              <input className="input" type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="field">
              <label>{t('stays.specialRequests')} ({t('common.optional')})</label>
              <textarea
                className="input"
                rows={3}
                value={requests}
                placeholder={t('stays.requestsPlaceholder')}
                onChange={(e) => setRequests(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
          {!selectedRoom.breakfast && (
            <label className="card card-pad row-between" style={{ cursor: 'pointer' }}>
              <div>
                <strong>{t('stays.addBreakfast')}</strong>
                <div className="faint" style={{ fontSize: 12.5 }}>
                  {t('stays.breakfastBody', {
                    rate: money(BREAKFAST_RATE),
                    total: money(BREAKFAST_RATE * nights * guests),
                  })}
                </div>
              </div>
              <input
                type="checkbox"
                checked={breakfast}
                onChange={(e) => setBreakfast(e.target.checked)}
                style={{ width: 17, height: 17, accentColor: 'var(--brand)' }}
              />
            </label>
          )}
          {!detailsComplete && <p className="faint" style={{ fontSize: 12.5 }}>{t('stays.needNameEmail')}</p>}
        </div>
      )}

      {step === 2 && (
        <div className="stack" style={{ gap: 14 }}>
          <div className="card card-pad stack" style={{ gap: 9 }}>
            <span className="panel-title">{t('stays.yourStay')}</span>
            <div className="row-between"><span className="muted">{t('stays.property')}</span><strong>{pairText(property.name, locale)}</strong></div>
            <div className="row-between"><span className="muted">{t('stays.room')}</span><strong>{t(selectedRoom.nameKey)}</strong></div>
            <div className="row-between">
              <span className="muted">{t('stays.dates')}</span>
              <strong>{formatDate(checkIn, 'short')} {arrow} {formatDate(checkOut, 'short')}</strong>
            </div>
            <div className="row-between"><span className="muted">{t('stays.guests')}</span><strong>{plural.guests(guests)}</strong></div>
            <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {property.amenities.slice(0, 6).map((id) => {
                const Icon = AMENITY_ICONS[id]
                return (
                  <span key={id} className="pill">
                    {Icon && <Icon size={13} />}
                    {t(amenityKey(id))}
                  </span>
                )
              })}
            </div>
          </div>

          <div className="order-summary">
            <div className="row-between">
              <span className="muted">
                {t('stays.rateTimes', {
                  rate: money(selectedRoom.rate),
                  nights: plural.nights(nights),
                  rooms: plural.rooms(rooms),
                })}
              </span>
              <span className="mono">{money(cost.subtotal)}</span>
            </div>
            <div className="row-between"><span className="muted">{t('common.taxesFees')}</span><span className="mono">{money(cost.taxes)}</span></div>
            <div className="row-between"><span className="muted">{t('common.serviceFee')}</span><span className="mono">{money(cost.serviceFee)}</span></div>
            {breakfastFee > 0 && (
              <div className="row-between"><span className="muted">{t('stays.addBreakfast')}</span><span className="mono">{money(breakfastFee)}</span></div>
            )}
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

          {requests.trim() && (
            <p className="faint" style={{ fontSize: 12.5 }}>{t('stays.noteToProperty', { note: requests.trim() })}</p>
          )}
          {!affordable && <p className="down" style={{ fontSize: 13 }}>{t('stays.overBalance')}</p>}
        </div>
      )}
    </Modal>
  )
}
