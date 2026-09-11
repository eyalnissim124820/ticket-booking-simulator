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
  MissionKey,
  MissionResult,
  Order,
  Position,
  SessionState,
  StayBooking,
} from './types'
import { MISSION_KEYS } from './types'
import { initialQuotes, tickQuotes, type Quote } from '../data/stocks'
import { makeRef } from '../lib/format'
import { useI18n } from '../i18n'
import type { MessageKey } from '../i18n/en'

const STORAGE_KEY = 'eli-baba:state:v2'
const STARTING_CASH = 25_000

const IDLE_SESSION: SessionState = {
  status: 'idle',
  startedAt: null,
  completedAt: null,
  index: 0,
  missionStartedAt: null,
  missionSpent: 0,
  missionEarned: 0,
  handoff: false,
  results: [],
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
  | { type: 'finish-mission' }
  | { type: 'next-mission' }
  | { type: 'reset' }

/** Closes the active mission: stamps its time and its share of the budget,
 *  then either parks the run on a handoff screen or ends it. */
function closeMission(session: SessionState, cashAfter: number): SessionState {
  const key = MISSION_KEYS[session.index]
  const now = Date.now()
  const startedAt = session.missionStartedAt ?? now
  const result: MissionResult = {
    key,
    startedAt,
    completedAt: now,
    durationMs: now - startedAt,
    spent: session.missionSpent,
    earned: session.missionEarned,
    cashAfter,
  }
  const last = session.index >= MISSION_KEYS.length - 1
  return {
    ...session,
    results: [...session.results, result],
    // The last mission goes straight to the summary; the others wait for the
    // player to read their result and press "next mission".
    handoff: !last,
    status: last ? 'complete' : 'running',
    completedAt: last ? now : null,
  }
}

/** Records cash flow for a running session, and clears the active mission when
 *  the action that just happened is the one it was waiting for. Actions taken
 *  out of turn still move money — they just don't tick a later mission early. */
function advanceSession(
  session: SessionState,
  mission: MissionKey | null,
  amount: number,
  cashAfter: number,
): SessionState {
  if (session.status !== 'running') return session
  const spent = amount < 0 ? Math.abs(amount) : 0
  const earned = amount > 0 ? amount : 0
  const next: SessionState = {
    ...session,
    spent: session.spent + spent,
    earned: session.earned + earned,
    missionSpent: session.missionSpent + spent,
    missionEarned: session.missionEarned + earned,
  }
  if (!mission || session.handoff || MISSION_KEYS[session.index] !== mission) return next
  return closeMission(next, cashAfter)
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
    session: advanceSession(state.session, order.side, delta, state.cash + delta),
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
        session: advanceSession(state.session, 'flight', -booking.total, state.cash - booking.total),
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
        session: advanceSession(state.session, null, refund, state.cash + refund),
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
        session: advanceSession(state.session, 'stay', -booking.total, state.cash - booking.total),
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
        session: advanceSession(state.session, null, booking.total, state.cash + booking.total),
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
    case 'start-session': {
      // Every run starts from the same clean slate, so times and results compare.
      const now = Date.now()
      return {
        ...EMPTY_STATE,
        session: { ...IDLE_SESSION, status: 'running', startedAt: now, missionStartedAt: now },
      }
    }
    case 'finish-mission': {
      // The player reporting an off-screen mission done — the drawer.
      const { session } = state
      if (session.status !== 'running' || session.handoff) return state
      return { ...state, session: closeMission(session, state.cash) }
    }
    case 'next-mission': {
      const { session } = state
      if (!session.handoff) return state
      return {
        ...state,
        session: {
          ...session,
          index: Math.min(session.index + 1, MISSION_KEYS.length - 1),
          missionStartedAt: Date.now(),
          missionSpent: 0,
          missionEarned: 0,
          handoff: false,
        },
      }
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
    // Session is merged field by field: a run stored by an older build would
    // otherwise arrive missing the mission fields the reducer relies on.
    return { ...EMPTY_STATE, ...parsed, session: { ...IDLE_SESSION, ...parsed.session } }
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
