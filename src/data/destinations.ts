import { COUNTRY_HE } from './countries'
import { makeRng, pickMany } from '../lib/rng'
import type { LocaleCode } from '../i18n'

export interface Destination {
  id: string
  city: string
  cityHe: string
  country: string
  /** Nightly anchor in USD for a mid-range room. */
  basePrice: number
  region: Region
}

export type Region =
  | 'western-europe'
  | 'southern-europe'
  | 'northern-europe'
  | 'eastern-europe'
  | 'north-america'
  | 'latin-america'
  | 'middle-east'
  | 'africa'
  | 'south-asia'
  | 'east-asia'
  | 'oceania'

/** [city, cityHe, country, nightly anchor in USD] */
export type DestRow = [string, string, string, number]

const REGION_BY_COUNTRY: Record<string, Region> = {
  'United Kingdom': 'western-europe', 'Ireland': 'western-europe', 'France': 'western-europe',
  'Belgium': 'western-europe', 'Netherlands': 'western-europe', 'Luxembourg': 'western-europe',
  'Germany': 'western-europe', 'Switzerland': 'western-europe', 'Austria': 'western-europe',
  'Monaco': 'western-europe',
  'Spain': 'southern-europe', 'Portugal': 'southern-europe', 'Italy': 'southern-europe',
  'Greece': 'southern-europe', 'Malta': 'southern-europe', 'Cyprus': 'southern-europe',
  'Croatia': 'southern-europe', 'Slovenia': 'southern-europe', 'Montenegro': 'southern-europe',
  'Albania': 'southern-europe', 'Bosnia and Herzegovina': 'southern-europe',
  'North Macedonia': 'southern-europe', 'Serbia': 'southern-europe',
  'Denmark': 'northern-europe', 'Norway': 'northern-europe', 'Sweden': 'northern-europe',
  'Finland': 'northern-europe', 'Iceland': 'northern-europe', 'Estonia': 'northern-europe',
  'Latvia': 'northern-europe', 'Lithuania': 'northern-europe',
  'Czechia': 'eastern-europe', 'Poland': 'eastern-europe', 'Hungary': 'eastern-europe',
  'Slovakia': 'eastern-europe', 'Romania': 'eastern-europe', 'Bulgaria': 'eastern-europe',
  'Ukraine': 'eastern-europe', 'Moldova': 'eastern-europe', 'Georgia': 'eastern-europe',
  'Armenia': 'eastern-europe', 'Azerbaijan': 'eastern-europe',
  'United States': 'north-america', 'Canada': 'north-america',
  'Mexico': 'latin-america', 'Guatemala': 'latin-america', 'Costa Rica': 'latin-america',
  'Panama': 'latin-america', 'Cuba': 'latin-america', 'Jamaica': 'latin-america',
  'Puerto Rico': 'latin-america', 'Dominican Republic': 'latin-america', 'Brazil': 'latin-america',
  'Argentina': 'latin-america', 'Chile': 'latin-america', 'Peru': 'latin-america',
  'Colombia': 'latin-america', 'Ecuador': 'latin-america', 'Uruguay': 'latin-america',
  'Bolivia': 'latin-america', 'Paraguay': 'latin-america',
  'Israel': 'middle-east', 'Türkiye': 'middle-east', 'Jordan': 'middle-east',
  'Lebanon': 'middle-east', 'United Arab Emirates': 'middle-east', 'Qatar': 'middle-east',
  'Bahrain': 'middle-east', 'Kuwait': 'middle-east', 'Oman': 'middle-east',
  'Saudi Arabia': 'middle-east',
  'Egypt': 'africa', 'Morocco': 'africa', 'Tunisia': 'africa', 'Algeria': 'africa',
  'South Africa': 'africa', 'Kenya': 'africa', 'Tanzania': 'africa', 'Ethiopia': 'africa',
  'Nigeria': 'africa', 'Ghana': 'africa', 'Rwanda': 'africa', 'Uganda': 'africa',
  'Senegal': 'africa', 'Namibia': 'africa', 'Mauritius': 'africa', 'Zambia': 'africa',
  'Zimbabwe': 'africa',
  'India': 'south-asia', 'Sri Lanka': 'south-asia', 'Maldives': 'south-asia',
  'Nepal': 'south-asia', 'Bangladesh': 'south-asia', 'Pakistan': 'south-asia',
  'Uzbekistan': 'south-asia', 'Kazakhstan': 'south-asia',
  'Thailand': 'east-asia', 'Singapore': 'east-asia', 'Malaysia': 'east-asia',
  'Indonesia': 'east-asia', 'Philippines': 'east-asia', 'Vietnam': 'east-asia',
  'Cambodia': 'east-asia', 'Laos': 'east-asia', 'Myanmar': 'east-asia', 'China': 'east-asia',
  'Hong Kong': 'east-asia', 'Taiwan': 'east-asia', 'South Korea': 'east-asia', 'Japan': 'east-asia',
  'Australia': 'oceania', 'New Zealand': 'oceania', 'Fiji': 'oceania',
}

