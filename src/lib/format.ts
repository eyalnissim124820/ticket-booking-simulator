const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const currencyWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

export const money = (value: number) => currency.format(value)
export const moneyWhole = (value: number) => currencyWhole.format(value)

export const signedMoney = (value: number) => (value >= 0 ? '+' : '−') + money(Math.abs(value))
export const signedPercent = (value: number) =>
  (value >= 0 ? '+' : '−') + Math.abs(value).toFixed(2) + '%'

export const number = (value: number, digits = 2) =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** Minutes -> "7h 45m" */
export function duration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`
}

export const toIso = (d: Date) => d.toISOString().slice(0, 10)

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

export function shortDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function mediumDate(iso: string): string {
  return parseIso(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/** Minutes past midnight -> "14:35" */
export function clock(minutesOfDay: number): string {
  const m = ((minutesOfDay % 1440) + 1440) % 1440
  return `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`
}

export function timeAgo(timestamp: number): string {
  const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000))
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.round(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.round(seconds / 3600)}h ago`
  return `${Math.round(seconds / 86400)}d ago`
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
