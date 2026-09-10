import { gaussian, makeRng, randFloat, type Rng } from '../lib/rng'
import type { LocaleCode } from '../i18n'
import type { MessageKey } from '../i18n/en'

export type Sector =
  | 'Technology'
  | 'Consumer'
  | 'Energy'
  | 'Healthcare'
  | 'Financials'
  | 'Industrials'
  | 'RealEstate'
  | 'Defence'

export const sectorKey = (sector: Sector): MessageKey => `sector.${sector}` as MessageKey

export type Exchange = 'global' | 'tase'

export interface Instrument {
  symbol: string
  name: string
  nameHe: string
  /** Which board the instrument trades on. The Hebrew edition leads with TASE. */
  exchange: Exchange
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
  aboutHe: string
}

export const instrumentName = (instrument: Instrument, locale: LocaleCode) =>
  locale === 'he' ? instrument.nameHe : instrument.name

export const instrumentAbout = (instrument: Instrument, locale: LocaleCode) =>
  locale === 'he' ? instrument.aboutHe : instrument.about

export const INSTRUMENTS: Instrument[] = [
  // ---- Global board (fictional issuers)
  { symbol: 'NVAX', name: 'Nova Systems', nameHe: 'נובה סיסטמס', exchange: 'global', sector: 'Technology', seedPrice: 418.2, volatility: 0.44, drift: 0.18, marketCapB: 1240, peRatio: 41.2, dividendYield: 0, about: 'Designs accelerator silicon and the software stack that runs on it.', aboutHe: 'מפתחת שבבי האצה ואת שכבת התוכנה שרצה מעליהם.' },
  { symbol: 'HELX', name: 'Helix Bio', nameHe: 'הליקס ביו', exchange: 'global', sector: 'Healthcare', seedPrice: 96.4, volatility: 0.52, drift: 0.1, marketCapB: 88, peRatio: 33.8, dividendYield: 0, about: 'Clinical-stage biotech focused on protein degradation therapies.', aboutHe: 'חברת ביוטק בשלב קליני המתמקדת בטיפולי פירוק חלבונים.' },
  { symbol: 'ORBT', name: 'Orbital Freight', nameHe: 'אורביטל פרייט', exchange: 'global', sector: 'Industrials', seedPrice: 142.75, volatility: 0.31, drift: 0.07, marketCapB: 61, peRatio: 19.4, dividendYield: 1.2, about: 'Global air and sea logistics with an automated port terminal business.', aboutHe: 'לוגיסטיקה אווירית וימית עולמית, לצד מסופי נמל אוטומטיים.' },
  { symbol: 'LUMN', name: 'Lumen Grid', nameHe: 'לומן גריד', exchange: 'global', sector: 'Energy', seedPrice: 58.3, volatility: 0.38, drift: 0.09, marketCapB: 44, peRatio: 22.1, dividendYield: 2.4, about: 'Utility-scale storage and grid balancing across three continents.', aboutHe: 'אגירת אנרגיה בקנה מידה תעשייתי ואיזון רשתות בשלוש יבשות.' },
  { symbol: 'CRDL', name: 'Cordial Brands', nameHe: 'קורדיאל ברנדס', exchange: 'global', sector: 'Consumer', seedPrice: 74.9, volatility: 0.22, drift: 0.05, marketCapB: 52, peRatio: 24.6, dividendYield: 2.9, about: 'Household and personal care labels sold in 60 markets.', aboutHe: 'מותגי טיפוח ומוצרי בית הנמכרים ב-60 שווקים.' },
  { symbol: 'ATLB', name: 'Atlas Bancorp', nameHe: 'אטלס בנקורפ', exchange: 'global', sector: 'Financials', seedPrice: 187.6, volatility: 0.27, drift: 0.06, marketCapB: 210, peRatio: 12.8, dividendYield: 3.4, about: 'Commercial bank with a large treasury services franchise.', aboutHe: 'בנק מסחרי עם זרוע שירותי נוסטרו רחבה.' },
  { symbol: 'QUIL', name: 'Quill Software', nameHe: 'קוויל סופטוור', exchange: 'global', sector: 'Technology', seedPrice: 233.1, volatility: 0.4, drift: 0.14, marketCapB: 176, peRatio: 55.3, dividendYield: 0, about: 'Collaboration and document tooling sold to enterprises by seat.', aboutHe: 'כלי שיתוף פעולה ומסמכים הנמכרים לארגונים לפי מושב.' },
  { symbol: 'VERD', name: 'Verdant Foods', nameHe: 'ורדנט פודס', exchange: 'global', sector: 'Consumer', seedPrice: 39.8, volatility: 0.25, drift: 0.03, marketCapB: 18, peRatio: 17.9, dividendYield: 3.8, about: 'Packaged plant-based foods and a fast-growing café franchise.', aboutHe: 'מזון צמחי ארוז ורשת בתי קפה בצמיחה מהירה.' },
  { symbol: 'KSTR', name: 'Kestrel Aero', nameHe: 'קסטרל אארו', exchange: 'global', sector: 'Industrials', seedPrice: 312.4, volatility: 0.35, drift: 0.11, marketCapB: 132, peRatio: 28.7, dividendYield: 0.9, about: 'Airframes, engines and long-cycle defence contracts.', aboutHe: 'גופי מטוסים, מנועים וחוזי ביטחון ארוכי טווח.' },
  { symbol: 'SOLR', name: 'Solaris Petro', nameHe: 'סולאריס פטרו', exchange: 'global', sector: 'Energy', seedPrice: 121.9, volatility: 0.42, drift: 0.02, marketCapB: 168, peRatio: 9.6, dividendYield: 5.1, about: 'Integrated oil and gas with a growing renewables arm.', aboutHe: 'נפט וגז משולבים לצד זרוע מתחדשות שצומחת.' },
  { symbol: 'MRDN', name: 'Meridian Health', nameHe: 'מרידיאן הלת׳', exchange: 'global', sector: 'Healthcare', seedPrice: 268.5, volatility: 0.24, drift: 0.08, marketCapB: 340, peRatio: 20.3, dividendYield: 1.7, about: 'Hospital networks and an integrated insurance business.', aboutHe: 'רשתות בתי חולים ועסקי ביטוח משולבים.' },
  { symbol: 'ZPHR', name: 'Zephyr Mobility', nameHe: 'זפיר מוביליטי', exchange: 'global', sector: 'Consumer', seedPrice: 88.2, volatility: 0.61, drift: 0.16, marketCapB: 71, peRatio: 72.4, dividendYield: 0, about: 'Electric vehicles and a charging network spun out in 2021.', aboutHe: 'רכבים חשמליים ורשת טעינה שפוצלה ב-2021.' },

  // ---- Tel Aviv board. Mock issuers in the shape of the real TA-35 sectors:
  // pharma, the big banks, defence electronics, chemicals and enterprise software.
  { symbol: 'TVAP', name: 'Tavor Pharma', nameHe: 'תבור פארמה', exchange: 'tase', sector: 'Healthcare', seedPrice: 17.4, volatility: 0.46, drift: 0.06, marketCapB: 19, peRatio: 14.2, dividendYield: 0, about: 'Generic and speciality medicines shipped from plants in the north.', aboutHe: 'תרופות גנריות וייחודיות המיוצרות במפעלים בצפון הארץ.' },
  { symbol: 'BLEM', name: 'Bank HaLevanon', nameHe: 'בנק הלבנון', exchange: 'tase', sector: 'Financials', seedPrice: 9.8, volatility: 0.26, drift: 0.09, marketCapB: 24, peRatio: 8.6, dividendYield: 4.2, about: 'One of the two large retail banks, with a growing digital arm.', aboutHe: 'אחד משני בנקי הקמעונאות הגדולים, עם זרוע דיגיטלית שצומחת.' },
  { symbol: 'PHRZ', name: 'Bank Poalei HaSharon', nameHe: 'בנק פועלי השרון', exchange: 'tase', sector: 'Financials', seedPrice: 11.2, volatility: 0.24, drift: 0.08, marketCapB: 27, peRatio: 9.1, dividendYield: 4.6, about: 'Retail and corporate lender with the largest branch network.', aboutHe: 'בנק קמעונאי ועסקי עם רשת הסניפים הגדולה במשק.' },
  { symbol: 'ELBT', name: 'Eshel Defence Systems', nameHe: 'אשל מערכות ביטחוניות', exchange: 'tase', sector: 'Defence', seedPrice: 62.8, volatility: 0.34, drift: 0.15, marketCapB: 31, peRatio: 26.4, dividendYield: 1.1, about: 'Electro-optics, drones and land systems, mostly exported.', aboutHe: 'אלקטרו-אופטיקה, כטב״מים ומערכות יבשה — רובם לייצוא.' },
  { symbol: 'HAIM', name: 'HaMifratz Chemicals', nameHe: 'כימיקלים המפרץ', exchange: 'tase', sector: 'Energy', seedPrice: 5.4, volatility: 0.4, drift: 0.03, marketCapB: 14, peRatio: 11.8, dividendYield: 5.4, about: 'Bromine, potash and speciality fertilisers from the Dead Sea.', aboutHe: 'ברום, אשלג ודשנים מיוחדים מים המלח.' },
  { symbol: 'NICV', name: 'Nitzan Voice', nameHe: 'ניצן ווייס', exchange: 'tase', sector: 'Technology', seedPrice: 168.5, volatility: 0.38, drift: 0.12, marketCapB: 11, peRatio: 32.6, dividendYield: 0, about: 'Contact-centre analytics and speech software sold worldwide.', aboutHe: 'תוכנת ניתוח שיחות ומוקדי שירות הנמכרת ברחבי העולם.' },
  { symbol: 'CHKR', name: 'Sha\'ar Security', nameHe: 'שער אבטחה', exchange: 'tase', sector: 'Technology', seedPrice: 142.2, volatility: 0.29, drift: 0.1, marketCapB: 17, peRatio: 22.8, dividendYield: 0, about: 'Network security appliances and a cloud protection suite.', aboutHe: 'רכיבי אבטחת רשת וחבילת הגנה לענן.' },
  { symbol: 'TWSC', name: 'Migdal Semiconductors', nameHe: 'מגדל מוליכים למחצה', exchange: 'tase', sector: 'Technology', seedPrice: 24.6, volatility: 0.55, drift: 0.13, marketCapB: 6, peRatio: 18.4, dividendYield: 0, about: 'Analogue foundry running specialty process lines.', aboutHe: 'בית יציקה אנלוגי המפעיל קווי ייצור ייעודיים.' },
  { symbol: 'AZRM', name: 'Azrieli Malls Trust', nameHe: 'קניוני עזריאלי', exchange: 'tase', sector: 'RealEstate', seedPrice: 63.4, volatility: 0.23, drift: 0.07, marketCapB: 9, peRatio: 16.2, dividendYield: 3.1, about: 'Shopping centres, offices and a data-centre portfolio.', aboutHe: 'מרכזי קניות, משרדים ותיק מרכזי נתונים.' },
  { symbol: 'MZTF', name: 'Mizrach Tefahot Bank', nameHe: 'בנק מזרח טפחות', exchange: 'tase', sector: 'Financials', seedPrice: 34.8, volatility: 0.25, drift: 0.1, marketCapB: 15, peRatio: 8.9, dividendYield: 3.8, about: 'Mortgage-led bank with the strongest housing book in the market.', aboutHe: 'בנק ממוקד משכנתאות עם תיק הדיור החזק בשוק.' },
  { symbol: 'SHFA', name: 'Shefa Retail Group', nameHe: 'קבוצת שפע קמעונאות', exchange: 'tase', sector: 'Consumer', seedPrice: 28.2, volatility: 0.27, drift: 0.05, marketCapB: 5, peRatio: 15.4, dividendYield: 2.6, about: 'Supermarket chain with a private-label and online business.', aboutHe: 'רשת סופרמרקטים עם מותג פרטי וזרוע אונליין.' },
  { symbol: 'ORGN', name: 'Ora Energy', nameHe: 'אורה אנרגיה', exchange: 'tase', sector: 'Energy', seedPrice: 19.6, volatility: 0.36, drift: 0.11, marketCapB: 7, peRatio: 20.1, dividendYield: 2.2, about: 'Natural gas partnerships and utility-scale solar in the Negev.', aboutHe: 'שותפויות גז טבעי ופרויקטי סולאר בקנה מידה גדול בנגב.' },
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

const NEWS_TEMPLATES: { en: string; he: string; source: [string, string]; sentiment: number }[] = [
  { en: '{name} beats on quarterly revenue and raises full-year guidance', he: '{name} היכתה את תחזיות ההכנסות ומעלה את התחזית השנתית', source: ['Market Wire', 'מרקט ווייר'], sentiment: 1 },
  { en: 'Analysts at Pierce & Co. lift the {symbol} price target', he: 'אנליסטים בפירס אנד קו מעלים את מחיר היעד ל-{symbol}', source: ['Street Notes', 'סטריט נоутס'], sentiment: 1 },
  { en: '{name} announces a buyback of up to $4B', he: '{name} מכריזה על רכישה עצמית של עד 4 מיליארד דולר', source: ['Capital Daily', 'קפיטל דיילי'], sentiment: 1 },
  { en: 'Regulator opens a review into {name} pricing practices', he: 'הרגולטור פותח בבדיקה של מדיניות התמחור של {name}', source: ['Policy Desk', 'שולחן הרגולציה'], sentiment: -1 },
  { en: '{name} delays its flagship launch to next quarter', he: '{name} דוחה את ההשקה המרכזית לרבעון הבא', source: ['Market Wire', 'מרקט ווייר'], sentiment: -1 },
  { en: 'Supply constraints weigh on {symbol} margins, says note', he: 'מגבלות אספקה מכבידות על השוליים של {symbol}, לפי סקירה', source: ['Street Notes', 'סטריט נоутס'], sentiment: -1 },
  { en: '{name} names a new chief financial officer', he: '{name} ממנה סמנכ״ל כספים חדש', source: ['Capital Daily', 'קפיטל דיילי'], sentiment: 0 },
  { en: '{symbol} is added to the Eli-baba 100 index', he: '{symbol} נכנסת למדד אלי-בעבע 100', source: ['Index Watch', 'מדד ווטש'], sentiment: 0 },
]

export interface NewsItem {
  id: string
  symbol: string
  headline: string
  source: string
  sentiment: number
  minutesAgo: number
}

export function newsFor(symbol: string, locale: LocaleCode): NewsItem[] {
  const instrument = INSTRUMENT_BY_SYMBOL.get(symbol)
  if (!instrument) return []
  const rng = makeRng(`news-${symbol}`)
  return NEWS_TEMPLATES.map((template, i) => ({ template, i, order: rng() }))
    .sort((a, b) => a.order - b.order)
    .slice(0, 4)
    .map(({ template, i }) => ({
      id: `${symbol}-${i}`,
      symbol,
      headline: (locale === 'he' ? template.he : template.en)
        .replace('{name}', instrumentName(instrument, locale))
        .replace('{symbol}', symbol),
      source: locale === 'he' ? template.source[1] : template.source[0],
      sentiment: template.sentiment,
      minutesAgo: Math.round(randFloat(rng, 8, 1400)),
    }))
    .sort((a, b) => a.minutesAgo - b.minutesAgo)
}
