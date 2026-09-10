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

export interface AppState {
  cash: number
  flightBookings: FlightBooking[]
  stayBookings: StayBooking[]
  positions: Position[]
  orders: Order[]
  ledger: LedgerEntry[]
  watchlist: string[]
  savedProperties: string[]
}
