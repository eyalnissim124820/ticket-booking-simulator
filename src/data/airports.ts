import { COUNTRY_HE } from './countries'
import type { LocaleCode } from '../i18n'

export interface Airport {
  code: string
  city: string
  cityHe: string
  name: string
  country: string
  lat: number
  lon: number
}

/** [code, city, cityHe, airport name, country, lat, lon] */
type Row = [string, string, string, string, string, number, number]

const ROWS: Row[] = [
  // ---- North America
  ['JFK', 'New York', 'ניו יורק', 'John F. Kennedy Intl', 'United States', 40.64, -73.78],
  ['EWR', 'Newark', 'ניוארק', 'Newark Liberty Intl', 'United States', 40.69, -74.17],
  ['LGA', 'New York', 'ניו יורק', 'LaGuardia', 'United States', 40.78, -73.87],
  ['BOS', 'Boston', 'בוסטון', 'Logan Intl', 'United States', 42.36, -71.01],
  ['PHL', 'Philadelphia', 'פילדלפיה', 'Philadelphia Intl', 'United States', 39.87, -75.24],
  ['IAD', 'Washington', 'וושינגטון', 'Dulles Intl', 'United States', 38.95, -77.45],
  ['ATL', 'Atlanta', 'אטלנטה', 'Hartsfield–Jackson Intl', 'United States', 33.64, -84.43],
  ['MIA', 'Miami', 'מיאמי', 'Miami Intl', 'United States', 25.79, -80.29],
  ['MCO', 'Orlando', 'אורלנדו', 'Orlando Intl', 'United States', 28.43, -81.31],
  ['ORD', 'Chicago', 'שיקגו', "O'Hare Intl", 'United States', 41.98, -87.9],
  ['DTW', 'Detroit', 'דטרויט', 'Detroit Metropolitan', 'United States', 42.21, -83.35],
  ['MSP', 'Minneapolis', 'מיניאפוליס', 'Minneapolis–St Paul Intl', 'United States', 44.88, -93.22],
  ['DFW', 'Dallas', 'דאלאס', 'Dallas/Fort Worth Intl', 'United States', 32.9, -97.04],
  ['IAH', 'Houston', 'יוסטון', 'George Bush Intercontinental', 'United States', 29.99, -95.34],
  ['AUS', 'Austin', 'אוסטין', 'Austin–Bergstrom Intl', 'United States', 30.19, -97.67],
  ['DEN', 'Denver', 'דנוור', 'Denver Intl', 'United States', 39.86, -104.67],
  ['PHX', 'Phoenix', 'פיניקס', 'Sky Harbor Intl', 'United States', 33.44, -112.01],
  ['LAS', 'Las Vegas', 'לאס וגאס', 'Harry Reid Intl', 'United States', 36.08, -115.15],
  ['LAX', 'Los Angeles', 'לוס אנג׳לס', 'Los Angeles Intl', 'United States', 33.94, -118.41],
  ['SAN', 'San Diego', 'סן דייגו', 'San Diego Intl', 'United States', 32.73, -117.19],
  ['SFO', 'San Francisco', 'סן פרנסיסקו', 'San Francisco Intl', 'United States', 37.62, -122.38],
  ['SEA', 'Seattle', 'סיאטל', 'Seattle–Tacoma Intl', 'United States', 47.45, -122.31],
  ['PDX', 'Portland', 'פורטלנד', 'Portland Intl', 'United States', 45.59, -122.6],
  ['HNL', 'Honolulu', 'הונולולו', 'Daniel K. Inouye Intl', 'United States', 21.32, -157.92],
  ['ANC', 'Anchorage', 'אנקורג׳', 'Ted Stevens Intl', 'United States', 61.17, -149.99],
  ['YYZ', 'Toronto', 'טורונטו', 'Pearson Intl', 'Canada', 43.68, -79.63],
  ['YUL', 'Montreal', 'מונטריאול', 'Trudeau Intl', 'Canada', 45.47, -73.74],
  ['YVR', 'Vancouver', 'ונקובר', 'Vancouver Intl', 'Canada', 49.19, -123.18],
  ['YYC', 'Calgary', 'קלגרי', 'Calgary Intl', 'Canada', 51.13, -114.01],
  ['MEX', 'Mexico City', 'מקסיקו סיטי', 'Benito Juárez Intl', 'Mexico', 19.44, -99.07],
  ['CUN', 'Cancún', 'קנקון', 'Cancún Intl', 'Mexico', 21.04, -86.87],
  ['GDL', 'Guadalajara', 'גוודלחרה', 'Guadalajara Intl', 'Mexico', 20.52, -103.31],
  ['PTY', 'Panama City', 'פנמה סיטי', 'Tocumen Intl', 'Panama', 9.07, -79.38],
  ['SJO', 'San José', 'סן חוסה', 'Juan Santamaría Intl', 'Costa Rica', 9.99, -84.21],
  ['HAV', 'Havana', 'הוואנה', 'José Martí Intl', 'Cuba', 22.99, -82.41],
  ['SJU', 'San Juan', 'סן חואן', 'Luis Muñoz Marín Intl', 'Puerto Rico', 18.44, -66.0],
  ['PUJ', 'Punta Cana', 'פונטה קאנה', 'Punta Cana Intl', 'Dominican Republic', 18.57, -68.36],
  ['KIN', 'Kingston', 'קינגסטון', 'Norman Manley Intl', 'Jamaica', 17.94, -76.79],
  ['GUA', 'Guatemala City', 'גואטמלה סיטי', 'La Aurora Intl', 'Guatemala', 14.58, -90.53],

  // ---- South America
  ['GRU', 'São Paulo', 'סאו פאולו', 'Guarulhos Intl', 'Brazil', -23.43, -46.47],
  ['GIG', 'Rio de Janeiro', 'ריו דה ז׳ניירו', 'Galeão Intl', 'Brazil', -22.81, -43.25],
  ['BSB', 'Brasília', 'ברזיליה', 'Brasília Intl', 'Brazil', -15.87, -47.92],
  ['EZE', 'Buenos Aires', 'בואנוס איירס', 'Ministro Pistarini Intl', 'Argentina', -34.82, -58.54],
  ['SCL', 'Santiago', 'סנטיאגו', 'Arturo Merino Benítez Intl', 'Chile', -33.39, -70.79],
  ['LIM', 'Lima', 'לימה', 'Jorge Chávez Intl', 'Peru', -12.02, -77.11],
  ['BOG', 'Bogotá', 'בוגוטה', 'El Dorado Intl', 'Colombia', 4.7, -74.15],
  ['MDE', 'Medellín', 'מדיין', 'José María Córdova Intl', 'Colombia', 6.16, -75.42],
  ['UIO', 'Quito', 'קיטו', 'Mariscal Sucre Intl', 'Ecuador', -0.13, -78.36],
  ['MVD', 'Montevideo', 'מונטווידאו', 'Carrasco Intl', 'Uruguay', -34.84, -56.03],
  ['LPB', 'La Paz', 'לה פאס', 'El Alto Intl', 'Bolivia', -16.51, -68.19],

  // ---- Western & Northern Europe
  ['LHR', 'London', 'לונדון', 'Heathrow', 'United Kingdom', 51.47, -0.45],
  ['LGW', 'London', 'לונדון', 'Gatwick', 'United Kingdom', 51.15, -0.19],
  ['MAN', 'Manchester', 'מנצ׳סטר', 'Manchester Airport', 'United Kingdom', 53.36, -2.27],
  ['EDI', 'Edinburgh', 'אדינבורו', 'Edinburgh Airport', 'United Kingdom', 55.95, -3.37],
  ['DUB', 'Dublin', 'דבלין', 'Dublin Airport', 'Ireland', 53.43, -6.25],
  ['CDG', 'Paris', 'פריז', 'Charles de Gaulle', 'France', 49.01, 2.55],
  ['ORY', 'Paris', 'פריז', 'Orly', 'France', 48.72, 2.38],
  ['NCE', 'Nice', 'ניס', "Côte d'Azur", 'France', 43.66, 7.22],
  ['LYS', 'Lyon', 'ליון', 'Saint-Exupéry', 'France', 45.73, 5.08],
  ['MRS', 'Marseille', 'מרסיי', 'Marseille Provence', 'France', 43.44, 5.22],
  ['BRU', 'Brussels', 'בריסל', 'Brussels Airport', 'Belgium', 50.9, 4.48],
  ['AMS', 'Amsterdam', 'אמסטרדם', 'Schiphol', 'Netherlands', 52.31, 4.76],
  ['LUX', 'Luxembourg', 'לוקסמבורג', 'Findel', 'Luxembourg', 49.63, 6.21],
  ['FRA', 'Frankfurt', 'פרנקפורט', 'Frankfurt am Main', 'Germany', 50.04, 8.56],
  ['MUC', 'Munich', 'מינכן', 'Munich Airport', 'Germany', 48.35, 11.79],
  ['BER', 'Berlin', 'ברלין', 'Brandenburg', 'Germany', 52.37, 13.5],
  ['DUS', 'Düsseldorf', 'דיסלדורף', 'Düsseldorf Airport', 'Germany', 51.29, 6.77],
  ['HAM', 'Hamburg', 'המבורג', 'Hamburg Airport', 'Germany', 53.63, 9.99],
  ['ZRH', 'Zurich', 'ציריך', 'Zurich Airport', 'Switzerland', 47.46, 8.55],
  ['GVA', 'Geneva', 'ז׳נבה', 'Geneva Airport', 'Switzerland', 46.24, 6.11],
  ['VIE', 'Vienna', 'וינה', 'Vienna Intl', 'Austria', 48.11, 16.57],
  ['CPH', 'Copenhagen', 'קופנהגן', 'Kastrup', 'Denmark', 55.62, 12.66],
  ['OSL', 'Oslo', 'אוסלו', 'Gardermoen', 'Norway', 60.19, 11.1],
  ['ARN', 'Stockholm', 'שטוקהולם', 'Arlanda', 'Sweden', 59.65, 17.92],
  ['HEL', 'Helsinki', 'הלסינקי', 'Helsinki-Vantaa', 'Finland', 60.32, 24.96],
  ['KEF', 'Reykjavík', 'רייקיאוויק', 'Keflavík Intl', 'Iceland', 63.99, -22.61],

  // ---- Southern & Eastern Europe
  ['MAD', 'Madrid', 'מדריד', 'Adolfo Suárez Barajas', 'Spain', 40.47, -3.56],
  ['BCN', 'Barcelona', 'ברצלונה', 'El Prat', 'Spain', 41.3, 2.08],
  ['AGP', 'Málaga', 'מלאגה', 'Costa del Sol', 'Spain', 36.68, -4.5],
  ['PMI', 'Palma', 'פלמה', 'Palma de Mallorca', 'Spain', 39.55, 2.74],
  ['VLC', 'Valencia', 'ולנסיה', 'Valencia Airport', 'Spain', 39.49, -0.48],
  ['LIS', 'Lisbon', 'ליסבון', 'Humberto Delgado', 'Portugal', 38.77, -9.13],
  ['OPO', 'Porto', 'פורטו', 'Francisco Sá Carneiro', 'Portugal', 41.24, -8.68],
  ['FAO', 'Faro', 'פארו', 'Faro Airport', 'Portugal', 37.01, -7.97],
  ['FCO', 'Rome', 'רומא', 'Fiumicino', 'Italy', 41.8, 12.25],
  ['MXP', 'Milan', 'מילאנו', 'Malpensa', 'Italy', 45.63, 8.72],
  ['VCE', 'Venice', 'ונציה', 'Marco Polo', 'Italy', 45.5, 12.35],
  ['NAP', 'Naples', 'נאפולי', 'Capodichino', 'Italy', 40.89, 14.29],
  ['CTA', 'Catania', 'קטניה', 'Fontanarossa', 'Italy', 37.47, 15.07],
  ['ATH', 'Athens', 'אתונה', 'Eleftherios Venizelos', 'Greece', 37.94, 23.95],
  ['JTR', 'Santorini', 'סנטוריני', 'Santorini Airport', 'Greece', 36.4, 25.48],
  ['HER', 'Heraklion', 'הרקליון', 'Nikos Kazantzakis', 'Greece', 35.34, 25.18],
  ['MLA', 'Valletta', 'ולטה', 'Malta Intl', 'Malta', 35.86, 14.48],
  ['LCA', 'Larnaca', 'לרנקה', 'Larnaca Intl', 'Cyprus', 34.88, 33.63],
  ['ZAG', 'Zagreb', 'זאגרב', 'Franjo Tuđman', 'Croatia', 45.74, 16.07],
  ['SPU', 'Split', 'ספליט', 'Split Airport', 'Croatia', 43.54, 16.3],
  ['DBV', 'Dubrovnik', 'דוברובניק', 'Dubrovnik Airport', 'Croatia', 42.56, 18.27],
  ['LJU', 'Ljubljana', 'ליובליאנה', 'Jože Pučnik', 'Slovenia', 46.22, 14.46],
  ['PRG', 'Prague', 'פראג', 'Václav Havel', 'Czechia', 50.1, 14.26],
  ['BUD', 'Budapest', 'בודפשט', 'Ferenc Liszt Intl', 'Hungary', 47.44, 19.26],
  ['WAW', 'Warsaw', 'ורשה', 'Chopin', 'Poland', 52.17, 20.97],
  ['KRK', 'Kraków', 'קרקוב', 'John Paul II', 'Poland', 50.08, 19.79],
  ['OTP', 'Bucharest', 'בוקרשט', 'Henri Coandă', 'Romania', 44.57, 26.1],
  ['SOF', 'Sofia', 'סופיה', 'Sofia Airport', 'Bulgaria', 42.7, 23.41],
  ['BEG', 'Belgrade', 'בלגרד', 'Nikola Tesla', 'Serbia', 44.82, 20.29],
  ['TIA', 'Tirana', 'טירנה', 'Nënë Tereza', 'Albania', 41.41, 19.72],
  ['SKP', 'Skopje', 'סקופיה', 'Skopje Intl', 'North Macedonia', 41.96, 21.62],
  ['TGD', 'Podgorica', 'פודגוריצה', 'Podgorica Airport', 'Montenegro', 42.36, 19.25],
  ['SJJ', 'Sarajevo', 'סרייבו', 'Sarajevo Intl', 'Bosnia and Herzegovina', 43.82, 18.33],
  ['RIX', 'Riga', 'ריגה', 'Riga Intl', 'Latvia', 56.92, 23.97],
  ['TLL', 'Tallinn', 'טאלין', 'Lennart Meri', 'Estonia', 59.41, 24.83],
  ['VNO', 'Vilnius', 'וילנה', 'Vilnius Intl', 'Lithuania', 54.64, 25.28],
  ['KBP', 'Kyiv', 'קייב', 'Boryspil Intl', 'Ukraine', 50.34, 30.89],
  ['KIV', 'Chișinău', 'קישינב', 'Chișinău Intl', 'Moldova', 46.93, 28.93],
  ['TBS', 'Tbilisi', 'טביליסי', 'Tbilisi Intl', 'Georgia', 41.67, 44.95],
  ['EVN', 'Yerevan', 'ירוואן', 'Zvartnots Intl', 'Armenia', 40.15, 44.4],
  ['GYD', 'Baku', 'באקו', 'Heydar Aliyev Intl', 'Azerbaijan', 40.47, 50.05],

  // ---- Middle East & North Africa
  ['TLV', 'Tel Aviv', 'תל אביב', 'Ben Gurion', 'Israel', 32.01, 34.89],
  ['ETM', 'Eilat', 'אילת', 'Ramon Airport', 'Israel', 29.72, 35.01],
  ['IST', 'Istanbul', 'איסטנבול', 'Istanbul Airport', 'Türkiye', 41.26, 28.74],
  ['SAW', 'Istanbul', 'איסטנבול', 'Sabiha Gökçen', 'Türkiye', 40.9, 29.31],
  ['AYT', 'Antalya', 'אנטליה', 'Antalya Airport', 'Türkiye', 36.9, 30.79],
  ['ADB', 'Izmir', 'איזמיר', 'Adnan Menderes', 'Türkiye', 38.29, 27.16],
  ['AMM', 'Amman', 'עמאן', 'Queen Alia Intl', 'Jordan', 31.72, 35.99],
  ['BEY', 'Beirut', 'ביירות', 'Rafic Hariri Intl', 'Lebanon', 33.82, 35.49],
  ['DXB', 'Dubai', 'דובאי', 'Dubai Intl', 'United Arab Emirates', 25.25, 55.36],
  ['AUH', 'Abu Dhabi', 'אבו דאבי', 'Zayed Intl', 'United Arab Emirates', 24.43, 54.65],
  ['DOH', 'Doha', 'דוחא', 'Hamad Intl', 'Qatar', 25.27, 51.61],
  ['BAH', 'Manama', 'מנאמה', 'Bahrain Intl', 'Bahrain', 26.27, 50.63],
  ['KWI', 'Kuwait City', 'כווית סיטי', 'Kuwait Intl', 'Kuwait', 29.23, 47.97],
  ['MCT', 'Muscat', 'מסקט', 'Muscat Intl', 'Oman', 23.59, 58.28],
  ['RUH', 'Riyadh', 'ריאד', 'King Khalid Intl', 'Saudi Arabia', 24.96, 46.7],
  ['JED', 'Jeddah', 'ג׳דה', 'King Abdulaziz Intl', 'Saudi Arabia', 21.68, 39.16],
  ['CAI', 'Cairo', 'קהיר', 'Cairo Intl', 'Egypt', 30.11, 31.41],
  ['SSH', 'Sharm el-Sheikh', 'שארם א-שייח׳', 'Sharm el-Sheikh Intl', 'Egypt', 27.98, 34.39],
  ['CMN', 'Casablanca', 'קזבלנקה', 'Mohammed V Intl', 'Morocco', 33.37, -7.59],
  ['RAK', 'Marrakesh', 'מרקש', 'Menara', 'Morocco', 31.61, -8.04],
  ['TUN', 'Tunis', 'תוניס', 'Carthage', 'Tunisia', 36.85, 10.23],
  ['ALG', 'Algiers', 'אלג׳יר', 'Houari Boumediene', 'Algeria', 36.69, 3.22],

  // ---- Sub-Saharan Africa
  ['JNB', 'Johannesburg', 'יוהנסבורג', 'O. R. Tambo Intl', 'South Africa', -26.14, 28.25],
  ['CPT', 'Cape Town', 'קייפטאון', 'Cape Town Intl', 'South Africa', -33.97, 18.6],
  ['NBO', 'Nairobi', 'ניירובי', 'Jomo Kenyatta Intl', 'Kenya', -1.32, 36.93],
  ['ADD', 'Addis Ababa', 'אדיס אבבה', 'Bole Intl', 'Ethiopia', 8.98, 38.8],
  ['LOS', 'Lagos', 'לאגוס', 'Murtala Muhammed Intl', 'Nigeria', 6.58, 3.32],
  ['ACC', 'Accra', 'אקרה', 'Kotoka Intl', 'Ghana', 5.61, -0.17],
  ['DAR', 'Dar es Salaam', 'דאר א-סלאם', 'Julius Nyerere Intl', 'Tanzania', -6.88, 39.2],
  ['ZNZ', 'Zanzibar', 'זנזיבר', 'Abeid Amani Karume Intl', 'Tanzania', -6.22, 39.22],
  ['KGL', 'Kigali', 'קיגאלי', 'Kigali Intl', 'Rwanda', -1.97, 30.14],
  ['DKR', 'Dakar', 'דקאר', 'Blaise Diagne Intl', 'Senegal', 14.67, -17.07],
  ['WDH', 'Windhoek', 'ווינדהוק', 'Hosea Kutako Intl', 'Namibia', -22.48, 17.47],
  ['MRU', 'Port Louis', 'פורט לואי', 'Sir Seewoosagur Ramgoolam Intl', 'Mauritius', -20.43, 57.68],

  // ---- South & Central Asia
  ['DEL', 'Delhi', 'דלהי', 'Indira Gandhi Intl', 'India', 28.56, 77.1],
  ['BOM', 'Mumbai', 'מומבאי', 'Chhatrapati Shivaji Intl', 'India', 19.09, 72.87],
  ['BLR', 'Bengaluru', 'בנגלור', 'Kempegowda Intl', 'India', 13.2, 77.71],
  ['MAA', 'Chennai', 'צ׳נאי', 'Chennai Intl', 'India', 12.99, 80.17],
  ['GOI', 'Goa', 'גואה', 'Dabolim', 'India', 15.38, 73.83],
  ['CCU', 'Kolkata', 'קולקטה', 'Netaji Subhas Chandra Bose Intl', 'India', 22.65, 88.45],
  ['CMB', 'Colombo', 'קולומבו', 'Bandaranaike Intl', 'Sri Lanka', 7.18, 79.88],
  ['MLE', 'Malé', 'מאלה', 'Velana Intl', 'Maldives', 4.19, 73.53],
  ['KTM', 'Kathmandu', 'קטמנדו', 'Tribhuvan Intl', 'Nepal', 27.7, 85.36],
  ['DAC', 'Dhaka', 'דאקה', 'Hazrat Shahjalal Intl', 'Bangladesh', 23.84, 90.4],
  ['KHI', 'Karachi', 'קראצ׳י', 'Jinnah Intl', 'Pakistan', 24.91, 67.16],
  ['TAS', 'Tashkent', 'טשקנט', 'Islam Karimov Intl', 'Uzbekistan', 41.26, 69.28],
  ['ALA', 'Almaty', 'אלמאטי', 'Almaty Intl', 'Kazakhstan', 43.35, 77.04],

  // ---- East & Southeast Asia
  ['BKK', 'Bangkok', 'בנגקוק', 'Suvarnabhumi', 'Thailand', 13.69, 100.75],
  ['HKT', 'Phuket', 'פוקט', 'Phuket Intl', 'Thailand', 8.11, 98.31],
  ['CNX', 'Chiang Mai', 'צ׳יאנג מאי', 'Chiang Mai Intl', 'Thailand', 18.77, 98.96],
  ['SIN', 'Singapore', 'סינגפור', 'Changi', 'Singapore', 1.36, 103.99],
  ['KUL', 'Kuala Lumpur', 'קואלה לומפור', 'KLIA', 'Malaysia', 2.75, 101.71],
  ['CGK', 'Jakarta', 'ג׳קרטה', 'Soekarno–Hatta Intl', 'Indonesia', -6.13, 106.66],
  ['DPS', 'Denpasar', 'דנפסאר', 'Ngurah Rai Intl', 'Indonesia', -8.75, 115.17],
  ['MNL', 'Manila', 'מנילה', 'Ninoy Aquino Intl', 'Philippines', 14.51, 121.02],
  ['SGN', 'Ho Chi Minh City', 'הו צ׳י מין', 'Tan Son Nhat Intl', 'Vietnam', 10.82, 106.66],
  ['HAN', 'Hanoi', 'האנוי', 'Noi Bai Intl', 'Vietnam', 21.22, 105.81],
  ['REP', 'Siem Reap', 'סיאם ריפ', 'Angkor Intl', 'Cambodia', 13.41, 103.81],
  ['RGN', 'Yangon', 'יאנגון', 'Yangon Intl', 'Myanmar', 16.91, 96.13],
  ['VTE', 'Vientiane', 'ויינטיאן', 'Wattay Intl', 'Laos', 17.99, 102.56],
  ['HKG', 'Hong Kong', 'הונג קונג', 'Hong Kong Intl', 'Hong Kong', 22.31, 113.91],
  ['PVG', 'Shanghai', 'שנגחאי', 'Pudong Intl', 'China', 31.14, 121.81],
  ['PEK', 'Beijing', 'בייג׳ינג', 'Capital Intl', 'China', 40.08, 116.58],
  ['CAN', 'Guangzhou', 'גואנגג׳ואו', 'Baiyun Intl', 'China', 23.39, 113.31],
  ['CTU', 'Chengdu', 'צ׳נגדו', 'Tianfu Intl', 'China', 30.31, 104.44],
  ['TPE', 'Taipei', 'טאיפיי', 'Taoyuan Intl', 'Taiwan', 25.08, 121.23],
  ['ICN', 'Seoul', 'סיאול', 'Incheon Intl', 'South Korea', 37.46, 126.44],
  ['NRT', 'Tokyo', 'טוקיו', 'Narita Intl', 'Japan', 35.77, 140.39],
  ['HND', 'Tokyo', 'טוקיו', 'Haneda', 'Japan', 35.55, 139.78],
  ['KIX', 'Osaka', 'אוסקה', 'Kansai Intl', 'Japan', 34.43, 135.24],
  ['CTS', 'Sapporo', 'סאפורו', 'New Chitose', 'Japan', 42.78, 141.69],
  ['OKA', 'Okinawa', 'אוקינאווה', 'Naha', 'Japan', 26.2, 127.65],

  // ---- Oceania
  ['SYD', 'Sydney', 'סידני', 'Kingsford Smith', 'Australia', -33.94, 151.18],
  ['MEL', 'Melbourne', 'מלבורן', 'Tullamarine', 'Australia', -37.67, 144.84],
  ['BNE', 'Brisbane', 'בריסביין', 'Brisbane Airport', 'Australia', -27.38, 153.12],
  ['PER', 'Perth', 'פרת׳', 'Perth Airport', 'Australia', -31.94, 115.97],
  ['ADL', 'Adelaide', 'אדלייד', 'Adelaide Airport', 'Australia', -34.95, 138.53],
  ['AKL', 'Auckland', 'אוקלנד', 'Auckland Airport', 'New Zealand', -37.01, 174.79],
  ['CHC', 'Christchurch', 'קרייסטצ׳רץ׳', 'Christchurch Intl', 'New Zealand', -43.49, 172.53],
  ['ZQN', 'Queenstown', 'קווינסטאון', 'Queenstown Airport', 'New Zealand', -45.02, 168.74],
  ['NAN', 'Nadi', 'נאדי', 'Nadi Intl', 'Fiji', -17.76, 177.44],
]

