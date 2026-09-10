import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AppState,
  FlightBooking,
  LedgerEntry,
  Order,
  Position,
  SessionObjectives,
  SessionState,
  StayBooking,
} from './types'
import { OBJECTIVE_KEYS } from './types'
import { initialQuotes, tickQuotes, type Quote } from '../data/stocks'
import { makeRef } from '../lib/format'
import { useI18n } from '../i18n'
import type { MessageKey } from '../i18n/en'

const STORAGE_KEY = 'eli-baba:state:v1'
const STARTING_CASH = 25_000

const IDLE_SESSION: SessionState = {
  status: 'idle',
  startedAt: null,
  completedAt: null,
  objectives: { flight: false, stay: false, buy: false, sell: false },
  spent: 0,
  earned: 0,
}

const EMPTY_STATE: AppState = {
  session: IDLE_SESSION,
  cash: STARTING_CASH,
  flightBookings: [],
  stayBookings: [],
  positions: [],
  orders: [],
  ledger: [],
  watchlist: ['NVAX', 'QUIL', 'ZPHR', 'SOLR'],
  savedProperties: [],
}

type Action =
  | { type: 'book-flight'; booking: Omit<FlightBooking, 'id' | 'reference' | 'createdAt' | 'status'> }
  | { type: 'cancel-flight'; id: string }
  | { type: 'book-stay'; booking: Omit<StayBooking, 'id' | 'reference' | 'createdAt' | 'status'> }
  | { type: 'cancel-stay'; id: string }
  | { type: 'place-order'; order: Omit<Order, 'id' | 'createdAt' | 'status' | 'fillPrice' | 'filledAt'>; marketPrice: number }
  | { type: 'cancel-order'; id: string }
  | { type: 'fill-order'; id: string; price: number }
  | { type: 'toggle-watch'; symbol: string }
  | { type: 'toggle-saved'; propertyId: string }
  | { type: 'deposit'; amount: number }
  | { type: 'start-session' }
  | { type: 'reset' }

/** Records progress and cash flow for a running session. Once every objective
 *  is cleared the run closes itself and stops recording. */
function advanceSession(
  session: SessionState,
  objective: keyof SessionObjectives | null,
  amount: number,
): SessionState {
  if (session.status !== 'running') return session
  const objectives = objective ? { ...session.objectives, [objective]: true } : session.objectives
  const complete = OBJECTIVE_KEYS.every((key) => objectives[key])
  return {
    ...session,
    objectives,
    spent: amount < 0 ? session.spent + Math.abs(amount) : session.spent,
    earned: amount > 0 ? session.earned + amount : session.earned,
    status: complete ? 'complete' : 'running',
    completedAt: complete ? Date.now() : null,
  }
}

let ledgerSeq = 0
function ledgerEntry(
  state: AppState,
  labelKey: MessageKey,
  labelParams: Record<string, string | number>,
  amount: number,
  category: LedgerEntry['category'],
): LedgerEntry {
  return {
    id: `l${Date.now()}-${ledgerSeq++}`,
    at: Date.now(),
    labelKey,
    labelParams,
    amount,
    category,
    balanceAfter: state.cash + amount,
  }
}

