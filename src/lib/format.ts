/** Locale-independent helpers. Anything that depends on language or currency
 *  lives in the i18n provider instead. */

/** Minutes -> "7h 45m" */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

/** Minutes -> "7 שע׳ 45 דק׳" */
export function durationHe(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h} שע׳ ${m} דק׳` : `${m} דק׳`
}

export const toIso = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, (m ?? 1) - 1, d ?? 1)
}

export function addDays(iso: string, days: number): string {
  const d = parseIso(iso)
  d.setDate(d.getDate() + days)
  return toIso(d)
}

export function nightsBetween(startIso: string, endIso: string): number {
  const ms = parseIso(endIso).getTime() - parseIso(startIso).getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Minutes past midnight -> "14:35" */
export function clock(minutesOfDay: number): string {
  const m = ((minutesOfDay % 1440) + 1440) % 1440
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`
}

export const todayIso = () => toIso(new Date())

export function makeRef(prefix: string): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ123456789'
  let out = ''
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `${prefix}-${out}`
}

export const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')
