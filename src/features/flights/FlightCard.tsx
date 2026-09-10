import { useState } from 'react'
import { AIRLINE_BY_CODE, airlineName, cabinKey, type FlightOffer } from '../../data/flights'
import { airportCity, getAirport } from '../../data/airports'
import { AirlineLogo } from '../../components/AirlineLogo'
import { IconBackpack, IconClock, IconLeaf, IconLuggage } from '../../components/icons'
import { clock, cx, duration, durationHe } from '../../lib/format'
import { useI18n } from '../../i18n'

export function FlightCard({
  offer,
  passengers,
  selected,
  onSelect,
}: {
  offer: FlightOffer
  passengers: number
  selected?: boolean
  onSelect: (offer: FlightOffer) => void
}) {
  const { t, locale, money, plural, arrow } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const airline = AIRLINE_BY_CODE.get(offer.airline)
  const first = offer.legs[0]
  const last = offer.legs[offer.legs.length - 1]
  const dur = locale === 'he' ? durationHe : duration

  return (
    <article className={cx('card', 'flight-card', selected && 'selected')}>
      <div className="flight-main">
        <div className="row" style={{ gap: 10 }}>
          {airline && <AirlineLogo mark={airline.mark} color={airline.color} title={airlineName(airline, locale)} />}
          <div className="grow">
            <strong style={{ fontSize: 14 }}>{airline && airlineName(airline, locale)}</strong>
            <div className="faint mono" style={{ fontSize: 11.5 }}>
              {offer.legs.map((l) => l.flightNumber).join(' · ')}
            </div>
          </div>
          <span className="pill">{t(cabinKey(offer.cabin))}</span>
        </div>

        <div className="timeline">
          <div>
            <div className="timeline-time">{clock(first.departMinutes)}</div>
            <div className="timeline-code">{first.from}</div>
          </div>
          <div className="timeline-mid">
            <span className="faint" style={{ fontSize: 12 }}>{dur(offer.totalMinutes)}</span>
            <div className="timeline-line">
              {Array.from({ length: offer.stops }, (_, i) => (
                <span
                  key={i}
                  className="timeline-stop"
                  style={{ insetInlineStart: `${((i + 1) / (offer.stops + 1)) * 100}%` }}
                />
              ))}
            </div>
            <span style={{ fontSize: 12 }} className={offer.stops === 0 ? 'up' : 'muted'}>
              {plural.stops(offer.stops)}
              {offer.stops > 0 &&
                ` · ${offer.legs.slice(0, -1).map((l) => l.to).join(', ')}`}
            </span>
          </div>
          <div style={{ textAlign: 'end' }}>
            <div className="timeline-time">
              {clock(last.arriveMinutes)}
              {offer.dayOffset > 0 && <span className="sup">+{offer.dayOffset}</span>}
            </div>
            <div className="timeline-code">{last.to}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
          <span className="pill">
            {offer.baggageIncluded ? <IconLuggage size={13} /> : <IconBackpack size={13} />}
            {offer.baggageIncluded ? t('flights.bagIncluded') : t('flights.cabinBagOnly')}
          </span>
          {offer.refundable && <span className="pill pill-brand">{t('flights.refundable')}</span>}
          <span className="pill">
            <IconClock size={13} />
            {t('flights.onTime', { percent: Math.round(offer.onTimeRate * 100) })}
          </span>
          <span className="pill">
            <IconLeaf size={13} />
            {t('flights.emissions', { kg: offer.emissionsKg })}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={() => setExpanded((v) => !v)} aria-expanded={expanded}>
            {expanded ? t('flights.hideDetails') : t('flights.flightDetails')}
          </button>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 6 }}>
            {offer.legs.map((leg, i) => {
              const previous = offer.legs[i - 1]
              return (
                <div key={`${leg.flightNumber}-${i}`}>
                  {previous && (
                    <div className="layover">
                      {t('flights.layoverIn', {
                        duration: dur(leg.departMinutes - previous.arriveMinutes),
                        city: airportCity(getAirport(previous.to), locale),
                      })}
                    </div>
                  )}
                  <div className="leg-detail">
                    <div className="mono faint">
                      {clock(leg.departMinutes)}
                      <br />
                      {clock(leg.arriveMinutes)}
                    </div>
                    <div>
                      <div>
                        <strong>{airportCity(getAirport(leg.from), locale)}</strong>{' '}
                        <span className="faint mono">({leg.from})</span>
                        {` ${arrow} `}
                        <strong>{airportCity(getAirport(leg.to), locale)}</strong>{' '}
                        <span className="faint mono">({leg.to})</span>
                      </div>
                      <div className="faint" style={{ fontSize: 12.5 }}>
                        {leg.flightNumber} · {leg.aircraft} · {dur(leg.durationMinutes)}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flight-buy">
        <div>
          <div className="flight-price">{money(offer.price)}</div>
          <div className="faint" style={{ fontSize: 11.5 }}>
            {t('flights.perTraveller')}
            {passengers > 1 && ` · ${t('flights.totalFor', { amount: money(offer.price * passengers) })}`}
          </div>
        </div>
        <div>
          <button className="btn btn-primary btn-block" onClick={() => onSelect(offer)}>
            {selected ? t('common.selected') : t('common.select')}
          </button>
          {offer.seatsLeft <= 6 && (
            <div className="down" style={{ fontSize: 11.5, marginTop: 6 }}>
              {t('flights.seatsLeft', { count: offer.seatsLeft })}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
