import { AIRPORTS, getAirport, distanceKm, type Airport } from './airports'
import { makeRng, pick, randInt, randFloat, type Rng } from '../lib/rng'

export interface Airline {
  code: string
  name: string
  color: string
  /** Multiplier applied to the base fare — carrier positioning. */
  priceIndex: number
  onTime: number
}

export const AIRLINES: Airline[] = [
  { code: 'SK', name: 'Skyline Air', color: '#5eead4', priceIndex: 1.0, onTime: 0.86 },
  { code: 'NV', name: 'Nova Atlantic', color: '#818cf8', priceIndex: 1.14, onTime: 0.89 },
  { code: 'ZP', name: 'Zephyr Airways', color: '#f472b6', priceIndex: 0.82, onTime: 0.74 },
  { code: 'MR', name: 'Meridian', color: '#fbbf24', priceIndex: 1.28, onTime: 0.92 },
  { code: 'AU', name: 'Aurora Jet', color: '#38bdf8', priceIndex: 0.91, onTime: 0.81 },
  { code: 'HL', name: 'Helios Express', color: '#fb7185', priceIndex: 0.71, onTime: 0.68 },
  { code: 'PC', name: 'Pacific Crown', color: '#34d399', priceIndex: 1.21, onTime: 0.9 },
]

export const AIRLINE_BY_CODE = new Map(AIRLINES.map((a) => [a.code, a]))

export const AIRCRAFT = [
  'Airbus A320neo',
  'Airbus A321',
  'Airbus A350-900',
  'Boeing 737 MAX 8',
  'Boeing 787-9',
  'Boeing 777-300ER',
  'Embraer E195',
]

export type CabinClass = 'economy' | 'premium' | 'business' | 'first'

export const CABINS: { id: CabinClass; label: string; multiplier: number }[] = [
  { id: 'economy', label: 'Economy', multiplier: 1 },
  { id: 'premium', label: 'Premium economy', multiplier: 1.65 },
  { id: 'business', label: 'Business', multiplier: 3.1 },
  { id: 'first', label: 'First', multiplier: 5.4 },
]

export const cabinLabel = (id: CabinClass) => CABINS.find((c) => c.id === id)?.label ?? 'Economy'

export interface FlightLeg {
  from: string
  to: string
  /** Minutes past midnight, local time at the origin. */
  departMinutes: number
  arriveMinutes: number
  durationMinutes: number
  flightNumber: string
  aircraft: string
}

export interface FlightOffer {
  id: string
  airline: string
  legs: FlightLeg[]
  stops: number
  /** Total travel time including layovers, in minutes. */
  totalMinutes: number
  /** Per-passenger fare in the selected cabin. */
  price: number
  seatsLeft: number
  cabin: CabinClass
  refundable: boolean
  baggageIncluded: boolean
  onTimeRate: number
  emissionsKg: number
  /** Days added to the departure date on arrival (0, 1 or 2). */
  dayOffset: number
  departDate: string
}

export interface FlightSearch {
  from: string
  to: string
  departDate: string
  returnDate: string | null
  passengers: number
  cabin: CabinClass
}

/** Airports that make sense as a connection between two others: far enough from
 *  both endpoints to be a real leg, and adding at most ~40% to the direct
 *  distance, so routings stay believable. */
function candidateHubs(from: Airport, to: Airport): Airport[] {
  const direct = distanceKm(from, to)
  return AIRPORTS.filter((hub) => {
    if (hub.code === from.code || hub.code === to.code) return false
    const out = distanceKm(from, hub)
    const on = distanceKm(hub, to)
    if (out < 300 || on < 300) return false
    return out + on <= direct * 1.4 + 400
  })
}

const pathLength = (nodes: Airport[]) =>
  nodes.slice(1).reduce((sum, node, i) => sum + distanceKm(nodes[i], node), 0)

function baseFare(from: Airport, to: Airport, rng: Rng): number {
  const km = distanceKm(from, to)
  const distanceComponent = 42 + km * randFloat(rng, 0.052, 0.086)
  const international = from.country !== to.country ? randFloat(rng, 1.06, 1.24) : 1
  return distanceComponent * international
}

function flightMinutes(km: number, rng: Rng): number {
  return Math.round(38 + (km / 800) * 60 * randFloat(rng, 0.94, 1.1))
}

