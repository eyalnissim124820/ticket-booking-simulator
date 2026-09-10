import { makeRng, randInt } from '../../lib/rng'

/** Listing artwork. Every property gets a flat vector illustration built from
 *  its seed — architecture rather than abstract shapes, so a hostel in Lisbon
 *  and a lodge in Namibia don't look like the same card. No gradients, no
 *  network images: the whole gallery is drawn in the browser. */

type Palette = {
  sky: string
  far: string
  wall: string
  wallDark: string
  roof: string
  accent: string
  glass: string
  ground: string
}

const PALETTES: Palette[] = [
  // sun-bleached mediterranean
  { sky: '#dfe7e6', far: '#b9c6c2', wall: '#f2ece0', wallDark: '#e3d9c8', roof: '#b4643f', accent: '#14524a', glass: '#8fa6a4', ground: '#cbbfa8' },
  // terracotta old town
  { sky: '#efe2d2', far: '#d3b79b', wall: '#e9d5be', wallDark: '#d9bfa2', roof: '#9c4f34', accent: '#7a5220', glass: '#7d6a5a', ground: '#c1a487' },
  // northern harbour
  { sky: '#e2e7ec', far: '#aebac6', wall: '#f4f2ee', wallDark: '#dfdcd6', roof: '#33475c', accent: '#2b4a80', glass: '#93a7ba', ground: '#b9bfc4' },
  // deep green courtyard
  { sky: '#e6eae0', far: '#a9b79b', wall: '#efe9db', wallDark: '#ddd4c1', roof: '#3c5340', accent: '#14524a', glass: '#84998c', ground: '#b3b79c' },
  // desert / riad
  { sky: '#f2e6d5', far: '#dcc0a0', wall: '#e6c9a8', wallDark: '#d3ac86', roof: '#8e4a2f', accent: '#a03a63', glass: '#8a6a52', ground: '#cfa87f' },
  // dusk city
  { sky: '#dcdae4', far: '#a9a6bb', wall: '#eceaf0', wallDark: '#d7d4de', roof: '#4a3b7a', accent: '#4a3b7a', glass: '#8d8aa3', ground: '#b4b1bf' },
]

type Scene = 'coastal' | 'townhouse' | 'tower' | 'courtyard' | 'alpine'
const SCENES: Scene[] = ['coastal', 'townhouse', 'tower', 'courtyard', 'alpine']

function WindowGrid({
  x, y, cols, rows, gapX, gapY, w, h, glass, lit,
}: {
  x: number; y: number; cols: number; rows: number
  gapX: number; gapY: number; w: number; h: number; glass: string; lit: boolean[]
}) {
  const cells = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const index = r * cols + c
      cells.push(
        <rect
          key={index}
          x={x + c * (w + gapX)}
          y={y + r * (h + gapY)}
          width={w}
          height={h}
          fill={lit[index % lit.length] ? '#f6d99a' : glass}
        />,
      )
    }
  }
  return <g>{cells}</g>
}