function applyFill(state: AppState, order: Order, price: number): AppState {
  const notional = price * order.quantity
  const positions = [...state.positions]
  const index = positions.findIndex((p) => p.symbol === order.symbol)

  if (order.side === 'buy') {
    if (notional > state.cash) {
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === order.id ? { ...o, status: 'rejected', note: 'Insufficient cash at fill time' } : o,
        ),
      }
    }
    if (index >= 0) {
      const existing = positions[index]
      const quantity = existing.quantity + order.quantity
      positions[index] = {
        ...existing,
        quantity,
        avgCost: (existing.avgCost * existing.quantity + notional) / quantity,
      }
    } else {
      positions.push({ symbol: order.symbol, quantity: order.quantity, avgCost: price })
    }
  } else {
    const existing: Position | undefined = positions[index]
    if (!existing || existing.quantity < order.quantity) {
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === order.id ? { ...o, status: 'rejected', note: 'Not enough shares at fill time' } : o,
        ),
      }
    }
    const remaining = existing.quantity - order.quantity
    if (remaining <= 0.000001) positions.splice(index, 1)
    else positions[index] = { ...existing, quantity: remaining }
  }

  const delta = order.side === 'buy' ? -notional : notional
  const entry = ledgerEntry(
    state,
    order.side === 'buy' ? 'ledger.bought' : 'ledger.sold',
    { count: order.quantity, symbol: order.symbol, price: price.toFixed(2) },
    delta,
    'trade',
  )

  return {
    ...state,
    cash: state.cash + delta,
    positions,
    orders: state.orders.map((o) =>
      o.id === order.id ? { ...o, status: 'filled', fillPrice: price, filledAt: Date.now() } : o,
    ),
    ledger: [entry, ...state.ledger].slice(0, 120),
    session: advanceSession(state.session, order.side, delta),
  }
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'book-flight': {
      const booking: FlightBooking = {
        ...action.booking,
        id: `fb${Date.now()}`,
        reference: makeRef('SKY'),
        createdAt: Date.now(),
        status: 'confirmed',
      }
      const entry = ledgerEntry(
        state,
        'ledger.flight',
        { route: `${booking.outbound.legs[0].from}–${booking.outbound.legs.at(-1)!.to}` },
        -booking.total,
        'flight',
      )
      return {
        ...state,
        cash: state.cash - booking.total,
        flightBookings: [booking, ...state.flightBookings],
        ledger: [entry, ...state.ledger].slice(0, 120),
        session: advanceSession(state.session, 'flight', -booking.total),
      }
    }
    case 'cancel-flight': {
      const booking = state.flightBookings.find((b) => b.id === action.id)
      if (!booking || booking.status === 'cancelled') return state
      // Flexible fares refund in full; everything else keeps a 20% penalty.
      const refund = Math.round(booking.total * (booking.extras.flexible ? 1 : 0.8))
      const entry = ledgerEntry(state, 'ledger.refund', { reference: booking.reference }, refund, 'refund')
      return {
        ...state,
        cash: state.cash + refund,
        flightBookings: state.flightBookings.map((b) =>
          b.id === action.id ? { ...b, status: 'cancelled' } : b,
        ),
        ledger: [entry, ...state.ledger].slice(0, 120),
        session: advanceSession(state.session, null, refund),
      }
    }
    case 'book-stay': {
      const booking: StayBooking = {
        ...action.booking,
        id: `sb${Date.now()}`,
        reference: makeRef('STY'),
        createdAt: Date.now(),
        status: 'confirmed',
      }
      const entry = ledgerEntry(state, 'ledger.stay', { nights: booking.nights }, -booking.total, 'stay')
      return {
        ...state,
        cash: state.cash - booking.total,
        stayBookings: [booking, ...state.stayBookings],
        ledger: [entry, ...state.ledger].slice(0, 120),
        session: advanceSession(state.session, 'stay', -booking.total),
      }
    }
    case 'cancel-stay': {
      const booking = state.stayBookings.find((b) => b.id === action.id)
      if (!booking || booking.status === 'cancelled') return state
      const entry = ledgerEntry(state, 'ledger.refund', { reference: booking.reference }, booking.total, 'refund')
      return {
        ...state,
        cash: state.cash + booking.total,
        stayBookings: state.stayBookings.map((b) =>
          b.id === action.id ? { ...b, status: 'cancelled' } : b,
        ),
        ledger: [entry, ...state.ledger].slice(0, 120),
        session: advanceSession(state.session, null, booking.total),
      }
    }
    case 'place-order': {
      const order: Order = {
        ...action.order,
        id: `o${Date.now()}`,
        createdAt: Date.now(),
        status: 'open',
        fillPrice: null,
        filledAt: null,
      }
      const withOrder = { ...state, orders: [order, ...state.orders] }
      if (order.type === 'market') return applyFill(withOrder, order, action.marketPrice)
      // A limit order rests until the simulated price crosses it.
      return withOrder
    }
    case 'fill-order': {
      const order = state.orders.find((o) => o.id === action.id)
      if (!order || order.status !== 'open') return state
      return applyFill(state, order, action.price)
    }
    case 'cancel-order':
      return {
        ...state,
        orders: state.orders.map((o) =>
          o.id === action.id && o.status === 'open' ? { ...o, status: 'cancelled' } : o,
        ),
      }
    case 'toggle-watch':
      return {
        ...state,
        watchlist: state.watchlist.includes(action.symbol)
          ? state.watchlist.filter((s) => s !== action.symbol)
          : [...state.watchlist, action.symbol],
      }
    case 'toggle-saved':
      return {
        ...state,
        savedProperties: state.savedProperties.includes(action.propertyId)
          ? state.savedProperties.filter((p) => p !== action.propertyId)
          : [...state.savedProperties, action.propertyId],
      }
    case 'deposit': {
      const entry = ledgerEntry(state, 'ledger.deposit', {}, action.amount, 'deposit')
      return {
        ...state,
        cash: state.cash + action.amount,
        ledger: [entry, ...state.ledger].slice(0, 120),
      }
    }
    case 'start-session':
      // Every run starts from the same clean slate, so times and results compare.
      return {
        ...EMPTY_STATE,
        session: { ...IDLE_SESSION, status: 'running', startedAt: Date.now() },
      }
    case 'reset':
      return { ...EMPTY_STATE }
    default:
      return state
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return EMPTY_STATE
    const parsed = JSON.parse(raw) as Partial<AppState>
    return { ...EMPTY_STATE, ...parsed }
  } catch {
    return EMPTY_STATE
  }
}

