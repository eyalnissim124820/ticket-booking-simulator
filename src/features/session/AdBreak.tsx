import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { KITCHEN_AD, prefetchAdImages, type AdCreative } from '../../data/ads'
import { lockPageScroll } from '../../components/ui'
import { IconClose, IconInfo } from '../../components/icons'
import { useI18n } from '../../i18n'
import { cx } from '../../lib/format'
import { useStore } from '../../state/store'

/** Milliseconds before the first break, and between breaks after it. Both are
 *  ranges the schedule picks from, so no two runs are interrupted alike. Over a
 *  four-minute run this lands three or four breaks. */
const FIRST_BREAK: [number, number] = [25_000, 45_000]
const NEXT_BREAK: [number, number] = [50_000, 80_000]

/** How long the close button counts down for, and when an untouched break gives
 *  up on its own. A run is timed, so a break can never hold the screen forever. */
const UNLOCK_MS = 4_000
const AUTO_DISMISS_MS = 15_000

/** How long each photograph holds before the next one. */
const SLIDE_MS = 2_200

const between = ([lo, hi]: [number, number]) => lo + Math.random() * (hi - lo)

/** The next image that has not already failed to load, or null once they all
 *  have and there is nothing left to rotate through. */
function nextUsable(from: number, total: number, broken: Set<number>): number | null {
  for (let step = 1; step <= total; step++) {
    const at = (from + step) % total
    if (!broken.has(at)) return at
  }
  return null
}

function AdPanel({ creative, onClose }: { creative: AdCreative; onClose: () => void }) {
  const { t } = useI18n()
  const [remaining, setRemaining] = useState(Math.ceil(UNLOCK_MS / 1000))
  const [slide, setSlide] = useState(0)
  const [broken, setBroken] = useState<ReadonlySet<number>>(() => new Set())

  useEffect(() => lockPageScroll(), [])

  // The close countdown, and the backstop that dismisses an ignored break.
  useEffect(() => {
    const tick = window.setInterval(() => setRemaining((n) => Math.max(0, n - 1)), 1000)
    const giveUp = window.setTimeout(onClose, AUTO_DISMISS_MS)
    return () => {
      window.clearInterval(tick)
      window.clearTimeout(giveUp)
    }
  }, [onClose])

  // Escape closes, but only once the countdown has run out — the same rule the
  // button follows, so the keyboard is not a way around it.
  useEffect(() => {
    if (remaining > 0) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [remaining, onClose])

  useEffect(() => {
    const id = window.setInterval(() => {
      setSlide((at) => nextUsable(at, creative.images.length, broken as Set<number>) ?? at)
    }, SLIDE_MS)
    return () => window.clearInterval(id)
  }, [creative.images.length, broken])

  // A photograph that fails is struck off, and the panel moves to the next one
  // that has not. Once every one has failed the frame is dropped entirely
  // rather than left as a broken image.
  const markBroken = (index: number) =>
    setBroken((was) => {
      const now = new Set(was)
      now.add(index)
      if (index === slide) {
        const next = nextUsable(index, creative.images.length, now)
        if (next !== null) setSlide(next)
      }
      return now
    })

  const usable = creative.images.filter((_, i) => !broken.has(i))
  const locked = remaining > 0

  return (
    <div className="ad-scrim">
      <div className="ad" role="dialog" aria-modal="true" aria-label={t('ad.label')}>
        <div className="ad-chrome">
          <span className="ad-tag">{t('ad.label')}</span>
          <div className="grow" />
          <button
            className="ad-close"
            onClick={onClose}
            disabled={locked}
            aria-label={locked ? t('ad.closeIn', { n: remaining }) : t('ad.close')}
          >
            {locked ? t('ad.closeIn', { n: remaining }) : t('ad.close')}
            <IconClose size={14} />
          </button>
        </div>

        {/* The creative itself, in the advertiser's own language and direction
            whichever way the app around it is running. */}
        {/* `no-media` collapses the two columns to one: with every photograph
            failed there is no frame to sit beside, and the copy should fill the
            panel rather than leave a hole where the frame would have been. */}
        <div
          className={cx('ad-creative', usable.length === 0 && 'no-media')}
          lang={creative.lang}
          dir={creative.dir}
        >
          {usable.length > 0 && (
            <div className="ad-frame">
              {creative.images.map((image, i) =>
                broken.has(i) ? null : (
                  <img
                    key={image.src}
                    className="ad-photo"
                    src={image.src}
                    alt={image.alt}
                    data-current={i === slide || undefined}
                    decoding="async"
                    onError={() => markBroken(i)}
                  />
                ),
              )}
              {usable.length > 1 && (
                <div className="ad-dots" aria-hidden="true">
                  {creative.images.map((image, i) =>
                    broken.has(i) ? null : (
                      <i key={image.src} data-current={i === slide || undefined} />
                    ),
                  )}
                </div>
              )}
            </div>
          )}

          <div className="ad-copy">
            <strong className="ad-advertiser">{creative.advertiser}</strong>
            <h3 className="ad-headline">{creative.headline}</h3>
            <p className="ad-body">{creative.body}</p>
            <button className="btn btn-primary ad-cta" onClick={onClose}>
              {creative.cta}
            </button>
          </div>
        </div>

        <p className="ad-disclaimer">
          <IconInfo size={13} />
          {t('ad.disclaimer')}
        </p>
      </div>
    </div>
  )
}

/**
 * Schedules the ad breaks and shows them.
 *
 * Breaks start at the second mission — the first one happens off-screen behind
 * its own gate, and interrupting that would interrupt nothing — and pause over
 * a handoff or a finished run, so a break never lands on top of another
 * full-screen moment.
 */
export function AdBreak() {
  const { state } = useStore()
  const { session } = state
  const [open, setOpen] = useState(false)

  const eligible = session.status === 'running' && !session.handoff && session.index >= 1

  /** When the next break is due, or null while one is on screen or none is
   *  scheduled. Absolute rather than a pending timeout so that pausing over a
   *  handoff postpones the break instead of restarting its wait. */
  const dueAt = useRef<number | null>(null)

  // Each run gets its own schedule.
  useEffect(() => {
    dueAt.current = null
    setOpen(false)
  }, [session.startedAt])

  useEffect(() => {
    if (!eligible) return
    prefetchAdImages(KITCHEN_AD)
  }, [eligible])

  const close = useCallback(() => {
    dueAt.current = Date.now() + between(NEXT_BREAK)
    setOpen(false)
  }, [])

  // A break that was on screen when the run stopped being interruptible — a
  // handoff opening over it, or the run ending — is closed properly rather than
  // just hidden. Left open the scheduler would see a break still showing and
  // never queue another one for the rest of the run.
  useEffect(() => {
    if (!eligible && open) close()
  }, [eligible, open, close])

  useEffect(() => {
    if (!eligible || open) return
    if (dueAt.current === null) dueAt.current = Date.now() + between(FIRST_BREAK)
    const id = window.setInterval(() => {
      if (dueAt.current !== null && Date.now() >= dueAt.current) {
        dueAt.current = null
        setOpen(true)
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [eligible, open])

  if (!open || !eligible) return null

  return createPortal(<AdPanel creative={KITCHEN_AD} onClose={close} />, document.body)
}
