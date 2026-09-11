import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx, addDays, parseIso, toIso, todayIso } from '../lib/format'
import { useI18n } from '../i18n'
import {
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconMinus,
  IconPlus,
  IconStar,
} from './icons'

/* -------------------------------------------------------------------- modal */
/** How many overlays currently want the page frozen. Nested or stacked modals
 *  must not release the lock until the last one closes. */
let scrollLocks = 0
let restoreScrollY = 0

/** Freezes the page while an overlay is up; returns the release.
 *  Every overlay must go through this counter — an overlay that saves and
 *  restores `overflow` itself will hand back a stale value when it closes
 *  after a modal that was open underneath it, and the page stays frozen. */
export function lockPageScroll() {
  // The scrolling element is <html> here, not <body> — locking the wrong one
  // leaves the page scrollable behind the overlay.
  const root = document.documentElement
  if (scrollLocks === 0) {
    restoreScrollY = window.scrollY
    root.style.overflow = 'hidden'
  }
  scrollLocks += 1
  return () => {
    scrollLocks = Math.max(0, scrollLocks - 1)
    if (scrollLocks === 0) {
      root.style.overflow = ''
      window.scrollTo(0, restoreScrollY)
    }
  }
}

export function Modal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  size = 'default',
}: {
  open: boolean
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'narrow' | 'default' | 'wide'
}) {
  const { t } = useI18n()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    const unlock = lockPageScroll()
    return () => {
      window.removeEventListener('keydown', onKey)
      unlock()
    }
  }, [open, onClose])

  if (!open) return null

  // Portalled to <body>: a `position: fixed` backdrop is only viewport-relative
  // when no ancestor establishes a containing block (a transform, filter or
  // containment anywhere above would re-anchor it mid-page).
  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={cx('modal', size !== 'default' && size)} role="dialog" aria-modal="true">
        <header className="modal-head">
          <div className="grow">
            <h3 style={{ fontSize: 18 }}>{title}</h3>
            {subtitle && <div className="faint" style={{ fontSize: 12.5, marginTop: 4 }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-sm close-x" onClick={onClose} aria-label={t('common.close')}>
            <IconClose size={16} />
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

/* ------------------------------------------------------------------ display */
export function Empty({ icon, title, body }: { icon: ReactNode; title: string; body?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h4>{title}</h4>
      {body && <p style={{ maxWidth: 400 }}>{body}</p>}
    </div>
  )
}

export function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count}/5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <IconStar key={i} size={12} filled={i < count} style={{ opacity: i < count ? 1 : 0.25 }} />
      ))}
    </span>
  )
}

export function Ornament({ width = 120 }: { width?: number }) {
  return (
    <svg className="ornament" width={width} height="10" viewBox="0 0 120 10" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1" fill="none">
        <path d="M0 5h44M76 5h44" />
        <rect x="55" y="0.9" width="8.2" height="8.2" />
        <rect x="55" y="0.9" width="8.2" height="8.2" transform="rotate(45 59.1 5)" />
      </g>
    </svg>
  )
}

export function BrandMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="brand-mark" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.5" fill="none">
        <rect x="7.5" y="7.5" width="17" height="17" />
        <rect x="7.5" y="7.5" width="17" height="17" transform="rotate(45 16 16)" />
        <circle cx="16" cy="16" r="3.4" />
      </g>
    </svg>
  )
}

/* ----------------------------------------------------------------- loading */
export function LoaderStar({ size = 30 }: { size?: number }) {
  return (
    <svg className="loader-star" width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="1.6" fill="none">
        <rect x="8" y="8" width="16" height="16" />
        <rect x="8" y="8" width="16" height="16" transform="rotate(45 16 16)" />
      </g>
    </svg>
  )
}

export function LoadingBlock({ label }: { label: string }) {
  return (
    <div className="loader-block" role="status" aria-live="polite">
      <LoaderStar />
      <div className="muted">
        {label}
        <span className="loader-dots" style={{ marginInlineStart: 6 }}>
          <i /><i /><i />
        </span>
      </div>
    </div>
  )
}

export function SkeletonFlightCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton-row">
        <div className="skeleton" style={{ width: 26, height: 26 }} />
        <div className="skeleton" style={{ width: 130, height: 11 }} />
        <div className="skeleton" style={{ width: 70, height: 11, marginInlineStart: 'auto' }} />
      </div>
      <div className="skeleton-row" style={{ gap: 18 }}>
        <div className="skeleton" style={{ width: 68, height: 26 }} />
        <div className="skeleton" style={{ flex: 1, height: 3 }} />
        <div className="skeleton" style={{ width: 68, height: 26 }} />
        <div className="skeleton" style={{ width: 92, height: 30 }} />
      </div>
      <div className="skeleton-row">
        <div className="skeleton" style={{ width: 96, height: 18, borderRadius: 99 }} />
        <div className="skeleton" style={{ width: 78, height: 18, borderRadius: 99 }} />
        <div className="skeleton" style={{ width: 110, height: 18, borderRadius: 99 }} />
      </div>
    </div>
  )
}

