import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { lockPageScroll } from '../../components/ui'
import { useI18n } from '../../i18n'
import { useStore } from '../../state/store'

/** How long the reveal holds before it starts clearing, and how long the clear
 *  itself takes. Both are mirrored in the CSS below — the JS owns the schedule,
 *  the CSS owns the motion. The hold covers two full cycles of the ring, so it
 *  has to outlast the plane's second lap and the pin landing after it. */
const HOLD_MS = 4700
const EXIT_MS = 620

/** The intro plays once per page load, never twice: a reset drops the player
 *  back at the gate, and sitting through the logo again on the way is a cost,
 *  not a welcome. Module scope rather than state so React's development-mode
 *  double-mount cannot replay it either. */
let played = false

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

/** The name splits on its hyphen so the two halves can carry the logo's own
 *  two-tone wordmark. Both locales hyphenate ("Eli-baba", "אלי-בעבע"); anything
 *  that does not simply reveals as one piece. Splitting per word rather than
 *  per character is deliberate — wrapping Hebrew letters in inline-blocks would
 *  lay the word out left to right and break it. */
function splitName(name: string): [string, string] | [string] {
  const at = name.indexOf('-')
  return at > 0 && at < name.length - 1 ? [name.slice(0, at + 1), name.slice(at + 1)] : [name]
}

/** The route line from the mark, redrawn at stage size: a ring the plane flies
 *  and the pin lands on. Circular rather than the logo's ellipse so the plane
 *  can ride it on a plain rotation, which every browser gets right. */
function Orbit() {
  return (
    <svg className="splash-orbit" viewBox="0 0 260 260" aria-hidden="true">
      <circle className="splash-ring" cx="130" cy="130" r="112" />
      <circle className="splash-pulse" cx="130" cy="130" r="112" />
      <g className="splash-flight">
        <g transform="translate(130 18)">
          <path
            className="splash-plane"
            d="M12 0 L-2 -6 L0 -1.5 L-9 -2 L-11 -5 L-12.5 -4.5 L-11 0 L-12.5 4.5 L-11 5 L-9 2 L0 1.5 L-2 6 Z"
          />
        </g>
      </g>
      {/* The placement sits on the outer group so the animated transform on the
          inner one adds to it rather than replacing it. */}
      <g transform="translate(209 209)">
        <g className="splash-pin">
          <path d="M0 0c0 0-9-12-9-18a9 9 0 1 1 18 0c0 6-9 18-9 18Z" />
          <circle cx="0" cy="-18" r="3.6" className="splash-pin-dot" />
        </g>
      </g>
    </svg>
  )
}

/** The welcome reveal: the mark lands, the route draws itself around it, the
 *  wordmark rises, and the whole panel wipes up to hand over to the start gate.
 *  Shown only on a cold open — a reload mid-run goes straight back to the app. */
export function Splash() {
  const { t } = useI18n()
  const { state } = useStore()
  const [phase, setPhase] = useState<'in' | 'out' | null>(() =>
    !played && state.session.status === 'idle' && !prefersReducedMotion() ? 'in' : null,
  )
  // Marks the intro spent on the first render that shows it, so a re-render
  // (or a second mount in development) cannot start it over.
  const claimed = useRef(false)
  if (phase !== null && !claimed.current) {
    claimed.current = true
    played = true
  }

  useEffect(() => {
    if (phase === null) return
    return lockPageScroll()
  }, [phase])

  useEffect(() => {
    if (phase !== 'in') return
    const skip = () => setPhase('out')
    const onKey = () => skip()
    const hold = window.setTimeout(skip, HOLD_MS)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(hold)
      window.removeEventListener('keydown', onKey)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'out') return
    const done = window.setTimeout(() => setPhase(null), EXIT_MS)
    return () => window.clearTimeout(done)
  }, [phase])

  if (phase === null) return null

  const parts = splitName(t('app.name'))

  return createPortal(
    // Portalled to <body> for the same reason the modals are: a fixed overlay is
    // only viewport-relative while no ancestor establishes a containing block.
    <div className={`splash ${phase}`} onClick={() => setPhase('out')}>
      <div className="splash-stage" aria-hidden="true">
        <div className="splash-mark">
          <Orbit />
          <img src="/brand/eli-baba-mark.png" width={148} height={148} alt="" decoding="async" />
        </div>

        <div className="splash-word">
          {parts.map((part, i) => (
            <span
              key={i}
              className="splash-word-clip"
              style={{ '--d': `${1420 + i * 120}ms` } as CSSProperties}
            >
              <span className={i === 1 ? 'splash-word-b' : undefined}>{part}</span>
            </span>
          ))}
        </div>

        <span className="splash-rule" />
        <span className="splash-tagline">{t('app.tagline')}</span>
      </div>

      <button className="splash-skip" onClick={() => setPhase('out')}>
        {t('splash.skip')}
      </button>
    </div>,
    document.body,
  )
}
