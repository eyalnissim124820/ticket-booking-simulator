import { AMENITY_BY_ID, propertyTypeLabel, stayTotal, type Property, type RoomOption } from '../../data/hotels'
import { Modal, Stars } from '../../components/ui'
import { cx, money, nightsBetween } from '../../lib/format'
import { propertyGradient, propertyIcon } from './PropertyArt'
import { useStore } from '../../state/store'

export function PropertyDetail({
  property,
  checkIn,
  checkOut,
  rooms,
  onClose,
  onBook,
}: {
  property: Property
  checkIn: string
  checkOut: string
  rooms: number
  onClose: () => void
  onBook: (room: RoomOption) => void
}) {
  const { state, dispatch } = useStore()
  const nights = nightsBetween(checkIn, checkOut)
  const saved = state.savedProperties.includes(property.id)

  return (
    <Modal
      open
      size="wide"
      title={property.name}
      subtitle={
        <span>
          {propertyTypeLabel(property.type)} · {property.neighbourhood} ·{' '}
          {property.distanceToCentreKm} km from centre
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button
            className="btn"
            onClick={() => dispatch({ type: 'toggle-saved', propertyId: property.id })}
          >
            {saved ? '♥ Saved' : '♡ Save'}
          </button>
          <div className="grow" style={{ textAlign: 'right' }}>
            <div className="faint" style={{ fontSize: 11 }}>
              from · {nights} night{nights > 1 ? 's' : ''}
            </div>
            <strong className="mono" style={{ fontSize: 18 }}>
              {money(stayTotal(property.rooms[0].rate, checkIn, checkOut, rooms).total)}
            </strong>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => onBook(property.rooms[0])}>
            Reserve
          </button>
        </>
      }
    >
      <div className="gallery">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ background: propertyGradient(property.hue, i * 17) }}>
            {propertyIcon(property.hue, i * 3)}
          </div>
        ))}
      </div>

      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <Stars count={property.stars} />
        <span
          className={cx('score', property.rating < 8 && 'mid', property.rating < 7 && 'low')}
        >
          {property.rating.toFixed(1)}
        </span>
        <span className="muted">
          {property.rating >= 9 ? 'Exceptional' : property.rating >= 8 ? 'Very good' : 'Good'} ·{' '}
          {property.reviewCount.toLocaleString()} reviews
        </span>
        {property.freeCancellation && <span className="pill pill-accent">Free cancellation</span>}
        {property.sustainable && <span className="pill pill-up">🌱 Sustainability certified</span>}
      </div>

      <p className="muted">{property.blurb}</p>

      <div>
        <span className="panel-title">Amenities</span>
        <div className="amenity-row" style={{ marginTop: 8 }}>
          {property.amenities.map((id) => (
            <span key={id} className="pill">
              {AMENITY_BY_ID.get(id)?.icon} {AMENITY_BY_ID.get(id)?.label}
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="panel-title">Available rooms</span>
        <div className="stack" style={{ marginTop: 8, gap: 10 }}>
          {property.rooms.map((room) => {
            const cost = stayTotal(room.rate, checkIn, checkOut, rooms)
            return (
              <div key={room.id} className="room-row">
                <div className="stack" style={{ gap: 6 }}>
                  <strong>{room.name}</strong>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {room.bed} · sleeps {room.sleeps}
                  </span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {room.refundable ? (
                      <span className="pill pill-accent">Free cancellation</span>
                    ) : (
                      <span className="pill">Non-refundable</span>
                    )}
                    {room.breakfast && <span className="pill">🥐 Breakfast</span>}
                    {room.left <= 3 && <span className="pill pill-amber">Only {room.left} left</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', display: 'grid', gap: 6, alignContent: 'center' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 19, fontWeight: 650 }}>{money(cost.total)}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>
                      total for {nights} night{nights > 1 ? 's' : ''}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onBook(room)}>
                    Reserve
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <span className="panel-title">Guest reviews</span>
        <div className="stack" style={{ marginTop: 8, gap: 10 }}>
          {property.reviews.map((review, i) => (
            <div key={i} className="review">
              <div className="row" style={{ gap: 10 }}>
                <span className={cx('score', review.score < 8 && 'mid', review.score < 7 && 'low')}>
                  {review.score.toFixed(1)}
                </span>
                <div>
                  <strong style={{ fontSize: 13 }}>{review.title}</strong>
                  <div className="faint" style={{ fontSize: 11.5 }}>
                    {review.author} · {review.country} · stayed {review.nights} night
                    {review.nights > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13 }}>{review.body}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
