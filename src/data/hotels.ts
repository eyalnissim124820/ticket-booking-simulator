import { makeRng, pick, pickMany, randFloat, randInt, type Rng } from '../lib/rng'
import { nightsBetween } from '../lib/format'
import { buildDestinations, neighbourhoodsFor, type Destination } from './destinations'
import { EUROPE } from './cities-europe'
import { AMERICAS } from './cities-americas'
import { ASIA_PACIFIC } from './cities-asia'
import { MIDDLE_EAST_AFRICA } from './cities-mea'
import { EXTRA } from './cities-extra'
import type { LocaleCode } from '../i18n'
import type { MessageKey } from '../i18n/en'

export const DESTINATIONS: Destination[] = buildDestinations([
  ...EUROPE,
  ...AMERICAS,
  ...ASIA_PACIFIC,
  ...MIDDLE_EAST_AFRICA,
  ...EXTRA,
])

export const DESTINATION_BY_ID = new Map(DESTINATIONS.map((d) => [d.id, d]))

export type PropertyType = 'hotel' | 'apartment' | 'boutique' | 'hostel' | 'villa' | 'riad' | 'lodge'

export const AMENITY_IDS = [
  'wifi', 'breakfast', 'pool', 'gym', 'spa', 'parking',
  'kitchen', 'ac', 'pets', 'workspace', 'bar', 'beach',
] as const
export type AmenityId = (typeof AMENITY_IDS)[number]

export const amenityKey = (id: string): MessageKey => `amenity.${id}` as MessageKey

const PROPERTY_TYPES: { id: PropertyType; priceIndex: number }[] = [
  { id: 'hotel', priceIndex: 1 },
  { id: 'apartment', priceIndex: 0.85 },
  { id: 'boutique', priceIndex: 1.18 },
  { id: 'hostel', priceIndex: 0.38 },
  { id: 'villa', priceIndex: 1.62 },
  { id: 'riad', priceIndex: 1.1 },
  { id: 'lodge', priceIndex: 1.24 },
]

export const PROPERTY_TYPE_OPTIONS = PROPERTY_TYPES
export const propertyTypeKey = (id: PropertyType): MessageKey =>
  `propertyType.${id}` as MessageKey

/** Name parts carry both languages so the Hebrew catalogue reads as Hebrew
 *  rather than a page of Latin script. */
type Pair = [string, string]

const NAME_PREFIX: Pair[] = [
  ['The', 'ה'], ['Casa', 'קאזה '], ['Villa', 'וילה '], ['Maison', 'מזון '],
  ['Hotel', 'מלון '], ['Nord', 'נורד '], ['Terra', 'טרה '], ['Sable', 'סאבל '],
  ['Aurora', 'אורורה '], ['Lume', 'לומה '],
]
const NAME_CORE: Pair[] = [
  ['Meridian', 'מרידיאן'], ['Solstice', 'סולסטיס'], ['Lantern', 'לנטרן'], ['Harbour', 'הארבור'],
  ['Atrium', 'אטריום'], ['Cordial', 'קורדיאל'], ['Verano', 'ורנו'], ['Kestrel', 'קסטרל'],
  ['Marbella', 'מרביה'], ['Onyx', 'אוניקס'], ['Juniper', 'ג׳וניפר'], ['Palma', 'פלמה'],
  ['Ardent', 'ארדנט'], ['Selva', 'סלווה'], ['Quill', 'קוויל'], ['Alba', 'אלבה'],
  ['Cygnet', 'סיגנט'], ['Indigo', 'אינדיגו'], ['Almond', 'אלמונד'], ['Cedar', 'סידר'],
]
const NAME_SUFFIX: Pair[] = [
  ['House', 'האוס'], ['Residences', 'רזידנס'], ['Collection', 'קולקשן'], ['Suites', 'סוויטס'],
  ['Loft', 'לופט'], ['Retreat', 'ריטריט'], ['Rooms', 'רומס'], ['& Spa', 'אנד ספא'],
  ['Boutique', 'בוטיק'], ['Lodge', 'לודג׳'], ['Court', 'קורט'], ['Terrace', 'טראס'],
]

