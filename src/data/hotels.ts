import { makeRng, pick, pickMany, randFloat, randInt, type Rng } from '../lib/rng'
import { nightsBetween } from '../lib/format'

export type PropertyType = 'hotel' | 'apartment' | 'boutique' | 'hostel' | 'villa'

export interface Amenity {
  id: string
  label: string
  icon: string
}

export const AMENITIES: Amenity[] = [
  { id: 'wifi', label: 'Free Wi-Fi', icon: '📶' },
  { id: 'breakfast', label: 'Breakfast included', icon: '🥐' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'gym', label: 'Fitness centre', icon: '🏋️' },
  { id: 'spa', label: 'Spa', icon: '💆' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { id: 'ac', label: 'Air conditioning', icon: '❄️' },
  { id: 'pets', label: 'Pet friendly', icon: '🐕' },
  { id: 'workspace', label: 'Workspace', icon: '💻' },
  { id: 'bar', label: 'Bar', icon: '🍸' },
  { id: 'beach', label: 'Beach access', icon: '🏖️' },
]

export const AMENITY_BY_ID = new Map(AMENITIES.map((a) => [a.id, a]))

export interface StayDestination {
  id: string
  city: string
  country: string
  /** Nightly price anchor for a mid-range room. */
  basePrice: number
  neighbourhoods: string[]
}

export const DESTINATIONS: StayDestination[] = [
  { id: 'lisbon', city: 'Lisbon', country: 'Portugal', basePrice: 118, neighbourhoods: ['Alfama', 'Baixa', 'Príncipe Real', 'Belém', 'Bairro Alto'] },
  { id: 'tokyo', city: 'Tokyo', country: 'Japan', basePrice: 176, neighbourhoods: ['Shinjuku', 'Shibuya', 'Ginza', 'Asakusa', 'Nakameguro'] },
  { id: 'paris', city: 'Paris', country: 'France', basePrice: 214, neighbourhoods: ['Le Marais', 'Saint-Germain', 'Montmartre', 'Latin Quarter', 'Canal Saint-Martin'] },
  { id: 'new-york', city: 'New York', country: 'United States', basePrice: 268, neighbourhoods: ['SoHo', 'Midtown', 'Williamsburg', 'Upper West Side', 'Tribeca'] },
  { id: 'barcelona', city: 'Barcelona', country: 'Spain', basePrice: 142, neighbourhoods: ['Gothic Quarter', 'Eixample', 'Gràcia', 'Barceloneta', 'El Born'] },
  { id: 'rome', city: 'Rome', country: 'Italy', basePrice: 154, neighbourhoods: ['Trastevere', 'Monti', 'Centro Storico', 'Prati', 'Testaccio'] },
  { id: 'bangkok', city: 'Bangkok', country: 'Thailand', basePrice: 76, neighbourhoods: ['Sukhumvit', 'Riverside', 'Silom', 'Ari', 'Old Town'] },
  { id: 'dubai', city: 'Dubai', country: 'United Arab Emirates', basePrice: 198, neighbourhoods: ['Marina', 'Downtown', 'Palm Jumeirah', 'Jumeirah Beach', 'Deira'] },
  { id: 'london', city: 'London', country: 'United Kingdom', basePrice: 232, neighbourhoods: ['Shoreditch', 'Covent Garden', 'South Bank', 'Notting Hill', 'Mayfair'] },
  { id: 'amsterdam', city: 'Amsterdam', country: 'Netherlands', basePrice: 186, neighbourhoods: ['Jordaan', 'De Pijp', 'Centrum', 'Oud-West', 'Oost'] },
  { id: 'tel-aviv', city: 'Tel Aviv', country: 'Israel', basePrice: 204, neighbourhoods: ['Neve Tzedek', 'Rothschild', 'Florentin', 'Port', 'Jaffa'] },
  { id: 'mexico-city', city: 'Mexico City', country: 'Mexico', basePrice: 98, neighbourhoods: ['Roma Norte', 'Condesa', 'Polanco', 'Coyoacán', 'Juárez'] },
  { id: 'sydney', city: 'Sydney', country: 'Australia', basePrice: 188, neighbourhoods: ['Bondi', 'Surry Hills', 'The Rocks', 'Darlinghurst', 'Manly'] },
  { id: 'cape-town', city: 'Cape Town', country: 'South Africa', basePrice: 112, neighbourhoods: ['V&A Waterfront', 'Camps Bay', 'City Bowl', 'Sea Point', 'Woodstock'] },
  { id: 'singapore', city: 'Singapore', country: 'Singapore', basePrice: 205, neighbourhoods: ['Marina Bay', 'Chinatown', 'Orchard', 'Tiong Bahru', 'Katong'] },
  { id: 'reykjavik', city: 'Reykjavík', country: 'Iceland', basePrice: 226, neighbourhoods: ['Miðborg', 'Vesturbær', 'Laugardalur', 'Old Harbour', 'Hlíðar'] },
]

export const DESTINATION_BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]))

