import { gaussian, makeRng, randFloat, type Rng } from '../lib/rng'

export type Sector =
  | 'Technology'
  | 'Consumer'
  | 'Energy'
  | 'Healthcare'
  | 'Financials'
  | 'Industrials'

export interface Instrument {
  symbol: string
  name: string
  sector: Sector
  /** Starting price for the simulated series. */
  seedPrice: number
  /** Annualised volatility used by the random walk. */
  volatility: number
  /** Long-run drift per year. */
  drift: number
  marketCapB: number
  peRatio: number
  dividendYield: number
  about: string
}

export const INSTRUMENTS: Instrument[] = [
  { symbol: 'NVAX', name: 'Nova Systems', sector: 'Technology', seedPrice: 418.2, volatility: 0.44, drift: 0.18, marketCapB: 1240, peRatio: 41.2, dividendYield: 0, about: 'Designs accelerator silicon and the software stack that runs on it.' },
  { symbol: 'HELX', name: 'Helix Bio', sector: 'Healthcare', seedPrice: 96.4, volatility: 0.52, drift: 0.1, marketCapB: 88, peRatio: 33.8, dividendYield: 0, about: 'Clinical-stage biotech focused on protein degradation therapies.' },
  { symbol: 'ORBT', name: 'Orbital Freight', sector: 'Industrials', seedPrice: 142.75, volatility: 0.31, drift: 0.07, marketCapB: 61, peRatio: 19.4, dividendYield: 1.2, about: 'Global air and sea logistics with an automated port terminal business.' },
  { symbol: 'LUMN', name: 'Lumen Grid', sector: 'Energy', seedPrice: 58.3, volatility: 0.38, drift: 0.09, marketCapB: 44, peRatio: 22.1, dividendYield: 2.4, about: 'Utility-scale storage and grid balancing across three continents.' },
  { symbol: 'CRDL', name: 'Cordial Brands', sector: 'Consumer', seedPrice: 74.9, volatility: 0.22, drift: 0.05, marketCapB: 52, peRatio: 24.6, dividendYield: 2.9, about: 'Household and personal care labels sold in 60 markets.' },
  { symbol: 'ATLB', name: 'Atlas Bancorp', sector: 'Financials', seedPrice: 187.6, volatility: 0.27, drift: 0.06, marketCapB: 210, peRatio: 12.8, dividendYield: 3.4, about: 'Commercial bank with a large treasury services franchise.' },
  { symbol: 'QUIL', name: 'Quill Software', sector: 'Technology', seedPrice: 233.1, volatility: 0.4, drift: 0.14, marketCapB: 176, peRatio: 55.3, dividendYield: 0, about: 'Collaboration and document tooling sold to enterprises by seat.' },
  { symbol: 'VERD', name: 'Verdant Foods', sector: 'Consumer', seedPrice: 39.8, volatility: 0.25, drift: 0.03, marketCapB: 18, peRatio: 17.9, dividendYield: 3.8, about: 'Packaged plant-based foods and a fast-growing café franchise.' },
  { symbol: 'KSTR', name: 'Kestrel Aero', sector: 'Industrials', seedPrice: 312.4, volatility: 0.35, drift: 0.11, marketCapB: 132, peRatio: 28.7, dividendYield: 0.9, about: 'Airframes, engines and long-cycle defence contracts.' },
  { symbol: 'SOLR', name: 'Solaris Petro', sector: 'Energy', seedPrice: 121.9, volatility: 0.42, drift: 0.02, marketCapB: 168, peRatio: 9.6, dividendYield: 5.1, about: 'Integrated oil and gas with a growing renewables arm.' },
  { symbol: 'MRDN', name: 'Meridian Health', sector: 'Healthcare', seedPrice: 268.5, volatility: 0.24, drift: 0.08, marketCapB: 340, peRatio: 20.3, dividendYield: 1.7, about: 'Hospital networks and an integrated insurance business.' },
  { symbol: 'ZPHR', name: 'Zephyr Mobility', sector: 'Consumer', seedPrice: 88.2, volatility: 0.61, drift: 0.16, marketCapB: 71, peRatio: 72.4, dividendYield: 0, about: 'Electric vehicles and a charging network spun out in 2021.' },
]
export const INSTRUMENT_BY_SYMBOL = new Map(INSTRUMENTS.map((i) => [i.symbol, i]))

export interface Candle {
  /** Sequence index; 0 is the oldest point in the generated history. */
  t: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

const HISTORY_DAYS = 400

/** Geometric random walk producing a stable daily history per symbol. */
function buildHistory(instrument: Instrument): Candle[] {
  const rng: Rng = makeRng(`history-${instrument.symbol}`)
  const dailyDrift = instrument.drift / 252
  const dailyVol = instrument.volatility / Math.sqrt(252)
  const candles: Candle[] = []
  // Walk backwards from the seed price so the latest close equals seedPrice.
  const closes: number[] = [instrument.seedPrice]
  for (let i = 1; i < HISTORY_DAYS; i++) {
    const shock = dailyDrift + dailyVol * gaussian(rng)
    closes.push(closes[i - 1] / Math.exp(shock))
  }
  closes.reverse()

  for (let i = 0; i < closes.length; i++) {
    const close = closes[i]
    const open = i === 0 ? close * randFloat(rng, 0.99, 1.01) : closes[i - 1]
    const spread = close * dailyVol * randFloat(rng, 0.4, 1.6)
    candles.push({
      t: i,
      open: round2(open),
      close: round2(close),
      high: round2(Math.max(open, close) + spread * rng()),
      low: round2(Math.min(open, close) - spread * rng()),
      volume: Math.round(randFloat(rng, 0.6, 2.4) * instrument.marketCapB * 9000),
    })
  }
  return candles
}

const round2 = (v: number) => Math.round(v * 100) / 100

export const HISTORY: Record<string, Candle[]> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, buildHistory(i)]),
)

