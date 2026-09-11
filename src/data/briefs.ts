import { addDays, parseIso, toIso, todayIso } from '../lib/format'

/** The trip a run is briefed to book: a weekend away, booked a few weeks out.
 *  Cities are held as airport codes and resolved for display, so the brief
 *  reads in whichever language the player has selected. */
export interface TripBrief {
  /** Home airport — where the flight mission departs from. */
  from: string
  /** Destination airport. Its city is also the city the stay is booked in. */
  to: string
  departIso: string
  returnIso: string
  travellers: number
}

/** Destinations that exist both as an airport and as a stays destination, so
 *  one brief covers the flight mission and the stay mission that follows it. */
const DESTINATIONS = [
  'HND', 'LHR', 'CDG', 'FCO', 'BCN', 'JFK', 'ATH', 'AMS', 'LIS',
  'BER', 'PRG', 'DXB', 'BKK', 'MXP', 'VIE', 'MAD', 'IST', 'CPH',
]

const HOME = 'TLV'

const pick = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)]

/** The Friday of a weekend `weeksOut` weeks from now. */
function fridayInWeeks(weeksOut: number): string {
  const today = parseIso(todayIso())
  // 5 is Friday; land on the coming Friday, then step out whole weeks.
  const toFriday = (5 - today.getDay() + 7) % 7 || 7
  return addDays(toIso(today), toFriday + weeksOut * 7)
}

/** A fresh brief for a run: somewhere to go, a weekend to go on, and a party
 *  size. Randomised so consecutive runs are not the same booking twice. */
export function makeTripBrief(): TripBrief {
  const depart = fridayInWeeks(2 + Math.floor(Math.random() * 6))
  return {
    from: HOME,
    to: pick(DESTINATIONS),
    departIso: depart,
    returnIso: addDays(depart, 2),
    travellers: 1 + Math.floor(Math.random() * 3),
  }
}
