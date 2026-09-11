import type { TripBrief } from '../data/briefs'
import type { CabinClass, FlightOffer } from '../data/flights'
import type { MessageKey } from '../i18n/en'

export interface Passenger {
  firstName: string
  lastName: string
  email: string
  seat: string | null
}

export interface FlightBooking {
  id: string
  reference: string
  createdAt: number
  outbound: FlightOffer
  inbound: FlightOffer | null
  passengers: Passenger[]
  cabin: CabinClass
  seatFees: number
  extras: { bags: number; insurance: boolean; flexible: boolean }
  total: number
  status: 'confirmed' | 'cancelled'
}

export interface StayBooking {
  id: string
  reference: string
  createdAt: number
  propertyId: string
  roomId: string
  checkIn: string
  checkOut: string
  guests: number
  rooms: number
  nights: number
  guestName: string
  total: number
  breakfast: boolean
  status: 'confirmed' | 'cancelled'
}

export interface Position {
  symbol: string
  quantity: number
  /** Average cost per share across all buys, after sells reduce the lot. */
  avgCost: number
}

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'filled' | 'open' | 'cancelled' | 'rejected'

export interface Order {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice: number | null
  fillPrice: number | null
  status: OrderStatus
  createdAt: number
  filledAt: number | null
  note?: string
}

export interface LedgerEntry {
  id: string
  at: number
  /** Stored as a message key plus its values so the ledger re-renders in
   *  whichever language the reader has selected. */
  labelKey: MessageKey
  labelParams: Record<string, string | number>
  amount: number
  category: 'flight' | 'stay' | 'trade' | 'refund' | 'deposit'
  balanceAfter: number
}

/** The five missions of a run, in the order they must be cleared.
 *  `drawer` happens away from the screen — the app only times it. */
export type MissionKey = 'drawer' | 'flight' | 'stay' | 'buy' | 'sell'

export const MISSION_KEYS: MissionKey[] = ['drawer', 'flight', 'stay', 'buy', 'sell']

/** What one cleared mission cost, earned and took. */
export interface MissionResult {
  key: MissionKey
  startedAt: number
  completedAt: number
  durationMs: number
  /** Money out and money in while this mission was the active one. */
  spent: number
  earned: number
  /** Cash left the moment the mission cleared, so the run reads as a budget. */
  cashAfter: number
}

export interface SessionState {
  status: 'idle' | 'running' | 'complete'
  startedAt: number | null
  completedAt: number | null
  /** Where to go, when, and with how many people — drawn once per run and
   *  shown while the flight and stay missions are live. Null before a run. */
  brief: TripBrief | null
  /** Index into MISSION_KEYS of the mission being worked on right now. */
  index: number
  /** When the active mission's own clock started. */
  missionStartedAt: number | null
  /** Cash flow recorded against the active mission only. */
  missionSpent: number
  missionEarned: number
  /** True from the moment a mission clears until "next mission" is pressed. */
  handoff: boolean
  results: MissionResult[]
  /** Money out on bookings and buys, and money in from sales and refunds.
   *  Both stop accumulating the moment the run completes, so the score is
   *  whatever it took to finish — not whatever happened afterwards. */
  spent: number
  earned: number
}

/** Has this mission already been cleared in this run? */
export function isMissionDone(session: SessionState, key: MissionKey): boolean {
  return session.results.some((r) => r.key === key)
}

export interface AppState {
  session: SessionState
  cash: number
  flightBookings: FlightBooking[]
  stayBookings: StayBooking[]
  positions: Position[]
  orders: Order[]
  ledger: LedgerEntry[]
  watchlist: string[]
  savedProperties: string[]
}
