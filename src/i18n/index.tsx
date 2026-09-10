import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en, type MessageKey } from './en'
import { he } from './he'

export type LocaleCode = 'en' | 'he'

/** Counted nouns. Hebrew needs singular / dual / plural, English needs two. */
interface Plurals {
  nights(n: number): string
  guests(n: number): string
  travellers(n: number): string
  rooms(n: number): string
  stops(n: number): string
  flights(n: number): string
  shares(n: number): string
}

const enPlurals: Plurals = {
  nights: (n) => `${n} night${n === 1 ? '' : 's'}`,
  guests: (n) => `${n} guest${n === 1 ? '' : 's'}`,
  travellers: (n) => `${n} traveller${n === 1 ? '' : 's'}`,
  rooms: (n) => `${n} room${n === 1 ? '' : 's'}`,
  stops: (n) => (n === 0 ? 'Direct' : `${n} stop${n === 1 ? '' : 's'}`),
  flights: (n) => `${n} flight${n === 1 ? '' : 's'}`,
  shares: (n) => `${n} share${n === 1 ? '' : 's'}`,
}

/** Hebrew counted nouns: 1 takes the bare singular, 2 takes the dual form. */
const hePlurals: Plurals = {
  nights: (n) => (n === 1 ? 'לילה אחד' : n === 2 ? 'שני לילות' : `${n} לילות`),
  guests: (n) => (n === 1 ? 'אורח אחד' : n === 2 ? 'שני אורחים' : `${n} אורחים`),
  travellers: (n) => (n === 1 ? 'נוסע אחד' : n === 2 ? 'שני נוסעים' : `${n} נוסעים`),
  rooms: (n) => (n === 1 ? 'חדר אחד' : n === 2 ? 'שני חדרים' : `${n} חדרים`),
  stops: (n) => (n === 0 ? 'ישירה' : n === 1 ? 'עצירה אחת' : n === 2 ? 'שתי עצירות' : `${n} עצירות`),
  flights: (n) => (n === 1 ? 'טיסה אחת' : n === 2 ? 'שתי טיסות' : `${n} טיסות`),
  shares: (n) => (n === 1 ? 'מניה אחת' : n === 2 ? 'שתי מניות' : `${n} מניות`),
}

interface LocaleConfig {
  code: LocaleCode
  dir: 'ltr' | 'rtl'
  dict: Record<MessageKey, string>
  plurals: Plurals
  intl: string
  currency: 'USD' | 'ILS'
  /** Wallet maths is held in USD; display converts at this fixed mock rate. */
  rate: number
}

export const LOCALES: Record<LocaleCode, LocaleConfig> = {
  en: { code: 'en', dir: 'ltr', dict: en, plurals: enPlurals, intl: 'en-US', currency: 'USD', rate: 1 },
  he: { code: 'he', dir: 'rtl', dict: he, plurals: hePlurals, intl: 'he-IL', currency: 'ILS', rate: 3.68 },
}

const STORAGE_KEY = 'eli-baba:locale'

export type Translate = (key: MessageKey, params?: Record<string, string | number>) => string

interface I18nValue {
  locale: LocaleCode
  dir: 'ltr' | 'rtl'
  isRtl: boolean
  setLocale: (code: LocaleCode) => void
  t: Translate
  plural: Plurals
  /** Formats a USD-denominated amount in the active locale's currency. */
  money: (usd: number) => string
  moneyWhole: (usd: number) => string
  signedMoney: (usd: number) => string
  /** Converts USD to the display currency without formatting. */
  toDisplay: (usd: number) => number
  fromDisplay: (display: number) => number
  currencySymbol: string
  /** Route/date separator that points the way the script reads. */
  arrow: string
  number: (value: number, digits?: number) => string
  percent: (value: number) => string
  signedPercent: (value: number) => string
  formatDate: (iso: string, style?: 'short' | 'medium' | 'long') => string
  monthNames: string[]
  weekdayNames: string[]
  timeAgo: (timestamp: number) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in params ? String(params[key]) : match,
  )
}