export function searchDestinations(query: string, limit = 6): StayDestination[] {
  const q = query.trim().toLowerCase()
  if (!q) return DESTINATIONS.slice(0, limit)
  return DESTINATIONS.filter(
    (d) => d.city.toLowerCase().includes(q) || d.country.toLowerCase().includes(q),
  ).slice(0, limit)
}

const NAME_PREFIX = ['The', 'Hotel', 'Casa', 'Villa', 'Maison', 'Nord', 'Aurora', 'Lume', 'Terra', 'Sable']
const NAME_CORE = ['Meridian', 'Solstice', 'Lantern', 'Harbour', 'Atrium', 'Cordial', 'Verano', 'Kestrel', 'Marbella', 'Onyx', 'Juniper', 'Palma', 'Ardent', 'Selva', 'Quill']
const NAME_SUFFIX = ['House', 'Residences', 'Collection', 'Suites', 'Loft', 'Retreat', 'Rooms', '& Spa', 'Boutique', 'Lodge']

const PROPERTY_TYPES: { id: PropertyType; label: string; priceIndex: number }[] = [
  { id: 'hotel', label: 'Hotel', priceIndex: 1 },
  { id: 'apartment', label: 'Apartment', priceIndex: 0.85 },
  { id: 'boutique', label: 'Boutique', priceIndex: 1.18 },
  { id: 'hostel', label: 'Hostel', priceIndex: 0.38 },
  { id: 'villa', label: 'Villa', priceIndex: 1.62 },
]

export const propertyTypeLabel = (id: PropertyType) =>
  PROPERTY_TYPES.find((p) => p.id === id)?.label ?? 'Hotel'

export const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES

export interface RoomOption {
  id: string
  name: string
  /** Nightly rate before taxes for this room type. */
  rate: number
  sleeps: number
  bed: string
  refundable: boolean
  breakfast: boolean
  left: number
}

export interface Review {
  author: string
  country: string
  score: number
  title: string
  body: string
  nights: number
}

export interface Property {
  id: string
  name: string
  destinationId: string
  neighbourhood: string
  type: PropertyType
  stars: number
  rating: number
  reviewCount: number
  nightlyRate: number
  amenities: string[]
  distanceToCentreKm: number
  /** Two hues used to render the placeholder gallery artwork. */
  hue: number
  blurb: string
  rooms: RoomOption[]
  reviews: Review[]
  freeCancellation: boolean
  sustainable: boolean
}

const REVIEW_AUTHORS = ['Maya', 'Daniel', 'Sofia', 'Liam', 'Noa', 'Hugo', 'Ines', 'Tom', 'Yuki', 'Ana', 'Ravi', 'Elena', 'Marc', 'Chloe', 'Omar']
const REVIEW_COUNTRIES = ['Portugal', 'Germany', 'Canada', 'Japan', 'Israel', 'Brazil', 'France', 'Australia', 'Spain', 'Norway']
const REVIEW_TITLES = ['Would book again', 'Perfect location', 'Small but spotless', 'Great value', 'Lovely staff', 'Quiet and comfortable', 'Better than the photos', 'Good, with caveats']
const REVIEW_BODIES = [
  'Rooms were spotless and the staff let us drop bags early. Ten minutes on foot from everything we wanted to see.',
  'The bed was excellent and the shower had real pressure. Breakfast is worth adding on.',
  'Compact room, but very well designed. Street noise on the lower floors — ask for something high up.',
  'Great value for the neighbourhood. We ate at the little place next door three nights running.',
  'Check-in took a while but the room made up for it. The rooftop is the main event here.',
  'Exactly what the listing promised. Quiet, clean, easy transit access.',
]
const BLURBS = [
  'A quiet courtyard building a few minutes from the main square, with a rooftop that stays open late.',
  'Converted townhouse with original tilework, a small library bar, and rooms facing an inner garden.',
  'Design-led rooms with floor-to-ceiling windows, a lobby café, and bikes free for guests.',
  'Family-run, generous breakfast, and a terrace that catches the afternoon sun.',
  'Modern tower with skyline views, a heated pool on the 14th floor, and a 24-hour gym.',
]

