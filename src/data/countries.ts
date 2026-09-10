/** Country names, English → Hebrew. Airports and stay destinations both key
 *  into this, so a country is translated once. */
export const COUNTRY_HE: Record<string, string> = {
  'Albania': 'אלבניה', 'Algeria': 'אלג׳יריה', 'Argentina': 'ארגנטינה', 'Armenia': 'ארמניה',
  'Australia': 'אוסטרליה', 'Austria': 'אוסטריה', 'Azerbaijan': 'אזרבייג׳ן', 'Bahrain': 'בחריין',
  'Bangladesh': 'בנגלדש', 'Belgium': 'בלגיה', 'Bolivia': 'בוליביה',
  'Bosnia and Herzegovina': 'בוסניה והרצגובינה', 'Brazil': 'ברזיל', 'Bulgaria': 'בולגריה',
  'Cambodia': 'קמבודיה', 'Canada': 'קנדה', 'Chile': 'צ׳ילה', 'China': 'סין', 'Colombia': 'קולומביה',
  'Costa Rica': 'קוסטה ריקה', 'Croatia': 'קרואטיה', 'Cuba': 'קובה', 'Cyprus': 'קפריסין',
  'Czechia': 'צ׳כיה', 'Denmark': 'דנמרק', 'Dominican Republic': 'הרפובליקה הדומיניקנית',
  'Ecuador': 'אקוודור', 'Egypt': 'מצרים', 'Estonia': 'אסטוניה', 'Ethiopia': 'אתיופיה',
  'Fiji': 'פיג׳י', 'Finland': 'פינלנד', 'France': 'צרפת', 'Georgia': 'גאורגיה', 'Germany': 'גרמניה',
  'Ghana': 'גאנה', 'Greece': 'יוון', 'Guatemala': 'גואטמלה', 'Hong Kong': 'הונג קונג',
  'Hungary': 'הונגריה', 'Iceland': 'איסלנד', 'India': 'הודו', 'Indonesia': 'אינדונזיה',
  'Ireland': 'אירלנד', 'Israel': 'ישראל', 'Italy': 'איטליה', 'Jamaica': 'ג׳מייקה', 'Japan': 'יפן',
  'Jordan': 'ירדן', 'Kazakhstan': 'קזחסטן', 'Kenya': 'קניה', 'Kuwait': 'כווית', 'Laos': 'לאוס',
  'Latvia': 'לטביה', 'Lebanon': 'לבנון', 'Lithuania': 'ליטא', 'Luxembourg': 'לוקסמבורג',
  'Malaysia': 'מלזיה', 'Maldives': 'האיים המלדיביים', 'Malta': 'מלטה', 'Mauritius': 'מאוריציוס',
  'Mexico': 'מקסיקו', 'Moldova': 'מולדובה', 'Monaco': 'מונקו', 'Montenegro': 'מונטנגרו',
  'Morocco': 'מרוקו', 'Myanmar': 'מיאנמר', 'Namibia': 'נמיביה', 'Nepal': 'נפאל',
  'Netherlands': 'הולנד', 'New Zealand': 'ניו זילנד', 'Nigeria': 'ניגריה',
  'North Macedonia': 'צפון מקדוניה', 'Norway': 'נורווגיה', 'Oman': 'עומאן', 'Pakistan': 'פקיסטן',
  'Panama': 'פנמה', 'Paraguay': 'פרגוואי', 'Peru': 'פרו', 'Philippines': 'הפיליפינים',
  'Poland': 'פולין', 'Portugal': 'פורטוגל', 'Puerto Rico': 'פורטו ריקו', 'Qatar': 'קטאר',
  'Romania': 'רומניה', 'Rwanda': 'רואנדה', 'Saudi Arabia': 'ערב הסעודית', 'Senegal': 'סנגל',
  'Serbia': 'סרביה', 'Singapore': 'סינגפור', 'Slovakia': 'סלובקיה', 'Slovenia': 'סלובניה',
  'South Africa': 'דרום אפריקה', 'South Korea': 'קוריאה הדרומית', 'Spain': 'ספרד',
  'Sri Lanka': 'סרי לנקה', 'Sweden': 'שוודיה', 'Switzerland': 'שווייץ', 'Taiwan': 'טאיוואן',
  'Tanzania': 'טנזניה', 'Thailand': 'תאילנד', 'Tunisia': 'תוניסיה', 'Türkiye': 'טורקיה',
  'Uganda': 'אוגנדה', 'Ukraine': 'אוקראינה', 'United Arab Emirates': 'איחוד האמירויות',
  'United Kingdom': 'בריטניה', 'United States': 'ארצות הברית', 'Uruguay': 'אורוגוואי',
  'Uzbekistan': 'אוזבקיסטן', 'Vietnam': 'וייטנאם', 'Zambia': 'זמביה', 'Zimbabwe': 'זימבבואה',
}

export const countryName = (english: string, locale: 'en' | 'he'): string =>
  locale === 'he' ? COUNTRY_HE[english] ?? english : english