export function PropertyArt({ seed, variant = 0 }: { seed: number; variant?: number }) {
  const rng = makeRng(`art-${seed}-${variant}`)
  const palette = PALETTES[(seed + variant * 3) % PALETTES.length]
  const scene = SCENES[(seed + variant) % SCENES.length]
  const lit = Array.from({ length: 24 }, () => rng() < 0.28)
  const horizon = 196

  return (
    <svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMid slice" role="img" aria-hidden="true">
      <rect width="500" height="300" fill={palette.sky} />
      <circle cx={variant % 2 === 0 ? 402 : 92} cy="62" r="26" fill={palette.accent} opacity="0.16" />

      {/* far silhouette */}
      {scene === 'alpine' ? (
        <path
          d={`M0 ${horizon} L86 78 L142 126 L206 52 L292 150 L338 108 L420 ${horizon} Z M0 ${horizon} H500 V${horizon} Z`}
          fill={palette.far}
        />
      ) : scene === 'coastal' ? (
        <path d={`M0 ${horizon} Q120 150 250 ${horizon} T500 ${horizon} V300 H0 Z`} fill={palette.far} />
      ) : (
        <g fill={palette.far}>
          {Array.from({ length: 9 }, (_, i) => (
            <rect key={i} x={i * 58} y={horizon - randInt(rng, 26, 92)} width={44} height={140} />
          ))}
        </g>
      )}

      <rect y={horizon} width="500" height={300 - horizon} fill={palette.ground} />

      {/* subject */}
      {scene === 'tower' && (
        <g>
          <rect x="168" y="46" width="164" height={horizon - 46} fill={palette.wall} />
          <rect x="168" y="46" width="26" height={horizon - 46} fill={palette.wallDark} />
          <rect x="160" y="38" width="180" height="12" fill={palette.roof} />
          <WindowGrid x={204} y={70} cols={4} rows={6} gapX={16} gapY={14} w={18} h={14} glass={palette.glass} lit={lit} />
          <rect x="230" y={horizon - 34} width="40" height="34" fill={palette.roof} />
        </g>
      )}

      {scene === 'townhouse' && (
        <g>
          <rect x="96" y="96" width="132" height={horizon - 96} fill={palette.wall} />
          <rect x="236" y="72" width="150" height={horizon - 72} fill={palette.wallDark} />
          <path d="M88 98 L162 58 L236 98 Z" fill={palette.roof} />
          <rect x="230" y="64" width="162" height="10" fill={palette.roof} />
          <WindowGrid x={116} y={118} cols={3} rows={2} gapX={22} gapY={20} w={22} h={26} glass={palette.glass} lit={lit} />
          <WindowGrid x={256} y={96} cols={3} rows={3} gapX={24} gapY={18} w={22} h={22} glass={palette.glass} lit={lit} />
          <rect x="148" y={horizon - 42} width="28" height="42" fill={palette.roof} />
          <rect x="96" y="150" width="132" height="5" fill={palette.accent} />
        </g>
      )}

      {scene === 'courtyard' && (
        <g>
          <rect x="70" y="88" width="360" height={horizon - 88} fill={palette.wall} />
          <rect x="70" y="80" width="360" height="12" fill={palette.roof} />
          {Array.from({ length: 5 }, (_, i) => (
            <path
              key={i}
              d={`M${104 + i * 66} ${horizon} v-54 a20 20 0 0 1 40 0 v54 Z`}
              fill={palette.wallDark}
            />
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <path
              key={`in-${i}`}
              d={`M${112 + i * 66} ${horizon} v-48 a12 12 0 0 1 24 0 v48 Z`}
              fill={palette.glass}
            />
          ))}
          <rect x="70" y="104" width="360" height="4" fill={palette.accent} />
        </g>
      )}

      {scene === 'coastal' && (
        <g>
          <rect y={horizon} width="500" height={300 - horizon} fill={palette.far} />
          <rect x="120" y="104" width="118" height={horizon - 104} fill={palette.wall} />
          <rect x="246" y="128" width="90" height={horizon - 128} fill={palette.wallDark} />
          <rect x="112" y="96" width="134" height="10" fill={palette.roof} />
          <rect x="240" y="120" width="102" height="9" fill={palette.roof} />
          <WindowGrid x={140} y={124} cols={3} rows={2} gapX={20} gapY={18} w={20} h={22} glass={palette.glass} lit={lit} />
          <WindowGrid x={264} y={146} cols={2} rows={1} gapX={26} gapY={0} w={22} h={22} glass={palette.glass} lit={lit} />
          {/* palms */}
          <g stroke={palette.roof} strokeWidth="4" fill="none" strokeLinecap="round">
            <path d={`M400 ${horizon} q6 -34 2 -52`} />
            <path d="M402 142 q-22 -12 -32 -2M402 142 q22 -12 32 -2M402 142 q-12 -22 -4 -32M402 142 q14 -20 24 -18" />
          </g>
          {/* water lines */}
          <g stroke={palette.sky} strokeWidth="2.5" opacity="0.55" strokeLinecap="round">
            <path d="M28 236h60M112 258h74M300 244h72M186 276h88" />
          </g>
        </g>
      )}

      {scene === 'alpine' && (
        <g>
          <rect x="140" y="112" width="200" height={horizon - 112} fill={palette.wall} />
          <path d="M126 116 L240 62 L354 116 Z" fill={palette.roof} />
          <rect x="140" y="150" width="200" height="6" fill={palette.wallDark} />
          <WindowGrid x={168} y={126} cols={4} rows={1} gapX={22} gapY={0} w={24} h={18} glass={palette.glass} lit={lit} />
          <WindowGrid x={168} y={164} cols={4} rows={1} gapX={22} gapY={0} w={24} h={22} glass={palette.glass} lit={lit} />
          <g fill={palette.roof}>
            <path d="M84 196 L100 148 L116 196 Z" />
            <path d="M392 196 L406 156 L420 196 Z" />
          </g>
        </g>
      )}

      {/* foreground rule, ties the illustrations together as a set */}
      <rect y="292" width="500" height="8" fill={palette.accent} opacity="0.18" />
    </svg>
  )
}
