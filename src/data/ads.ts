/**
 * Ad breaks.
 *
 * The creative below is a stand-in for a real advertiser, shown so the run has
 * the interruptions a free consumer site actually has. It is not localised, and
 * that is on purpose: an advertiser's own name and copy arrive in whatever
 * language they were written in, whichever language the surrounding page is in.
 * The chrome around it — the "advertisement" label, the close button, the
 * disclaimer — goes through the message catalogue like everything else.
 *
 * Images are hotlinked rather than vendored, matching the stay photography.
 * Any of them can therefore fail, so the panel walks past the ones that do and
 * falls back to a plain brand card if none of them load.
 */

export interface AdImage {
  src: string
  alt: string
}

export interface AdCreative {
  /** Written in the advertiser's own language, hence the explicit direction. */
  lang: 'he' | 'en'
  dir: 'rtl' | 'ltr'
  advertiser: string
  headline: string
  body: string
  cta: string
  images: AdImage[]
}

export const KITCHEN_AD: AdCreative = {
  lang: 'he',
  dir: 'rtl',
  advertiser: 'מאיר מטבחים וארונות',
  headline: 'מטבח שנבנה בדיוק סביבכם',
  body: 'תכנון, ייצור והתקנה בהתאמה אישית — מטבחים, ארונות קיר ופתרונות אחסון.',
  cta: 'לקבלת הצעת מחיר',
  images: [
    {
      src: 'https://www.regba.co.il/wp-content/uploads/2025/04/krp_5093-edit_optimized-1-scaled.jpg',
      alt: 'מטבח בהתאמה אישית',
    },
    {
      src: 'https://arredo-line.com/wp-content/uploads/2020/11/%D7%9E%D7%98%D7%91%D7%97%D7%99%D7%9D-%D7%9E%D7%A2%D7%95%D7%A6%D7%91%D7%99%D7%9D-%D7%9C%D7%90%D7%AA%D7%A816-1024x768.jpg',
      alt: 'מטבח מעוצב',
    },
    {
      src: 'https://www.ledyilighting.com/wp-content/uploads/2024/06/Mix-Up-Your-Fixtures.jpg',
      alt: 'תאורת מטבח',
    },
    {
      src: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSV9tb9iLRsOkEEDdrL3TdxvWtVfiSepBdxDHO7_DJvhoXVkPDLpjksRhkL&s=10',
      alt: 'ארונות מטבח',
    },
  ],
}

/** Warms the browser cache so a break opens on a photograph, not on a gap. */
export function prefetchAdImages(creative: AdCreative) {
  for (const image of creative.images) {
    const img = new Image()
    img.decoding = 'async'
    img.src = image.src
  }
}