function makeRooms(rng: Rng, nightly: number, type: PropertyType): RoomOption[] {
  const templates =
    type === 'hostel'
      ? [
          { name: 'Bed in 6-person dorm', mult: 0.55, sleeps: 1, bed: '1 single bed' },
          { name: 'Bed in 4-person dorm', mult: 0.72, sleeps: 1, bed: '1 single bed' },
          { name: 'Private twin room', mult: 1.4, sleeps: 2, bed: '2 single beds' },
        ]
      : [
          { name: 'Standard double', mult: 1, sleeps: 2, bed: '1 double bed' },
          { name: 'Superior queen', mult: 1.22, sleeps: 2, bed: '1 queen bed' },
          { name: 'Deluxe king with view', mult: 1.5, sleeps: 2, bed: '1 king bed' },
          { name: 'Family suite', mult: 1.95, sleeps: 4, bed: '1 king + sofa bed' },
        ]
  return templates.map((t, i) => ({
    id: `r${i}`,
    name: t.name,
    rate: Math.round(nightly * t.mult * randFloat(rng, 0.96, 1.06)),
    sleeps: t.sleeps,
    bed: t.bed,
    refundable: rng() < 0.65,
    breakfast: rng() < 0.5,
    left: randInt(rng, 1, 8),
  }))
}

export function propertiesFor(destinationId: string): Property[] {
  const dest = DESTINATION_BY_ID.get(destinationId) ?? DESTINATIONS[0]
  const rng = makeRng(`stays-${dest.id}`)
  const count = 18
  const out: Property[] = []

  for (let i = 0; i < count; i++) {
    const type = pick(rng, PROPERTY_TYPES)
    const stars = type.id === 'hostel' ? randInt(rng, 1, 2) : randInt(rng, 2, 5)
    const nightly = Math.round(
      dest.basePrice * type.priceIndex * (0.62 + stars * 0.16) * randFloat(rng, 0.85, 1.2),
    )
    const rating = Math.min(9.9, 6.4 + stars * 0.42 + randFloat(rng, -0.5, 1.1))
    const name = `${pick(rng, NAME_PREFIX)} ${pick(rng, NAME_CORE)} ${pick(rng, NAME_SUFFIX)}`

    out.push({
      id: `${dest.id}-${i}`,
      name,
      destinationId: dest.id,
      neighbourhood: pick(rng, dest.neighbourhoods),
      type: type.id,
      stars,
      rating: Math.round(rating * 10) / 10,
      reviewCount: randInt(rng, 48, 3200),
      nightlyRate: nightly,
      amenities: pickMany(rng, AMENITIES, randInt(rng, 4, 9)).map((a) => a.id),
      distanceToCentreKm: Math.round(randFloat(rng, 0.2, 7.4) * 10) / 10,
      hue: randInt(rng, 0, 359),
      blurb: pick(rng, BLURBS),
      rooms: makeRooms(rng, nightly, type.id),
      freeCancellation: rng() < 0.7,
      sustainable: rng() < 0.3,
      reviews: Array.from({ length: randInt(rng, 3, 5) }, () => ({
        author: pick(rng, REVIEW_AUTHORS),
        country: pick(rng, REVIEW_COUNTRIES),
        score: Math.round(Math.min(10, rating + randFloat(rng, -1.4, 1.2)) * 10) / 10,
        title: pick(rng, REVIEW_TITLES),
        body: pick(rng, REVIEW_BODIES),
        nights: randInt(rng, 1, 9),
      })),
    })
  }
  return out
}

export const PROPERTY_INDEX = new Map<string, Property>()
for (const dest of DESTINATIONS) {
  for (const p of propertiesFor(dest.id)) PROPERTY_INDEX.set(p.id, p)
}

/** Weekend nights carry a surcharge — mirrors how real rate calendars behave. */
export function stayTotal(rate: number, checkIn: string, checkOut: string, rooms: number) {
  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = rate * nights * rooms
  const taxes = Math.round(subtotal * 0.12)
  const serviceFee = Math.round(subtotal * 0.05)
  return { nights, subtotal, taxes, serviceFee, total: subtotal + taxes + serviceFee }
}
