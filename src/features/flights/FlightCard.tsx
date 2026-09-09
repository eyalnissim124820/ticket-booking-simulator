import { useState } from 'react'
import {
  AIRLINE_BY_CODE,
  cabinLabel,
  type FlightOffer,
} from '../../data/flights'
import { getAirport } from '../../data/airports'
import { clock, cx, duration, money } from '../../lib/format'

function StopMarkers({ stops }: { stops: number }) {
  if (stops === 0) return null
  return (
    <>
      {Array.from({ length: stops }, (_, i) => (
        <span
          key={i}
          className="timeline-stop"
          style={{ left: `${((i + 1) / (stops + 1)) * 100}%` }}
        />
      ))}
    </>
  )
}

export function FlightCard({
  offer,
  passengers,
  selected,
  onSelect,
  actionLabel = 'Select',
}: {
  offer: FlightOffer
  passengers: number
  selected?: boolean
  onSelect: (offer: FlightOffer) => void
  actionLabel?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const airline = AIRLINE_BY_CODE.get(offer.airline)
  const first = offer.legs[0]
  const last = offer.legs[offer.legs.length - 1]

  return (
    <article className={cx('card', 'flight-card', selected && 'selected')}>
      <div className="flight-main">
        <div className="row" style={{ gap: 8 }}>
          <span className="airline-dot" style={{ background: airline?.color }} />
          <strong style={{ fontSize: 13 }}>{airline?.name}</strong>
          <span className="faint mono" style={{ fontSize: 12 }}>
            {offer.legs.map((l) => l.flightNumber).join(' · ')}
          </span>
          <span className="pill" style={{ marginLeft: 'auto' }}>
            {cabinLabel(offer.cabin)}
          </span>
        </div>

        <div className="timeline">
          <div>
            <div className="timeline-time">{clock(first.departMinutes)}</div>
            <div className="timeline-code">{first.from}</div>
          </div>
          <div className="timeline-mid">
            <span className="faint" style={{ fontSize: 11.5 }}>
              {duration(offer.totalMinutes)}
            </span>
            <div className="timeline-line">
              <StopMarkers stops={offer.stops} />
            </div>
            <span style={{ fontSize: 11.5 }} className={offer.stops === 0 ? 'up' : 'muted'}>
              {offer.stops === 0
                ? 'Direct'
                : `${offer.stops} stop${offer.stops > 1 ? 's' : ''} · ${offer.legs
                    .slice(0, -1)
                    .map((l) => l.to)
                    .join(', ')}`}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="timeline-time">
              {clock(last.arriveMinutes)}
              {offer.dayOffset > 0 && <span className="sup">+{offer.dayOffset}</span>}
            </div>
            <div className="timeline-code">{last.to}</div>
          </div>
        </div>

        <div className="row" style={{ gap: 7, flexWrap: 'wrap' }}>
          {offer.baggageIncluded ? (
            <span className="pill">🧳 Bag included</span>
          ) : (
            <span className="pill">🎒 Cabin bag only</span>
          )}
          {offer.refundable && <span className="pill pill-accent">Refundable</span>}
          <span className="pill">⏱ {Math.round(offer.onTimeRate * 100)}% on time</span>
          <span className="pill">🌿 {offer.emissionsKg} kg CO₂</span>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'Flight details'}
          </button>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 6 }}>
            {offer.legs.map((leg, i) => {
              const previous = offer.legs[i - 1]
              const layover = previous ? leg.departMinutes - previous.arriveMinutes : 0
              return (
                <div key={`${leg.flightNumber}-${i}`}>
                  {previous && (
                    <div className="layover">
                      ⏳ {duration(layover)} layover in {getAirport(previous.to).city}
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
                        <strong>{getAirport(leg.from).city}</strong>{' '}
                        <span className="faint">({leg.from})</span> →{' '}
                        <strong>{getAirport(leg.to).city}</strong>{' '}
                        <span className="faint">({leg.to})</span>
                      </div>
                      <div className="faint" style={{ fontSize: 12 }}>
                        {leg.flightNumber} · {leg.aircraft} · {duration(leg.durationMinutes)}
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
            per traveller
            {passengers > 1 && ` · ${money(offer.price * passengers)} total`}
          </div>
        </div>
        <div>
          <button className="btn btn-primary btn-block" onClick={() => onSelect(offer)}>
            {selected ? 'Selected ✓' : actionLabel}
          </button>
          {offer.seatsLeft <= 6 && (
            <div className="down" style={{ fontSize: 11.5, marginTop: 6 }}>
              Only {offer.seatsLeft} seats left
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