/** District names drawn per region, so a generated neighbourhood still sounds
 *  like it belongs to the city it is attached to. */
const DISTRICTS: Record<Region, [string, string][]> = {
  'western-europe': [
    ['Old Town', 'העיר העתיקה'], ['City Centre', 'מרכז העיר'], ['Latin Quarter', 'הרובע הלטיני'],
    ['Cathedral Quarter', 'רובע הקתדרלה'], ['Riverside', 'גדת הנהר'], ['Market Square', 'כיכר השוק'],
    ['Museum District', 'רובע המוזיאונים'], ['Garden District', 'רובע הגנים'],
    ['North Bank', 'הגדה הצפונית'], ['Station Quarter', 'רובע התחנה'],
  ],
  'southern-europe': [
    ['Old Town', 'העיר העתיקה'], ['Historic Centre', 'המרכז ההיסטורי'], ['Marina', 'המרינה'],
    ['Seafront', 'הטיילת'], ['Cathedral Quarter', 'רובע הקתדרלה'], ['Upper Town', 'העיר העליונה'],
    ['Fishermen’s Quarter', 'רובע הדייגים'], ['Citadel', 'המצודה'], ['Old Port', 'הנמל העתיק'],
    ['Hillside', 'המדרון'],
  ],
  'northern-europe': [
    ['Old Town', 'העיר העתיקה'], ['Harbour', 'הנמל'], ['City Centre', 'מרכז העיר'],
    ['Design District', 'רובע העיצוב'], ['Island Quarter', 'רובע האי'], ['Lakeside', 'גדת האגם'],
    ['Cathedral Hill', 'גבעת הקתדרלה'], ['Dockside', 'המזח'], ['Park Quarter', 'רובע הפארק'],
    ['New Town', 'העיר החדשה'],
  ],
  'eastern-europe': [
    ['Old Town', 'העיר העתיקה'], ['Castle District', 'רובע הטירה'], ['Jewish Quarter', 'הרובע היהודי'],
    ['City Centre', 'מרכז העיר'], ['Riverbank', 'גדת הנהר'], ['Market Quarter', 'רובע השוק'],
    ['Upper Town', 'העיר העליונה'], ['Old Bazaar', 'הבזאר העתיק'], ['Park District', 'רובע הפארק'],
    ['Theatre Quarter', 'רובע התיאטרון'],
  ],
  'north-america': [
    ['Downtown', 'הדאונטאון'], ['Midtown', 'מידטאון'], ['Old Quarter', 'הרובע העתיק'],
    ['Waterfront', 'קו המים'], ['Arts District', 'רובע האמנויות'], ['Warehouse District', 'רובע המחסנים'],
    ['Uptown', 'אפטאון'], ['Riverfront', 'חזית הנהר'], ['Financial District', 'הרובע הפיננסי'],
    ['Market District', 'רובע השוק'],
  ],
  'latin-america': [
    ['Centro Histórico', 'המרכז ההיסטורי'], ['Old Town', 'העיר העתיקה'], ['Zona Colonial', 'הרובע הקולוניאלי'],
    ['Malecón', 'הטיילת'], ['Zona Rosa', 'סונה רוסה'], ['Playa', 'החוף'],
    ['Barrio Alto', 'הרובע העליון'], ['Mercado', 'רובע השוק'], ['Puerto', 'הנמל'],
    ['Parque Central', 'הפארק המרכזי'],
  ],
  'middle-east': [
    ['Old City', 'העיר העתיקה'], ['Souk Quarter', 'רובע השוק'], ['Corniche', 'הטיילת'],
    ['Marina', 'המרינה'], ['Downtown', 'הדאונטאון'], ['Citadel Quarter', 'רובע המצודה'],
    ['Seafront', 'קו החוף'], ['New District', 'הרובע החדש'], ['Bazaar', 'הבזאר'],
    ['Garden Quarter', 'רובע הגנים'],
  ],
  'africa': [
    ['Old Town', 'העיר העתיקה'], ['Medina', 'המדינה העתיקה'], ['Waterfront', 'קו המים'],
    ['City Bowl', 'מרכז העיר'], ['Market Quarter', 'רובע השוק'], ['Beachfront', 'קו החוף'],
    ['Hill District', 'רובע הגבעה'], ['Colonial Quarter', 'הרובע הקולוניאלי'],
    ['Garden City', 'עיר הגנים'], ['Harbour', 'הנמל'],
  ],
  'south-asia': [
    ['Old City', 'העיר העתיקה'], ['Fort Area', 'אזור המצודה'], ['Bazaar Quarter', 'רובע הבזאר'],
    ['Lakeside', 'גדת האגם'], ['Beach Road', 'דרך החוף'], ['Civil Lines', 'הרובע המנהלי'],
    ['Temple District', 'רובע המקדשים'], ['New Town', 'העיר החדשה'], ['Riverside', 'גדת הנהר'],
    ['Hill Quarter', 'רובע הגבעה'],
  ],
  'east-asia': [
    ['Old Quarter', 'הרובע העתיק'], ['Downtown', 'הדאונטאון'], ['Riverside', 'גדת הנהר'],
    ['Night Market', 'שוק הלילה'], ['Temple District', 'רובע המקדשים'], ['Harbour Front', 'חזית הנמל'],
    ['Central', 'המרכז'], ['Lakeside', 'גדת האגם'], ['Station District', 'רובע התחנה'],
    ['Beach Quarter', 'רובע החוף'],
  ],
  'oceania': [
    ['Central Business District', 'מרכז העסקים'], ['Harbour', 'הנמל'], ['Beachfront', 'קו החוף'],
    ['Arts Precinct', 'מתחם האמנויות'], ['Botanic Quarter', 'רובע הגנים'], ['Waterfront', 'קו המים'],
    ['Old Port', 'הנמל העתיק'], ['Hill Suburb', 'שכונת הגבעה'], ['Bay Quarter', 'רובע המפרץ'],
    ['Market Precinct', 'מתחם השוק'],
  ],
}

