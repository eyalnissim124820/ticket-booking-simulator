export interface Airport {
  code: string
  city: string
  name: string
  country: string
  /** Rough coordinates, used only to estimate flight distance/duration. */
  lat: number
  lon: number
  tz: number
}

export const AIRPORTS: Airport[] = [
  { code: 'JFK', city: 'New York', name: 'John F. Kennedy Intl', country: 'United States', lat: 40.64, lon: -73.78, tz: -4 },
  { code: 'EWR', city: 'Newark', name: 'Newark Liberty Intl', country: 'United States', lat: 40.69, lon: -74.17, tz: -4 },
  { code: 'LAX', city: 'Los Angeles', name: 'Los Angeles Intl', country: 'United States', lat: 33.94, lon: -118.41, tz: -7 },
  { code: 'SFO', city: 'San Francisco', name: 'San Francisco Intl', country: 'United States', lat: 37.62, lon: -122.38, tz: -7 },
  { code: 'ORD', city: 'Chicago', name: "O'Hare Intl", country: 'United States', lat: 41.98, lon: -87.9, tz: -5 },
  { code: 'MIA', city: 'Miami', name: 'Miami Intl', country: 'United States', lat: 25.79, lon: -80.29, tz: -4 },
  { code: 'SEA', city: 'Seattle', name: 'Seattle–Tacoma Intl', country: 'United States', lat: 47.45, lon: -122.31, tz: -7 },
  { code: 'DEN', city: 'Denver', name: 'Denver Intl', country: 'United States', lat: 39.86, lon: -104.67, tz: -6 },
  { code: 'BOS', city: 'Boston', name: 'Logan Intl', country: 'United States', lat: 42.36, lon: -71.01, tz: -4 },
  { code: 'AUS', city: 'Austin', name: 'Austin–Bergstrom Intl', country: 'United States', lat: 30.19, lon: -97.67, tz: -5 },
  { code: 'YYZ', city: 'Toronto', name: 'Pearson Intl', country: 'Canada', lat: 43.68, lon: -79.63, tz: -4 },
  { code: 'MEX', city: 'Mexico City', name: 'Benito Juárez Intl', country: 'Mexico', lat: 19.44, lon: -99.07, tz: -6 },
  { code: 'GRU', city: 'São Paulo', name: 'Guarulhos Intl', country: 'Brazil', lat: -23.43, lon: -46.47, tz: -3 },
  { code: 'EZE', city: 'Buenos Aires', name: 'Ministro Pistarini Intl', country: 'Argentina', lat: -34.82, lon: -58.54, tz: -3 },
  { code: 'LHR', city: 'London', name: 'Heathrow', country: 'United Kingdom', lat: 51.47, lon: -0.45, tz: 1 },
  { code: 'CDG', city: 'Paris', name: 'Charles de Gaulle', country: 'France', lat: 49.01, lon: 2.55, tz: 2 },
  { code: 'AMS', city: 'Amsterdam', name: 'Schiphol', country: 'Netherlands', lat: 52.31, lon: 4.76, tz: 2 },
  { code: 'FRA', city: 'Frankfurt', name: 'Frankfurt am Main', country: 'Germany', lat: 50.04, lon: 8.56, tz: 2 },
  { code: 'MAD', city: 'Madrid', name: 'Adolfo Suárez Barajas', country: 'Spain', lat: 40.47, lon: -3.56, tz: 2 },
  { code: 'BCN', city: 'Barcelona', name: 'El Prat', country: 'Spain', lat: 41.3, lon: 2.08, tz: 2 },
  { code: 'FCO', city: 'Rome', name: 'Fiumicino', country: 'Italy', lat: 41.8, lon: 12.25, tz: 2 },
  { code: 'LIS', city: 'Lisbon', name: 'Humberto Delgado', country: 'Portugal', lat: 38.77, lon: -9.13, tz: 1 },
  { code: 'ZRH', city: 'Zurich', name: 'Zurich Airport', country: 'Switzerland', lat: 47.46, lon: 8.55, tz: 2 },
  { code: 'CPH', city: 'Copenhagen', name: 'Kastrup', country: 'Denmark', lat: 55.62, lon: 12.66, tz: 2 },
  { code: 'IST', city: 'Istanbul', name: 'Istanbul Airport', country: 'Türkiye', lat: 41.26, lon: 28.74, tz: 3 },
  { code: 'TLV', city: 'Tel Aviv', name: 'Ben Gurion', country: 'Israel', lat: 32.01, lon: 34.89, tz: 3 },
  { code: 'DXB', city: 'Dubai', name: 'Dubai Intl', country: 'United Arab Emirates', lat: 25.25, lon: 55.36, tz: 4 },
  { code: 'DOH', city: 'Doha', name: 'Hamad Intl', country: 'Qatar', lat: 25.27, lon: 51.61, tz: 3 },
  { code: 'BOM', city: 'Mumbai', name: 'Chhatrapati Shivaji Intl', country: 'India', lat: 19.09, lon: 72.87, tz: 5.5 },
  { code: 'DEL', city: 'Delhi', name: 'Indira Gandhi Intl', country: 'India', lat: 28.56, lon: 77.1, tz: 5.5 },
  { code: 'BKK', city: 'Bangkok', name: 'Suvarnabhumi', country: 'Thailand', lat: 13.69, lon: 100.75, tz: 7 },
  { code: 'SIN', city: 'Singapore', name: 'Changi', country: 'Singapore', lat: 1.36, lon: 103.99, tz: 8 },
  { code: 'HKG', city: 'Hong Kong', name: 'Hong Kong Intl', country: 'Hong Kong', lat: 22.31, lon: 113.91, tz: 8 },
  { code: 'NRT', city: 'Tokyo', name: 'Narita Intl', country: 'Japan', lat: 35.77, lon: 140.39, tz: 9 },
  { code: 'ICN', city: 'Seoul', name: 'Incheon Intl', country: 'South Korea', lat: 37.46, lon: 126.44, tz: 9 },
  { code: 'SYD', city: 'Sydney', name: 'Kingsford Smith', country: 'Australia', lat: -33.94, lon: 151.18, tz: 10 },
  { code: 'AKL', city: 'Auckland', name: 'Auckland Airport', country: 'New Zealand', lat: -37.01, lon: 174.79, tz: 12 },
  { code: 'JNB', city: 'Johannesburg', name: 'O. R. Tambo Intl', country: 'South Africa', lat: -26.14, lon: 28.25, tz: 2 },
  { code: 'CAI', city: 'Cairo', name: 'Cairo Intl', country: 'Egypt', lat: 30.11, lon: 31.41, tz: 3 },
  { code: 'CMN', city: 'Casablanca', name: 'Mohammed V Intl', country: 'Morocco', lat: 33.37, lon: -7.59, tz: 1 },
]

export const AIRPORT_BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]))

export const getAirport = (code: string): Airport =>
  AIRPORT_BY_CODE.get(code) ?? AIRPORTS[0]

export function searchAirports(query: string, limit = 7): Airport[] {
  const q = query.trim().toLowerCase()
  if (!q) return AIRPORTS.slice(0, limit)
  const scored = AIRPORTS.map((a) => {
    const code = a.code.toLowerCase()
    const city = a.city.toLowerCase()
    let score = -1
    if (code === q) score = 0
    else if (city.startsWith(q)) score = 1
    else if (code.startsWith(q)) score = 2
    else if (city.includes(q)) score = 3
    else if (a.name.toLowerCase().includes(q) || a.country.toLowerCase().includes(q)) score = 4
    return { a, score }
  }).filter((s) => s.score >= 0)
  scored.sort((x, y) => x.score - y.score || x.a.city.localeCompare(y.a.city))
  return scored.slice(0, limit).map((s) => s.a)
}

/** Great-circle distance in km. */
export function distanceKm(a: Airport, b: Airport): number {
  const R = 6371
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(h)))
}
