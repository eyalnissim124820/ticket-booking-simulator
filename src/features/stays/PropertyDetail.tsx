import {
  amenityKey,
  pairText,
  propertyTypeKey,
  stayTotal,
  type Property,
  type RoomOption,
} from '../../data/hotels'
import { Modal, Stars } from '../../components/ui'
import { AMENITY_ICONS, IconHeart, IconMapPin } from '../../components/icons'
import { cx, nightsBetween } from '../../lib/format'
import { PropertyArt } from './PropertyArt'
import { useStore } from '../../state/store'
import { useI18n } from '../../i18n'

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
  const { t, locale, money, plural } = useI18n()
  const { state, dispatch } = useStore()
  const nights = nightsBetween(checkIn, checkOut)
  const saved = state.savedProperties.includes(property.id)

  const ratingWord =
    property.rating >= 9 ? t('stays.exceptional') : property.rating >= 8 ? t('stays.veryGood') : t('stays.good')

  return (
    <Modal
      open
      size="wide"
      title={pairText(property.name, locale)}
      subtitle={
        <span>
          {t(propertyTypeKey(property.type))} · {pairText(property.neighbourhood, locale)} ·{' '}
          {t('stays.fromCentre', { km: property.distanceToCentreKm })}
        </span>
      }
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={() => dispatch({ type: 'toggle-saved', propertyId: property.id })}>
            <IconHeart size={15} filled={saved} />
            {saved ? t('common.saved') : t('common.save')}
          </button>
          <div className="grow" style={{ textAlign: 'end' }}>
            <div className="faint" style={{ fontSize: 11 }}>{plural.nights(nights)}</div>
            <strong className="mono" style={{ fontSize: 18 }}>
              {money(stayTotal(property.rooms[0].rate, checkIn, checkOut, rooms).total)}
            </strong>
          </div>
          <button className="btn btn-primary btn-lg" onClick={() => onBook(property.rooms[0])}>
            {t('stays.reserve')}
          </button>
        </>
      }
    >
      <div className="gallery">
        {[0, 1, 2, 3, 4].map((i) => (
          <figure key={i}>
            <PropertyArt seed={property.artSeed} variant={i} />
          </figure>
        ))}
      </div>

      <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
        <Stars count={property.stars} />
        <span className={cx('score', property.rating < 8 && 'mid', property.rating < 7 && 'low')}>
          {property.rating.toFixed(1)}
        </span>
        <span className="muted">
          {ratingWord} · {t('stays.reviewsCount', { count: property.reviewCount.toLocaleString() })}
        </span>
        {property.freeCancellation && <span className="pill pill-brand">{t('stays.freeCancellation')}</span>}
        {property.sustainable && <span className="pill pill-up">{t('stays.sustainable')}</span>}
      </div>

      <p className="muted">{pairText(property.blurb, locale)}</p>

      <div>
        <div className="rule-heading"><span className="panel-title">{t('stays.amenities')}</span></div>
        <div className="amenity-row">
          {property.amenities.map((id) => {
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

      <div>
        <div className="rule-heading"><span className="panel-title">{t('stays.availableRooms')}</span></div>
        <div className="stack" style={{ gap: 10 }}>
          {property.rooms.map((room) => {
            const cost = stayTotal(room.rate, checkIn, checkOut, rooms)
            return (
              <div key={room.id} className="room-row">
                <div className="stack" style={{ gap: 7 }}>
                  <strong>{t(room.nameKey)}</strong>
                  <span className="faint" style={{ fontSize: 12.5 }}>
                    {t(room.bedKey)} · {t('stays.sleeps', { count: room.sleeps })}
                  </span>
                  <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    <span className={cx('pill', room.refundable && 'pill-brand')}>
                      {room.refundable ? t('stays.freeCancellation') : t('stays.nonRefundable')}
                    </span>
                    {room.breakfast && <span className="pill">{t('stays.breakfastIncluded')}</span>}
                    {room.left <= 3 && <span className="pill pill-accent">{t('stays.onlyLeft', { count: room.left })}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'end', display: 'grid', gap: 8, alignContent: 'center' }}>
                  <div>
                    <div className="mono" style={{ fontSize: 19 }}>{money(cost.total)}</div>
                    <div className="faint" style={{ fontSize: 11.5 }}>
                      {t('stays.totalForNights', { nights: plural.nights(nights) })}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm" onClick={() => onBook(room)}>
                    {t('stays.reserve')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="rule-heading"><span className="panel-title">{t('stays.guestReviews')}</span></div>
        <div className="stack" style={{ gap: 10 }}>
          {property.reviews.map((review, i) => (
            <div key={i} className="review">
              <div className="row" style={{ gap: 10 }}>
                <span className={cx('score', review.score < 8 && 'mid', review.score < 7 && 'low')}>
                  {review.score.toFixed(1)}
                </span>
                <div>
                  <strong style={{ fontSize: 13.5 }}>{pairText(review.title, locale)}</strong>
                  <div className="faint row" style={{ fontSize: 11.5, gap: 5 }}>
                    <IconMapPin size={11} />
                    {pairText(review.author, locale)} · {plural.nights(review.nights)}
                  </div>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 13.5 }}>{pairText(review.body, locale)}</p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  )
}