export const AIRPORTS: Airport[] = ROWS.map(([code, city, cityHe, name, country, lat, lon]) => ({
  code,
  city,
  cityHe,
  name,
  country,
  lat,
  lon,
}))

export const AIRPORT_BY_CODE = new Map(AIRPORTS.map((a) => [a.code, a]))

export const getAirport = (code: string): Airport => AIRPORT_BY_CODE.get(code) ?? AIRPORTS[0]

export const airportCity = (airport: Airport, locale: LocaleCode) =>
  locale === 'he' ? airport.cityHe : airport.city

export const airportCountry = (airport: Airport, locale: LocaleCode) =>
  locale === 'he' ? COUNTRY_HE[airport.country] ?? airport.country : airport.country

/** Hebrew rarely uses an airport's formal name — "Lisbon airport" is how it is said. */
export const airportName = (airport: Airport, locale: LocaleCode) =>
  locale === 'he' ? `נמל התעופה ${airport.cityHe}` : airport.name

export function searchAirports(query: string, locale: LocaleCode, limit = 7): Airport[] {
  const q = query.trim().toLowerCase()
  if (!q) {
    // A useful default list rather than whatever happens to sort first.
    const featured = ['TLV', 'LHR', 'JFK', 'CDG', 'BCN', 'NRT', 'DXB']
    return featured.map(getAirport).slice(0, limit)
  }
  const scored = AIRPORTS.map((airport) => {
    const haystacks = [
      airport.code.toLowerCase(),
      airport.city.toLowerCase(),
      airport.cityHe,
      airport.name.toLowerCase(),
      airport.country.toLowerCase(),
      COUNTRY_HE[airport.country] ?? '',
    ]
    let score = -1
    if (haystacks[0] === q) score = 0
    else if (haystacks[1].startsWith(q) || haystacks[2].startsWith(q)) score = 1
    else if (haystacks[0].startsWith(q)) score = 2
    else if (haystacks[1].includes(q) || haystacks[2].includes(q)) score = 3
    else if (haystacks.slice(3).some((h) => h.includes(q))) score = 4
    return { airport, score }
  }).filter((entry) => entry.score >= 0)

  scored.sort(
    (a, b) =>
      a.score - b.score ||
      airportCity(a.airport, locale).localeCompare(airportCity(b.airport, locale)),
  )
  return scored.slice(0, limit).map((entry) => entry.airport)
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
