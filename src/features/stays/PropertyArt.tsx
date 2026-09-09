/** Placeholder artwork for a property. Deterministic per property so the same
 *  listing always renders the same gradient — no external image requests. */
export function propertyGradient(hue: number, offset = 0) {
  // Cool half of the wheel only, at low saturation — busy listing grids stay calm.
  const h1 = 185 + ((hue + offset) % 130)
  const h2 = h1 + 28
  return `linear-gradient(145deg, hsl(${h1} 24% 30%), hsl(${h2} 30% 14%))`
}

const ICONS = ['🏨', '🏩', '🌇', '🏙️', '🌴', '🛏️', '🏝️', '🌆', '🛋️', '🪟']

export const propertyIcon = (hue: number, offset = 0) => ICONS[(hue + offset) % ICONS.length]
