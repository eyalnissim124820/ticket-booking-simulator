/** Flat, geometric carrier marks drawn as inline SVG — one distinct silhouette
 *  per airline, no gradients and no bitmap assets to load. */
export type AirlineMark = 'chevron' | 'arc' | 'star' | 'delta' | 'wave' | 'sun' | 'crown'

const MARKS: Record<AirlineMark, (color: string) => JSX.Element> = {
  chevron: (c) => (
    <g fill="none" stroke={c} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round">
      <path d="M7 20 16 9l9 11" />
      <path d="M11 24l5-6 5 6" />
    </g>
  ),
  arc: (c) => (
    <g fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round">
      <path d="M6 22a10 10 0 0 1 20 0" />
      <circle cx="16" cy="22" r="2.4" fill={c} stroke="none" />
    </g>
  ),
  star: (c) => (
    <g fill={c}>
      <path d="M16 5.5 18 14l8.5 2-8.5 2-2 8.5-2-8.5L5.5 16l8.5-2 2-8.5Z" />
    </g>
  ),
  delta: (c) => (
    <g fill={c}>
      <path d="M16 6 27 25H5L16 6Z" />
      <path d="M16 14.5 21 24h-10l5-9.5Z" fill="#fff" />
    </g>
  ),
  wave: (c) => (
    <g fill="none" stroke={c} strokeWidth="2.6" strokeLinecap="round">
      <path d="M5 13c3.7-4 7.3-4 11 0s7.3 4 11 0" />
      <path d="M5 21c3.7-4 7.3-4 11 0s7.3 4 11 0" />
    </g>
  ),
  sun: (c) => (
    <g stroke={c} strokeWidth="2.4" strokeLinecap="round">
      <circle cx="16" cy="16" r="5.2" fill="none" />
      <path d="M16 4v3.4M16 24.6V28M4 16h3.4M24.6 16H28M7.5 7.5l2.4 2.4M22.1 22.1l2.4 2.4M24.5 7.5l-2.4 2.4M9.9 22.1l-2.4 2.4" />
    </g>
  ),
  crown: (c) => (
    <g fill={c}>
      <path d="M5 23V11l5.5 5L16 8l5.5 8L27 11v12H5Z" />
      <rect x="5" y="24.5" width="22" height="2.5" />
    </g>
  ),
}

export function AirlineLogo({
  mark,
  color,
  size = 26,
  title,
}: {
  mark: AirlineMark
  color: string
  size?: number
  title?: string
}) {
  return (
    <svg
      className="airline-logo"
      width={size}
      height={size}
      viewBox="0 0 32 32"
      role="img"
      aria-label={title}
    >
      <rect width="32" height="32" fill="#fff" />
      {MARKS[mark](color)}
    </svg>
  )
}