const BLURBS: Pair[] = [
  [
    'A quiet courtyard building a few minutes from the main square, with a rooftop that stays open late.',
    'בניין עם חצר שקטה, כמה דקות מהכיכר המרכזית, וגג שנשאר פתוח עד מאוחר.',
  ],
  [
    'Converted townhouse with original tilework, a small library bar, and rooms facing an inner garden.',
    'בית עירוני משופץ עם אריחים מקוריים, בר-ספרייה קטן וחדרים הפונים לגן פנימי.',
  ],
  [
    'Design-led rooms with floor-to-ceiling windows, a lobby café, and bikes free for guests.',
    'חדרים מעוצבים עם חלונות מרצפה לתקרה, בית קפה בלובי ואופניים חינם לאורחים.',
  ],
  [
    'Family-run, generous breakfast, and a terrace that catches the afternoon sun.',
    'ניהול משפחתי, ארוחת בוקר נדיבה ומרפסת שתופסת את שמש אחר הצהריים.',
  ],
  [
    'A modern tower with wide city views, a heated pool on the fourteenth floor, and a 24-hour gym.',
    'מגדל מודרני עם נוף עירוני רחב, בריכה מחוממת בקומה הארבע-עשרה וחדר כושר מסביב לשעון.',
  ],
  [
    'Stone walls, thick shutters and a shaded inner courtyard — cool even in high summer.',
    'קירות אבן, תריסים עבים וחצר פנימית מוצלת — קריר גם בשיא הקיץ.',
  ],
]

const REVIEW_TITLES: Pair[] = [
  ['Would book again', 'נחזור בלי לחשוב'],
  ['Perfect location', 'מיקום מושלם'],
  ['Small but spotless', 'קטן אבל נקי להפליא'],
  ['Great value', 'תמורה מצוינת'],
  ['Lovely staff', 'צוות מקסים'],
  ['Quiet and comfortable', 'שקט ונוח'],
  ['Better than the photos', 'יפה יותר מהתמונות'],
  ['Good, with caveats', 'טוב, עם הסתייגויות'],
]

const REVIEW_BODIES: Pair[] = [
  [
    'Rooms were spotless and the staff let us drop bags early. Ten minutes on foot from everything we wanted to see.',
    'החדרים היו נקיים לגמרי והצוות אפשר לנו להשאיר מזוודות מוקדם. עשר דקות ברגל מכל מה שרצינו לראות.',
  ],
  [
    'The bed was excellent and the shower had real pressure. Breakfast is worth adding on.',
    'המיטה מצוינת ובמקלחת יש לחץ מים אמיתי. שווה להוסיף את ארוחת הבוקר.',
  ],
  [
    'Compact room, but very well designed. Street noise on the lower floors — ask for something high up.',
    'החדר קומפקטי אבל מעוצב היטב. יש רעש רחוב בקומות הנמוכות — בקשו משהו גבוה.',
  ],
  [
    'Great value for the neighbourhood. We ate at the little place next door three nights running.',
    'תמורה מצוינת ביחס לשכונה. אכלנו במקום הקטן שליד שלושה ערבים ברצף.',
  ],
  [
    'Check-in took a while but the room made up for it. The rooftop is the main event here.',
    'הצ׳ק-אין לקח זמן, אבל החדר פיצה על זה. הגג הוא האטרקציה האמיתית.',
  ],
  [
    'Exactly what the listing promised. Quiet, clean, easy transit access.',
    'בדיוק מה שהובטח. שקט, נקי ונגיש בתחבורה ציבורית.',
  ],
]