function readStoredLocale(): LocaleCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'he') return stored
  } catch {
    /* storage unavailable — fall through to the browser preference */
  }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('he') ? 'he' : 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleCode>(readStoredLocale)
  const config = LOCALES[locale]

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = config.dir
    document.title =
      locale === 'he' ? 'אלי-בעבע · טיסות, לינה ושווקים' : 'Eli-baba · Travel & Markets'
  }, [locale, config.dir])

  const setLocale = useCallback((code: LocaleCode) => {
    setLocaleState(code)
    try {
      localStorage.setItem(STORAGE_KEY, code)
    } catch {
      /* non-fatal: the choice just won't survive a reload */
    }
  }, [])

  const value = useMemo<I18nValue>(() => {
    const currencyFormat = new Intl.NumberFormat(config.intl, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 2,
    })
    const wholeFormat = new Intl.NumberFormat(config.intl, {
      style: 'currency',
      currency: config.currency,
      maximumFractionDigits: 0,
    })
    const toDisplay = (usd: number) => usd * config.rate

    const monthFormat = new Intl.DateTimeFormat(config.intl, { month: 'long', year: 'numeric' })
    const weekdayFormat = new Intl.DateTimeFormat(config.intl, { weekday: 'short' })

    const monthNames = Array.from({ length: 12 }, (_, m) =>
      monthFormat.format(new Date(2024, m, 1)).replace(/\s*\d{4}\s*/, '').trim(),
    )
    // Weeks start on Sunday in both locales here.
    const weekdayNames = Array.from({ length: 7 }, (_, d) =>
      weekdayFormat.format(new Date(2024, 8, 1 + d)),
    )

    const parseIso = (iso: string) => {
      const [y, m, d] = iso.split('-').map(Number)
      return new Date(y, (m ?? 1) - 1, d ?? 1)
    }

    return {
      locale,
      dir: config.dir,
      isRtl: config.dir === 'rtl',
      setLocale,
      t: (key, params) => interpolate(config.dict[key] ?? key, params),
      plural: config.plurals,
      money: (usd) => currencyFormat.format(toDisplay(usd)),
      moneyWhole: (usd) => wholeFormat.format(toDisplay(usd)),
      signedMoney: (usd) =>
        (usd >= 0 ? '+' : '−') + currencyFormat.format(Math.abs(toDisplay(usd))),
      toDisplay,
      fromDisplay: (display) => display / config.rate,
      currencySymbol: config.currency === 'ILS' ? '₪' : '$',
      arrow: config.dir === 'rtl' ? '←' : '→',
      number: (v, digits = 2) =>
        v.toLocaleString(config.intl, {
          minimumFractionDigits: digits,
          maximumFractionDigits: digits,
        }),
      percent: (v) => `${v.toFixed(1)}%`,
      signedPercent: (v) => (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(2) + '%',
      formatDate: (iso, style = 'medium') => {
        const date = parseIso(iso)
        if (style === 'short') {
          return date.toLocaleDateString(config.intl, { weekday: 'short', month: 'short', day: 'numeric' })
        }
        if (style === 'long') {
          return date.toLocaleDateString(config.intl, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
        }
        return date.toLocaleDateString(config.intl, { day: 'numeric', month: 'short', year: 'numeric' })
      },
      monthNames,
      weekdayNames,
      timeAgo: (timestamp) => {
        const seconds = Math.max(1, Math.round((Date.now() - timestamp) / 1000))
        const rtf = new Intl.RelativeTimeFormat(config.intl, { numeric: 'always', style: 'narrow' })
        if (seconds < 60) return rtf.format(-seconds, 'second').replace('-', '')
        if (seconds < 3600) return rtf.format(-Math.round(seconds / 60), 'minute').replace('-', '')
        if (seconds < 86400) return rtf.format(-Math.round(seconds / 3600), 'hour').replace('-', '')
        return rtf.format(-Math.round(seconds / 86400), 'day').replace('-', '')
      },
    }
  }, [locale, config, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}

/** Picks the field for the active locale from a bilingual record. */
export function localized<T extends { en: string; he: string }>(
  entry: T,
  locale: LocaleCode,
): string {
  return locale === 'he' ? entry.he : entry.en
}