export interface Toast {
  id: number
  title: string
  body?: string
  tone: 'success' | 'error' | 'info'
}

interface StoreValue {
  state: AppState
  dispatch: (action: Action) => void
  quotes: Record<string, Quote>
  toasts: Toast[]
  notify: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  paused: boolean
  setPaused: (value: boolean) => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const { t, money } = useI18n()
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const [quotes, setQuotes] = useState<Record<string, Quote>>(initialQuotes)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [paused, setPaused] = useState(false)
  const toastSeq = useRef(0)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      /* storage may be unavailable (private mode); the app still works in memory */
    }
  }, [state])

  useEffect(() => {
    if (paused) return
    const id = window.setInterval(() => setQuotes((prev) => tickQuotes(prev)), 1600)
    return () => window.clearInterval(id)
  }, [paused])

  const notify = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = ++toastSeq.current
    setToasts((prev) => [...prev, { ...toast, id }])
    window.setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4200)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // Resting limit orders fill as soon as the live price crosses them.
  const openOrders = state.orders.filter((o) => o.status === 'open')
  useEffect(() => {
    for (const order of openOrders) {
      const quote = quotes[order.symbol]
      if (!quote || order.limitPrice == null) continue
      const crossed =
        order.side === 'buy' ? quote.price <= order.limitPrice : quote.price >= order.limitPrice
      if (crossed) {
        dispatch({ type: 'fill-order', id: order.id, price: quote.price })
        notify({
          tone: 'success',
          title: t('markets.limitFilled', { side: t(`side.${order.side}` as MessageKey) }),
          body: t('markets.limitWorkingBody', {
            side: t(`side.${order.side}` as MessageKey),
            count: order.quantity,
            symbol: order.symbol,
            price: money(quote.price),
          }),
        })
      }
    }
  }, [quotes, openOrders, notify, t, money])

  const value = useMemo<StoreValue>(
    () => ({ state, dispatch, quotes, toasts, notify, dismissToast, paused, setPaused }),
    [state, quotes, toasts, notify, dismissToast, paused],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}

/** Portfolio maths derived from live quotes — recomputed on every tick. */
export function usePortfolio() {
  const { state, quotes } = useStore()
  return useMemo(() => {
    let marketValue = 0
    let costBasis = 0
    const rows = state.positions.map((p) => {
      const price = quotes[p.symbol]?.price ?? p.avgCost
      const value = price * p.quantity
      const cost = p.avgCost * p.quantity
      marketValue += value
      costBasis += cost
      return {
        ...p,
        price,
        value,
        cost,
        pnl: value - cost,
        pnlPercent: cost > 0 ? ((value - cost) / cost) * 100 : 0,
        dayChange: (quotes[p.symbol]?.change ?? 0) * p.quantity,
      }
    })
    rows.sort((a, b) => b.value - a.value)
    return {
      rows,
      marketValue,
      costBasis,
      totalPnl: marketValue - costBasis,
      totalPnlPercent: costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0,
      dayChange: rows.reduce((sum, r) => sum + r.dayChange, 0),
      netWorth: marketValue + state.cash,
    }
  }, [state.positions, state.cash, quotes])
}

export { STARTING_CASH }