/** Builds a deterministic set of offers for a query. Same query -> same list. */
export function searchFlights(search: FlightSearch, direction: 'outbound' | 'return'): FlightOffer[] {
  const fromCode = direction === 'outbound' ? search.from : search.to
  const toCode = direction === 'outbound' ? search.to : search.from
  const date = direction === 'outbound' ? search.departDate : search.returnDate
  if (!date || fromCode === toCode) return []

  const from = getAirport(fromCode)
  const to = getAirport(toCode)
  const km = distanceKm(from, to)
  const cabinMultiplier = CABINS.find((c) => c.id === search.cabin)?.multiplier ?? 1
  const rng = makeRng(`${fromCode}-${toCode}-${date}-${search.cabin}`)
  const count = randInt(rng, 11, 16)

  const offers: FlightOffer[] = []
  for (let i = 0; i < count; i++) {
    const airline = pick(rng, AIRLINES)
    const longHaul = km > 4200
    const stopRoll = rng()
    const stops = longHaul
      ? stopRoll < 0.4 ? 0 : stopRoll < 0.85 ? 1 : 2
      : stopRoll < 0.68 ? 0 : stopRoll < 0.96 ? 1 : 2

    const departMinutes = randInt(rng, 5, 22) * 60 + pick(rng, [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])
    const legs: FlightLeg[] = []
    let cursor = departMinutes
    let travelled = 0

    const hubs = candidateHubs(from, to)
    const waypoints: Airport[] = []
    for (let s = 0; s < stops && hubs.length > 0; s++) {
      const hub = pick(rng, hubs)
      if (!waypoints.some((w) => w.code === hub.code)) waypoints.push(hub)
    }
    // Order the stops along the route, then keep only those that actually make
    // progress toward the destination, so no itinerary doubles back on itself.
    waypoints.sort((a, b) => distanceKm(from, a) - distanceKm(from, b))
    let remaining = km
    const forward: Airport[] = []
    for (const hub of waypoints) {
      const left = distanceKm(hub, to)
      if (left < remaining) {
        forward.push(hub)
        remaining = left
      }
    }
    waypoints.length = 0
    waypoints.push(...forward)
    // Two stops can still combine into a zig-zag; drop back to one if so.
    while (waypoints.length > 1 && pathLength([from, ...waypoints, to]) > km * 1.45 + 500) {
      waypoints.pop()
    }
    const nodes = [from, ...waypoints, to]

    for (let l = 0; l < nodes.length - 1; l++) {
      const legKm = distanceKm(nodes[l], nodes[l + 1])
      const dur = flightMinutes(legKm, rng)
      legs.push({
        from: nodes[l].code,
        to: nodes[l + 1].code,
        departMinutes: cursor,
        arriveMinutes: cursor + dur,
        durationMinutes: dur,
        flightNumber: `${airline.code}${randInt(rng, 100, 998)}`,
        aircraft: pick(rng, AIRCRAFT),
      })
      travelled += dur
      cursor += dur
      if (l < nodes.length - 2) {
        const layover = randInt(rng, 45, 260)
        travelled += layover
        cursor += layover
      }
    }

    const actualStops = legs.length - 1
    const stopPenalty = actualStops === 0 ? 1.16 : actualStops === 1 ? 1 : 0.88
    const timePenalty = departMinutes < 7 * 60 || departMinutes > 21 * 60 ? 0.93 : 1
    const price =
      baseFare(from, to, rng) * airline.priceIndex * cabinMultiplier * stopPenalty * timePenalty *
      randFloat(rng, 0.9, 1.14)

    offers.push({
      id: `${direction}-${fromCode}${toCode}-${date}-${i}`,
      airline: airline.code,
      legs,
      stops: legs.length - 1,
      totalMinutes: travelled,
      price: Math.round(price),
      seatsLeft: randInt(rng, 1, 42),
      cabin: search.cabin,
      refundable: rng() < 0.34,
      baggageIncluded: search.cabin !== 'economy' || rng() < 0.5,
      onTimeRate: Math.min(0.99, airline.onTime + randFloat(rng, -0.06, 0.06)),
      emissionsKg: Math.round(
        legs.reduce((sum, leg) => sum + distanceKm(getAirport(leg.from), getAirport(leg.to)), 0) *
          0.088 *
          cabinMultiplier,
      ),
      dayOffset: Math.floor(cursor / 1440),
      departDate: date,
    })
  }

  return offers.sort((a, b) => a.price - b.price)
}

/** A stable seat map for an offer, with a plausible spread of taken seats. */
export interface SeatRow {
  row: number
  seats: { id: string; taken: boolean; extraLegroom: boolean; fee: number }[]
}

export function buildSeatMap(offerId: string, cabin: CabinClass): SeatRow[] {
  const rng = makeRng(`seats-${offerId}`)
  const letters = cabin === 'business' || cabin === 'first' ? ['A', 'C', 'D', 'F'] : ['A', 'B', 'C', 'D', 'E', 'F']
  const rowCount = cabin === 'business' || cabin === 'first' ? 8 : 24
  const rows: SeatRow[] = []
  for (let r = 1; r <= rowCount; r++) {
    const extraLegroom = r === 1 || r === 12 || r === 13
    rows.push({
      row: r,
      seats: letters.map((letter) => ({
        id: `${r}${letter}`,
        taken: rng() < 0.42,
        extraLegroom,
        fee: extraLegroom ? 38 : letter === 'A' || letter === 'F' ? 14 : 0,
      })),
    })
  }
  return rows
}