export function SkeletonStayCard() {
  return (
    <div className="card" aria-hidden="true" style={{ overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '5 / 3', borderRadius: 0 }} />
      <div className="skeleton-card" style={{ gap: 9 }}>
        <div className="skeleton" style={{ width: '72%', height: 14 }} />
        <div className="skeleton" style={{ width: '46%', height: 10 }} />
        <div className="skeleton-row">
          <div className="skeleton" style={{ width: 74, height: 18, borderRadius: 99 }} />
          <div className="skeleton" style={{ width: 62, height: 18, borderRadius: 99 }} />
        </div>
        <div className="skeleton" style={{ width: '38%', height: 18, marginInlineStart: 'auto' }} />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ inputs */
export function Select({
  value,
  onChange,
  children,
  ariaLabel,
  style,
}: {
  value: string
  onChange: (value: string) => void
  children: ReactNode
  ariaLabel?: string
  style?: React.CSSProperties
}) {
  return (
    <span className="select-wrap" style={style}>
      <select className="select" value={value} aria-label={ariaLabel} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
      <IconChevronDown size={15} />
    </span>
  )
}

export function Autocomplete<T>({
  label,
  display,
  placeholder,
  options,
  onQuery,
  onPick,
  renderOption,
  keyOf,
}: {
  label: string
  display: string
  placeholder?: string
  options: T[]
  onQuery: (q: string) => void
  onPick: (option: T) => void
  renderOption: (option: T) => ReactNode
  keyOf: (option: T) => string
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [highlight, setHighlight] = useState(0)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const commit = (option: T) => {
    onPick(option)
    setOpen(false)
    setDraft('')
  }

  return (
    <div className="field" ref={boxRef} style={{ position: 'relative' }}>
      <label>{label}</label>
      <input
        className="input"
        value={open ? draft : display}
        placeholder={placeholder}
        aria-label={label}
        aria-expanded={open}
        onFocus={() => {
          setDraft('')
          onQuery('')
          setOpen(true)
          setHighlight(0)
        }}
        onChange={(e) => {
          setDraft(e.target.value)
          onQuery(e.target.value)
          setHighlight(0)
          setOpen(true)
        }}
        onKeyDown={(e) => {
          if (!open) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlight((h) => Math.min(h + 1, options.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlight((h) => Math.max(0, h - 1))
          } else if (e.key === 'Enter' && options[highlight]) {
            e.preventDefault()
            commit(options[highlight])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
      />
      {open && options.length > 0 && (
        <div
          className="card"
          style={{
            position: 'absolute',
            insetBlockStart: 'calc(100% + 6px)',
            insetInline: 0,
            zIndex: 55,
            padding: 4,
            maxHeight: 280,
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {options.map((option, i) => (
            <button
              key={keyOf(option)}
              type="button"
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'start',
                border: 0,
                cursor: 'pointer',
                padding: '9px 11px',
                borderRadius: 'var(--radius-sm)',
                background: i === highlight ? 'var(--sunk)' : 'transparent',
                font: 'inherit',
                color: 'inherit',
              }}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => commit(option)}
            >
              {renderOption(option)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function Counter({
  label,
  value,
  min = 1,
  max = 9,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  onChange: (next: number) => void
}) {
  return (
    <div className="field">
      <label>{label}</label>
      <div className="row" style={{ gap: 6 }}>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`${label} −`}
        >
          <IconMinus size={14} />
        </button>
        <div className="input mono" style={{ textAlign: 'center', padding: '10px 4px', flex: 1 }} aria-live="polite">
          {value}
        </div>
        <button
          type="button"
          className="btn btn-sm"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`${label} +`}
        >
          <IconPlus size={14} />
        </button>
      </div>
    </div>
  )
}

export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="steps">
      {steps.map((step, i) => (
        <div key={step} style={{ display: 'contents' }}>
          {i > 0 && <div className="step-sep" />}
          <div className={cx('step', i === current && 'active', i < current && 'done')}>
            <i>{i < current ? <IconCheck size={11} /> : i + 1}</i>
            {step}
          </div>
        </div>
      ))}
    </div>
  )
}

/* -------------------------------------------------------------- date picker */
interface MonthGridProps {
  monthDate: Date
  selection: { start: string | null; end: string | null }
  hovered: string | null
  min: string
  max?: string
  range: boolean
  onPick: (iso: string) => void
  onHover: (iso: string | null) => void
}

function MonthGrid({ monthDate, selection, hovered, min, max, range, onPick, onHover }: MonthGridProps) {
  const { monthNames, weekdayNames } = useI18n()
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = todayIso()

  const provisionalEnd = selection.start && !selection.end ? hovered : selection.end

  const cells: (string | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => toIso(new Date(year, month, i + 1))),
  ]

  return (
    <div>
      <div className="dp-title" style={{ textAlign: 'center', marginBlockEnd: 10 }}>
        {monthNames[month]} {year}
      </div>
      <div className="dp-grid" role="grid">
        {weekdayNames.map((day, i) => (
          <div className="dp-dow" key={i}>{day}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div className="dp-day dp-blank" key={`e${i}`} />
          const disabled = iso < min || (max ? iso > max : false)
          const isStart = iso === selection.start
          const isEnd = iso === selection.end || (range && iso === provisionalEnd && iso !== selection.start)
          const lo = selection.start
          const hi = provisionalEnd
          const inRange =
            range && lo && hi && ((iso > lo && iso < hi) || (iso > hi && iso < lo))
          return (
            <button
              type="button"
              key={iso}
              className={cx(
                'dp-day',
                inRange && 'in-range',
                (isStart || isEnd) && 'edge',
                isStart && 'edge-start',
                isEnd && 'edge-end',
                iso === today && !isStart && !isEnd && 'today',
              )}
              disabled={disabled}
              onClick={() => onPick(iso)}
              onMouseEnter={() => onHover(iso)}
              onMouseLeave={() => onHover(null)}
              aria-label={iso}
            >
              {Number(iso.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function DateField({
  label,
  value,
  endValue,
  range = false,
  min = todayIso(),
  max,
  disabled,
  onChange,
}: {
  label: string
  value: string | null
  /** Range mode only: the second date. */
  endValue?: string | null
  range?: boolean
  min?: string
  max?: string
  disabled?: boolean
  onChange: (start: string, end?: string) => void
}) {
  const { t, formatDate, isRtl, arrow } = useI18n()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState<string | null>(null)
  const [cursor, setCursor] = useState(() => parseIso(value ?? min))
  const [pendingStart, setPendingStart] = useState<string | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false)
        setPendingStart(null)
      }
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  useEffect(() => {
    if (open) setCursor(parseIso(value ?? min))
  }, [open, value, min])

  const selection = useMemo(
    () =>
      range
        ? pendingStart
          ? { start: pendingStart, end: null }
          : { start: value, end: endValue ?? null }
        : { start: value, end: value },
    [range, pendingStart, value, endValue],
  )

  const pick = (iso: string) => {
    if (!range) {
      onChange(iso)
      setOpen(false)
      return
    }
    if (!pendingStart) {
      setPendingStart(iso)
      return
    }
    const [start, end] = iso < pendingStart ? [iso, pendingStart] : [pendingStart, iso]
    // A zero-night stay is not a stay — nudge the end out by one day.
    onChange(start, start === end ? addDays(end, 1) : end)
    setPendingStart(null)
    setOpen(false)
  }

  const shiftMonth = (delta: number) =>
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))

  const canGoBack = toIso(new Date(cursor.getFullYear(), cursor.getMonth(), 1)) > min

  const summary = range
    ? value && endValue
      ? `${formatDate(value, 'short')} ${arrow} ${formatDate(endValue, 'short')}`
      : null
    : value
      ? formatDate(value, 'short')
      : null

  const secondMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
  const Prev = isRtl ? IconChevronRight : IconChevronLeft
  const Next = isRtl ? IconChevronLeft : IconChevronRight

  return (
    <div className="field date-field" ref={boxRef}>
      <label>{label}</label>
      <button
        type="button"
        className="date-trigger"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <IconCalendar size={16} />
        <span className={cx('grow', 'truncate', !summary && 'placeholder')}>
          {summary ?? (range ? t('date.pickRange') : t('date.pickDate'))}
        </span>
      </button>

      {open && (
        <div className="dp-pop">
          <div className="dp-head">
            <button
              type="button"
              className="dp-nav"
              onClick={() => shiftMonth(-1)}
              disabled={!canGoBack}
              aria-label={t('date.prevMonth')}
            >
              <Prev size={15} />
            </button>
            <span className="faint" style={{ fontSize: 12 }}>
              {range ? t('date.pickRange') : t('date.pickDate')}
            </span>
            <button type="button" className="dp-nav" onClick={() => shiftMonth(1)} aria-label={t('date.nextMonth')}>
              <Next size={15} />
            </button>
          </div>

          <div className="dp-months">
            <MonthGrid
              monthDate={cursor}
              selection={selection}
              hovered={hovered}
              min={min}
              max={max}
              range={range}
              onPick={pick}
              onHover={setHovered}
            />
            {range && (
              <MonthGrid
                monthDate={secondMonth}
                selection={selection}
                hovered={hovered}
                min={min}
                max={max}
                range={range}
                onPick={pick}
                onHover={setHovered}
              />
            )}
          </div>

          <div className="dp-foot">
            <span className="faint" style={{ fontSize: 12 }}>
              {pendingStart ? formatDate(pendingStart, 'short') : (summary ?? '—')}
            </span>
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => {
                setPendingStart(null)
                setOpen(false)
              }}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
