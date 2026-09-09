import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/format'

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
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={cx('modal', size === 'wide' && 'wide', size === 'narrow' && 'narrow')}
        role="dialog"
        aria-modal="true"
      >
        <header className="modal-head">
          <div className="grow">
            <h3 style={{ fontSize: 16 }}>{title}</h3>
            {subtitle && <div className="faint" style={{ fontSize: 12.5 }}>{subtitle}</div>}
          </div>
          <button className="btn btn-ghost btn-sm close-x" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

export function Empty({ icon, title, body }: { icon: string; title: string; body?: string }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <strong style={{ color: 'var(--text)' }}>{title}</strong>
      {body && <p style={{ maxWidth: 380 }}>{body}</p>}
    </div>
  )
}

export function Stars({ count }: { count: number }) {
  return (
    <span className="stars" aria-label={`${count} star property`}>
      {'★'.repeat(count)}
      <span style={{ opacity: 0.25 }}>{'★'.repeat(Math.max(0, 5 - count))}</span>
    </span>
  )
}

/** Text input with a filtered dropdown of suggestions. */
export function Autocomplete<T>({
  label,
  value,
  display,
  placeholder,
  options,
  onQuery,
  onPick,
  renderOption,
  keyOf,
}: {
  label: string
  value: string
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
        aria-label={label}
        aria-expanded={open}
        data-value={value}
      />
      {open && options.length > 0 && (
        <div
          className="card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 30,
            padding: 6,
            maxHeight: 268,
            overflowY: 'auto',
            boxShadow: 'var(--shadow-lg)',
            background: 'var(--bg-elevated)',
          }}
        >
          {options.map((option, i) => (
            <button
              key={keyOf(option)}
              className="watch-row"
              style={{
                display: 'block',
                background: i === highlight ? 'var(--surface-2)' : 'transparent',
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
          className="btn btn-sm"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div
          className="input mono"
          style={{ textAlign: 'center', padding: '10px 4px', flex: 1 }}
          aria-live="polite"
        >
          {value}
        </div>
        <button
          className="btn btn-sm"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          +
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
            <i>{i < current ? '✓' : i + 1}</i>
            {step}
          </div>
        </div>
      ))}
    </div>
  )
}

export function Toggle({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[]
  value: string
  onChange: (id: string) => void
}) {
  return (
    <div className="tabs" style={{ display: 'inline-flex' }}>
      {options.map((o) => (
        <button
          key={o.id}
          className="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
