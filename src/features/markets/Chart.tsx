import { useMemo, useRef, useState } from 'react'
import { useI18n } from '../../i18n'

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
  height = 264,
  positive,
  label,
}: {
  series: number[]
  height?: number
  positive: boolean
  label: string
}) {
  const { money, number } = useI18n()
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
    return <div className="skeleton" style={{ height }} aria-hidden="true" />
  }

  const stroke = positive ? 'var(--up)' : 'var(--down)'
  const fill = positive ? 'var(--up-soft)' : 'var(--down-soft)'
  // Redraw the line whenever the shape changes, so range switches animate.
  const pathKey = `${label}-${series.length}-${positive}`

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
        // Price series read left-to-right in both locales, and RTL would flip
        // where `text-anchor: end` puts the axis labels.
        direction="ltr"
        style={{ width: '100%', height, display: 'block', direction: 'ltr' }}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`${label} chart`}
      >
        {ticks.map((value, i) => {
          const y = padding.top + (1 - (value - min) / (max - min)) * (height - padding.top - padding.bottom)
          return (
            <g key={i}>
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--rule)" />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize="11"
                fill="var(--ink-3)"
                fontFamily="var(--mono)"
              >
                {number(value, value >= 1000 ? 0 : 2)}
              </text>
            </g>
          )
        })}

        {/* Flat tint under the line — no gradient. */}
        <path d={area} fill={fill} />
        <path
          key={pathKey}
          d={path}
          fill="none"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength={1}
          style={{
            // @ts-expect-error custom property consumed by the drawLine keyframes
            '--len': 1,
            strokeDasharray: 1,
            animation: 'drawLine 0.7s cubic-bezier(0.4, 0, 0.2, 1) both',
          }}
        />

        {hover && (
          <g>
            <line
              x1={hover.x}
              x2={hover.x}
              y1={padding.top}
              y2={height - padding.bottom}
              stroke="var(--ink-3)"
              strokeDasharray="3 4"
            />
            <circle cx={hover.x} cy={hover.y} r="4" fill={stroke} stroke="var(--card)" strokeWidth="2" />
          </g>
        )}
      </svg>

      {hover && (
        <div
          className="chart-tooltip"
          style={{ left: `${(hover.x / width) * 100}%`, top: `${(hover.y / height) * 100}%` }}
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
      <path d={path} fill="none" stroke={positive ? 'var(--up)' : 'var(--down)'} strokeWidth="1.4" />
    </svg>
  )
}