const REVIEW_AUTHORS: Pair[] = [
  ['Maya', 'מאיה'], ['Daniel', 'דניאל'], ['Sofia', 'סופיה'], ['Liam', 'ליאם'],
  ['Noa', 'נועה'], ['Hugo', 'הוגו'], ['Ines', 'אינס'], ['Tom', 'תום'],
  ['Yuki', 'יוקי'], ['Ana', 'אנה'], ['Ravi', 'ראווי'], ['Elena', 'אלנה'],
  ['Marc', 'מארק'], ['Chloe', 'קלואי'], ['Omar', 'עומר'], ['Shira', 'שירה'],
]

type RoomTemplate = { key: MessageKey; bed: MessageKey; mult: number; sleeps: number }

const HOSTEL_ROOMS: RoomTemplate[] = [
  { key: 'room.dorm6', bed: 'bed.single', mult: 0.55, sleeps: 1 },
  { key: 'room.dorm4', bed: 'bed.single', mult: 0.72, sleeps: 1 },
  { key: 'room.privateTwin', bed: 'bed.twin', mult: 1.4, sleeps: 2 },
]
const STANDARD_ROOMS: RoomTemplate[] = [
  { key: 'room.standardDouble', bed: 'bed.double', mult: 1, sleeps: 2 },
  { key: 'room.superiorQueen', bed: 'bed.queen', mult: 1.22, sleeps: 2 },
  { key: 'room.deluxeKing', bed: 'bed.king', mult: 1.5, sleeps: 2 },
  { key: 'room.familySuite', bed: 'bed.kingSofa', mult: 1.95, sleeps: 4 },
]

export interface RoomOption {
  id: string
  nameKey: MessageKey
  bedKey: MessageKey
  rate: number
  sleeps: number
  refundable: boolean
  breakfast: boolean
  left: number
}

export interface Review {
  author: Pair
  score: number
  title: Pair
  body: Pair
  nights: number
}

export interface Property {
  id: string
  name: Pair
  destinationId: string
  neighbourhood: Pair
  type: PropertyType
  stars: number
  rating: number
  reviewCount: number
  nightlyRate: number
  amenities: string[]
  distanceToCentreKm: number
  /** Drives the generated illustration for this listing. */
  artSeed: number
  blurb: Pair
  rooms: RoomOption[]
  reviews: Review[]
  freeCancellation: boolean
  sustainable: boolean
}

function makeRooms(rng: Rng, nightly: number, type: PropertyType): RoomOption[] {
  const templates = type === 'hostel' ? HOSTEL_ROOMS : STANDARD_ROOMS
  return templates.map((template, i) => ({
    id: `r${i}`,
    nameKey: template.key,
    bedKey: template.bed,
    rate: Math.round(nightly * template.mult * randFloat(rng, 0.96, 1.06)),
    sleeps: template.sleeps,
    refundable: rng() < 0.65,
    breakfast: rng() < 0.5,
    left: randInt(rng, 1, 8),
  }))
}

const PROPERTIES_PER_DESTINATION = 18

