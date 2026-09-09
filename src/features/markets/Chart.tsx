import { useMemo, useRef, useState } from 'react'
import { money } from '../../lib/format'

interface Point {
  x: number
  y: number
  value: number
  index: number
}

/** Line + area chart drawn as inline SVG, with a hover crosshair.
 *  Nothing here depends on a charting library. */
export function PriceChart({
  series,
  height = 260,
  positive,
  label = 'Price',
}: {
  series: number[]
  height?: number
  positive: boolean
  label?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<Point | null>(null)
  const width = 800
  const padding = { top: 14, right: 8, bottom: 22, left: 52 }

  const { path, area, points, min, max, ticks } = useMemo(() => {
    const clean = series.filter((v) => Number.isFinite(v))
    if (clean.length < 2) {
      return { path: '', area: '', points: [] as Point[], min: 0, max: 0, ticks: [] as number[] }
    }
    const lo = Math.min(...clean)
    const hi = Math.max(...clean)
    const span = hi - lo || hi * 0.02 || 1
    const pad = span * 0.12
    const min = lo - pad
    const max = hi + pad
    const innerW = width - padding.left - padding.right
    const innerH = height - padding.top - padding.bottom

    const pts: Point[] = clean.map((value, i) => ({
      x: padding.left + (i / (clean.length - 1)) * innerW,
      y: padding.top + (1 - (value - min) / (max - min)) * innerH,
      value,
      index: i,
    }))

    // Smooth the line a little with a mid-point quadratic curve.
    let d = `M ${pts[0].x} ${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1]
      const cur = pts[i]
      const mx = (prev.x + cur.x) / 2
      d += ` Q ${prev.x} ${prev.y} ${mx} ${(prev.y + cur.y) / 2}`
    }
    d += ` L ${pts[pts.length - 1].x} ${pts[pts.length - 1].y}`

    const areaPath = `${d} L ${pts[pts.length - 1].x} ${height - padding.bottom} L ${pts[0].x} ${height - padding.bottom} Z`
    const tickValues = Array.from({ length: 5 }, (_, i) => min + ((max - min) * i) / 4)

    return { path: d, area: areaPath, points: pts, min, max, ticks: tickValues }
  }, [series, height])

  if (!points.length) {
    return (
      <div className="skeleton-line" style={{ height, borderRadius: 'var(--radius)' }} aria-label="Loading chart" />
    )
  }

  const stroke = positive ? 'var(--up)' : 'var(--down)'
  const gradientId = positive ? 'grad-up' : 'grad-down'

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relative = ((e.clientX - rect.left) / rect.width) * width
    let closest = points[0]
    for (const p of points) {
      if (Math.abs(p.x - relative) < Math.abs(closest.x - relative)) closest = p
    }
    setHover(closest)
  }

  return (
    <div className="chart-wrap" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height, display: 'block' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${label} chart`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={positive ? '#34d399' : '#f87171'} stopOpacity="0.28" />
            <stop offset="100%" stopColor={positive ? '#34d399' : '#f87171'} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((value, i) => {
          const y = padding.top + (1 - (value - min) / (max - min)) * (height - padding.top - padding.bottom)
          return (
            <g key={i}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                stroke="var(--line-soft)"
                strokeDasharray="3 5"
              />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="11" fill="var(--text-faint)" fontFamily="var(--mono)">
                {value >= 1000 ? value.toFixed(0) : value.toFixed(2)}
              </text>
            </g>
          )
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {hover && (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="var(--text-faint)"
              strokeDasharray="4 4"
            />
            <circle cx={hover.x} cy={hover.y} r="4.5" fill={stroke} stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="chart-tooltip"
          style={{
            left: `${(hover.x / width) * 100}%`,
            top: (hover.y / height) * 100 + '%',
          }}
        >
          {money(hover.value)}
        </div>
      )}
    </div>
  )
}

/** Compact inline sparkline for list rows. */
export function Sparkline({ series, positive }: { series: number[]; positive: boolean }) {
  const w = 64
  const h = 22
  const path = useMemo(() => {
    const clean = series.filter((v) => Number.isFinite(v))
    if (clean.length < 2) return ''
    const lo = Math.min(...clean)
    const hi = Math.max(...clean)
    const span = hi - lo || 1
    return clean
      .map((v, i) => {
        const x = (i / (clean.length - 1)) * w
        const y = h - ((v - lo) / span) * h
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }, [series])

  if (!path) return null
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <path d={path} fill="none" stroke={positive ? 'var(--up)' : 'var(--down)'} strokeWidth="1.5" />
    </svg>
  )
}