export interface Quote {
  symbol: string
  price: number
  /** Change vs. the previous session close. */
  change: number
  changePercent: number
  dayHigh: number
  dayLow: number
  prevClose: number
  volume: number
  /** Rolling intraday marks, appended on every tick. */
  intraday: number[]
  updatedAt: number
}

export function initialQuotes(): Record<string, Quote> {
  const out: Record<string, Quote> = {}
  for (const instrument of INSTRUMENTS) {
    const candles = HISTORY[instrument.symbol]
    const last = candles[candles.length - 1]
    const prevClose = candles[candles.length - 2].close
    out[instrument.symbol] = {
      symbol: instrument.symbol,
      price: last.close,
      change: round2(last.close - prevClose),
      changePercent: round2(((last.close - prevClose) / prevClose) * 100),
      dayHigh: last.high,
      dayLow: last.low,
      prevClose,
      volume: last.volume,
      intraday: [last.close],
      updatedAt: Date.now(),
    }
  }
  return out
}

const tickRng = makeRng(`ticks-${Math.floor(Math.random() * 1e9)}`)

/** Advances every quote one step. Called on an interval by the market store. */
export function tickQuotes(quotes: Record<string, Quote>): Record<string, Quote> {
  const next: Record<string, Quote> = {}
  for (const instrument of INSTRUMENTS) {
    const q = quotes[instrument.symbol]
    if (!q) continue
    // ~2s per tick, scaled so a session's worth of ticks looks like a trading day.
    const stepVol = instrument.volatility / Math.sqrt(252 * 1800)
    const shock = stepVol * gaussian(tickRng) * 6
    const price = round2(Math.max(0.5, q.price * Math.exp(shock)))
    const intraday = [...q.intraday, price]
    if (intraday.length > 240) intraday.shift()
    next[instrument.symbol] = {
      ...q,
      price,
      change: round2(price - q.prevClose),
      changePercent: round2(((price - q.prevClose) / q.prevClose) * 100),
      dayHigh: Math.max(q.dayHigh, price),
      dayLow: Math.min(q.dayLow, price),
      volume: q.volume + Math.round(Math.abs(shock) * 4_000_000),
      intraday,
      updatedAt: Date.now(),
    }
  }
  return next
}

export type Range = '1D' | '1W' | '1M' | '6M' | '1Y'

export const RANGES: Range[] = ['1D', '1W', '1M', '6M', '1Y']

const RANGE_DAYS: Record<Range, number> = { '1D': 2, '1W': 7, '1M': 30, '6M': 180, '1Y': 365 }

export function seriesFor(symbol: string, range: Range, livePrice: number, intraday: number[]): number[] {
  if (range === '1D') {
    const candles = HISTORY[symbol]
    const base = candles[candles.length - 1]
    // Blend the generated session shape with the live ticks collected so far.
    const shape = [base.open, base.low, base.high, base.close]
    return intraday.length > 3 ? intraday : [...shape, livePrice]
  }
  const candles = HISTORY[symbol]
  const days = RANGE_DAYS[range]
  const slice = candles.slice(Math.max(0, candles.length - days)).map((c) => c.close)
  return [...slice.slice(0, -1), livePrice]
}

export function candlesFor(symbol: string, range: Range): Candle[] {
  const candles = HISTORY[symbol]
  const days = RANGE_DAYS[range]
  return candles.slice(Math.max(0, candles.length - days))
}

export const NEWS_TEMPLATES = [
  { headline: '{name} beats on quarterly revenue, raises full-year guidance', source: 'Market Wire', sentiment: 1 },
  { headline: 'Analysts at Pierce & Co. lift {symbol} price target', source: 'Street Notes', sentiment: 1 },
  { headline: '{name} announces buyback of up to $4B', source: 'Capital Daily', sentiment: 1 },
  { headline: 'Regulator opens review into {name} pricing practices', source: 'Policy Desk', sentiment: -1 },
  { headline: '{name} delays flagship launch to next quarter', source: 'Market Wire', sentiment: -1 },
  { headline: 'Supply constraints weigh on {symbol} margins, says note', source: 'Street Notes', sentiment: -1 },
  { headline: '{name} names new chief financial officer', source: 'Capital Daily', sentiment: 0 },
  { headline: '{symbol} added to the Skyline 100 index', source: 'Index Watch', sentiment: 0 },
]

export interface NewsItem {
  id: string
  symbol: string
  headline: string
  source: string
  sentiment: number
  minutesAgo: number
}

export function newsFor(symbol: string): NewsItem[] {
  const instrument = INSTRUMENT_BY_SYMBOL.get(symbol)
  if (!instrument) return []
  const rng = makeRng(`news-${symbol}`)
  return NEWS_TEMPLATES.map((t, i) => ({ t, i, r: rng() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 4)
    .map(({ t, i }) => ({
      id: `${symbol}-${i}`,
      symbol,
      headline: t.headline.replace('{name}', instrument.name).replace('{symbol}', symbol),
      source: t.source,
      sentiment: t.sentiment,
      minutesAgo: Math.round(randFloat(rng, 8, 1400)),
    }))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
}