export function propertiesFor(destinationId: string): Property[] {
  const destination = DESTINATION_BY_ID.get(destinationId) ?? DESTINATIONS[0]
  const rng = makeRng(`stays-${destination.id}`)
  const hoods = neighbourhoodsFor(destination)
  const out: Property[] = []

  for (let i = 0; i < PROPERTIES_PER_DESTINATION; i++) {
    const type = pick(rng, PROPERTY_TYPES)
    const stars = type.id === 'hostel' ? randInt(rng, 1, 2) : randInt(rng, 2, 5)
    const nightly = Math.round(
      destination.basePrice * type.priceIndex * (0.62 + stars * 0.16) * randFloat(rng, 0.85, 1.2),
    )
    const rating = Math.min(9.9, 6.4 + stars * 0.42 + randFloat(rng, -0.5, 1.1))
    const prefix = pick(rng, NAME_PREFIX)
    const core = pick(rng, NAME_CORE)
    const suffix = pick(rng, NAME_SUFFIX)

    out.push({
      id: `${destination.id}-${i}`,
      name: [
        `${prefix[0]} ${core[0]} ${suffix[0]}`,
        `${prefix[1]}${core[1]} ${suffix[1]}`.trim(),
      ],
      destinationId: destination.id,
      neighbourhood: pick(rng, hoods),
      type: type.id,
      stars,
      rating: Math.round(rating * 10) / 10,
      reviewCount: randInt(rng, 48, 3200),
      nightlyRate: nightly,
      amenities: pickMany(rng, AMENITY_IDS, randInt(rng, 4, 9)),
      distanceToCentreKm: Math.round(randFloat(rng, 0.2, 7.4) * 10) / 10,
      artSeed: randInt(rng, 0, 99999),
      blurb: pick(rng, BLURBS),
      rooms: makeRooms(rng, nightly, type.id),
      freeCancellation: rng() < 0.7,
      sustainable: rng() < 0.3,
      reviews: Array.from({ length: randInt(rng, 3, 5) }, () => ({
        author: pick(rng, REVIEW_AUTHORS),
        score: Math.round(Math.min(10, rating + randFloat(rng, -1.4, 1.2)) * 10) / 10,
        title: pick(rng, REVIEW_TITLES),
        body: pick(rng, REVIEW_BODIES),
        nights: randInt(rng, 1, 9),
      })),
    })
  }
  return out
}

/** Properties are generated on demand and cached — 831 destinations × 18 is far
 *  too much to build eagerly at start-up. */
const propertyCache = new Map<string, Property[]>()

export function cachedPropertiesFor(destinationId: string): Property[] {
  let cached = propertyCache.get(destinationId)
  if (!cached) {
    cached = propertiesFor(destinationId)
    propertyCache.set(destinationId, cached)
  }
  return cached
}

export function findProperty(propertyId: string): Property | undefined {
  const destinationId = propertyId.slice(0, propertyId.lastIndexOf('-'))
  return cachedPropertiesFor(destinationId).find((p) => p.id === propertyId)
}

export const pairText = (pair: Pair, locale: LocaleCode) => (locale === 'he' ? pair[1] : pair[0])

export function searchDestinations(query: string, limit = 8): Destination[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    const featured = ['tel-aviv-israel', 'lisbon-portugal', 'tokyo-japan', 'rome-italy', 'barcelona-spain', 'new-york-united-states', 'athens-greece', 'bangkok-thailand']
    return featured
      .map((id) => DESTINATION_BY_ID.get(id))
      .filter((d): d is Destination => Boolean(d))
      .slice(0, limit)
  }
  const matches: { destination: Destination; score: number }[] = []
  for (const destination of DESTINATIONS) {
    const city = destination.city.toLowerCase()
    const cityHe = destination.cityHe
    let score = -1
    if (city === q || cityHe === q) score = 0
    else if (city.startsWith(q) || cityHe.startsWith(q)) score = 1
    else if (city.includes(q) || cityHe.includes(q)) score = 2
    else if (destination.country.toLowerCase().includes(q)) score = 3
    if (score >= 0) matches.push({ destination, score })
    if (matches.length > 400) break
  }
  matches.sort(
    (a, b) =>
      a.score - b.score ||
      b.destination.basePrice - a.destination.basePrice ||
      a.destination.city.localeCompare(b.destination.city),
  )
  return matches.slice(0, limit).map((m) => m.destination)
}

/** Nightly rate × nights × rooms, plus the two fees the checkout shows. */
export function stayTotal(rate: number, checkIn: string, checkOut: string, rooms: number) {
  const nights = nightsBetween(checkIn, checkOut)
  const subtotal = rate * nights * rooms
  const taxes = Math.round(subtotal * 0.12)
  const serviceFee = Math.round(subtotal * 0.05)
  return { nights, subtotal, taxes, serviceFee, total: subtotal + taxes + serviceFee }
}