/** Real neighbourhoods for the cities travellers actually search for most. */
const CURATED: Record<string, [string, string][]> = {
  lisbon: [['Alfama', 'אלפאמה'], ['Baixa', 'באישה'], ['Príncipe Real', 'פרינסיפה ריאל'], ['Belém', 'בלם'], ['Bairro Alto', 'באירו אלטו']],
  paris: [['Le Marais', 'לה מארה'], ['Saint-Germain', 'סן ז׳רמן'], ['Montmartre', 'מונמארטר'], ['Latin Quarter', 'הרובע הלטיני'], ['Canal Saint-Martin', 'קנאל סן מרטן']],
  london: [['Shoreditch', 'שורדיץ׳'], ['Covent Garden', 'קובנט גארדן'], ['South Bank', 'סאות׳ בנק'], ['Notting Hill', 'נוטינג היל'], ['Mayfair', 'מייפייר']],
  'new-york': [['SoHo', 'סוהו'], ['Midtown', 'מידטאון'], ['Williamsburg', 'ויליאמסבורג'], ['Upper West Side', 'אפר ווסט סייד'], ['Tribeca', 'טרייבקה']],
  barcelona: [['Gothic Quarter', 'הרובע הגותי'], ['Eixample', 'אשמפלה'], ['Gràcia', 'גראסיה'], ['Barceloneta', 'ברסלונטה'], ['El Born', 'אל בורן']],
  rome: [['Trastevere', 'טרסטוורה'], ['Monti', 'מונטי'], ['Centro Storico', 'המרכז ההיסטורי'], ['Prati', 'פראטי'], ['Testaccio', 'טסטאצ׳ו']],
  tokyo: [['Shinjuku', 'שינג׳וקו'], ['Shibuya', 'שיבויה'], ['Ginza', 'גינזה'], ['Asakusa', 'אסאקוסה'], ['Nakameguro', 'נקאמגורו']],
  bangkok: [['Sukhumvit', 'סוקומוויט'], ['Riverside', 'גדת הנהר'], ['Silom', 'סילום'], ['Ari', 'ארי'], ['Old Town', 'העיר העתיקה']],
  dubai: [['Marina', 'המרינה'], ['Downtown', 'הדאונטאון'], ['Palm Jumeirah', 'פאלם ג׳ומיירה'], ['Jumeirah Beach', 'חוף ג׳ומיירה'], ['Deira', 'דיירה']],
  amsterdam: [['Jordaan', 'יורדאן'], ['De Pijp', 'דה פייפ'], ['Centrum', 'המרכז'], ['Oud-West', 'אוד-ווסט'], ['Oost', 'אוסט']],
  'tel-aviv': [['Neve Tzedek', 'נווה צדק'], ['Rothschild', 'רוטשילד'], ['Florentin', 'פלורנטין'], ['Old Port', 'הנמל'], ['Jaffa', 'יפו']],
  jerusalem: [['Old City', 'העיר העתיקה'], ['Nachlaot', 'נחלאות'], ['German Colony', 'המושבה הגרמנית'], ['Mahane Yehuda', 'מחנה יהודה'], ['Rehavia', 'רחביה']],
  'mexico-city': [['Roma Norte', 'רומה נורטה'], ['Condesa', 'קונדסה'], ['Polanco', 'פולנקו'], ['Coyoacán', 'קויואקאן'], ['Juárez', 'חוארס']],
  sydney: [['Bondi', 'בונדיי'], ['Surry Hills', 'סורי הילס'], ['The Rocks', 'הרוקס'], ['Darlinghurst', 'דארלינגהרסט'], ['Manly', 'מנלי']],
  'cape-town': [['V&A Waterfront', 'ווטרפרונט'], ['Camps Bay', 'קמפס ביי'], ['City Bowl', 'מרכז העיר'], ['Sea Point', 'סי פוינט'], ['Woodstock', 'וודסטוק']],
  singapore: [['Marina Bay', 'מרינה ביי'], ['Chinatown', 'צ׳יינה טאון'], ['Orchard', 'אורצ׳רד'], ['Tiong Bahru', 'טיונג באהרו'], ['Katong', 'קאטונג']],
  istanbul: [['Sultanahmet', 'סולטן אחמט'], ['Beyoğlu', 'ביאולו'], ['Karaköy', 'קרקוי'], ['Kadıköy', 'קאדיקוי'], ['Beşiktaş', 'בשיקטאש']],
  berlin: [['Mitte', 'מיטה'], ['Kreuzberg', 'קרויצברג'], ['Prenzlauer Berg', 'פרנצלאואר ברג'], ['Neukölln', 'נויקלן'], ['Charlottenburg', 'שרלוטנבורג']],
  athens: [['Plaka', 'פלאקה'], ['Koukaki', 'קוקאקי'], ['Monastiraki', 'מונסטיראקי'], ['Kolonaki', 'קולונאקי'], ['Exarchia', 'אקסארחיה']],
  marrakesh: [['Medina', 'המדינה'], ['Gueliz', 'גליז'], ['Kasbah', 'הקסבה'], ['Hivernage', 'איברנאז׳'], ['Palmeraie', 'פלמריי']],
  prague: [['Old Town', 'העיר העתיקה'], ['Malá Strana', 'מאלה סטראנה'], ['Vinohrady', 'וינוהרדי'], ['Žižkov', 'ז׳יז׳קוב'], ['Karlín', 'קרלין']],
  vienna: [['Innere Stadt', 'העיר הפנימית'], ['Neubau', 'נויבאו'], ['Leopoldstadt', 'לאופולדשטאדט'], ['Mariahilf', 'מריאהילף'], ['Landstraße', 'לנדשטראסה']],
  madrid: [['Malasaña', 'מלסניה'], ['La Latina', 'לה לטינה'], ['Salamanca', 'סלמנקה'], ['Chueca', 'צ׳ואקה'], ['Retiro', 'רטירו']],
  'buenos-aires': [['Palermo', 'פלרמו'], ['San Telmo', 'סן טלמו'], ['Recoleta', 'רקולטה'], ['Puerto Madero', 'פוארטו מדרו'], ['Belgrano', 'בלגרנו']],
  reykjavik: [['Miðborg', 'מרכז העיר'], ['Vesturbær', 'ווסטורביירר'], ['Laugardalur', 'לויגרדלור'], ['Old Harbour', 'הנמל הישן'], ['Hlíðar', 'הליית׳אר']],
}

const slugify = (city: string, country: string) =>
  `${city}-${country}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export function buildDestinations(rows: DestRow[]): Destination[] {
  const seen = new Set<string>()
  const out: Destination[] = []
  for (const [city, cityHe, country, basePrice] of rows) {
    const id = slugify(city, country)
    if (seen.has(id)) continue
    seen.add(id)
    out.push({
      id,
      city,
      cityHe,
      country,
      basePrice,
      region: REGION_BY_COUNTRY[country] ?? 'western-europe',
    })
  }
  return out
}

export function neighbourhoodsFor(destination: Destination): [string, string][] {
  const shortId = destination.id.split('-').slice(0, -1).join('-')
  const curated = CURATED[shortId] ?? CURATED[destination.id]
  if (curated) return curated
  const rng = makeRng(`hood-${destination.id}`)
  return pickMany(rng, DISTRICTS[destination.region], 5)
}

export const destinationCity = (destination: Destination, locale: LocaleCode) =>
  locale === 'he' ? destination.cityHe : destination.city

export const destinationCountry = (destination: Destination, locale: LocaleCode) =>
  locale === 'he' ? COUNTRY_HE[destination.country] ?? destination.country : destination.country
