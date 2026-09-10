/**
 * Photographs used for stay listings.
 *
 * Source: Unsplash (https://unsplash.com/s/photos/hotel-rooms), served from the
 * Unsplash image CDN. The Unsplash License permits free use, including
 * commercially, without attribution.
 *
 * These are plain CDN URLs — no API key, no SDK. To swap the set, replace the
 * ids below with the id segment of any Unsplash photo URL: a photo page at
 * `unsplash.com/photos/<slug>-<id>` is served as
 * `images.unsplash.com/photo-<id>`.
 *
 * Run `npm run check:photos` to confirm every id here still resolves; it prints
 * any that fail so they can be replaced. Listings fall back to generated
 * artwork whenever an image does not load, so a dead id degrades quietly
 * rather than leaving a hole in the grid.
 */
const PHOTO_IDS = [
  '1566073771259-6a8506099945',
  '1611892440504-42a792e24d32',
  '1590490360182-c33d57733427',
  '1631049307264-da0ec9d70304',
  '1618773928121-c32242e63f39',
  '1582719478250-c89cae4dc85b',
  '1571003123894-1f0594d2b5d9',
  '1596394516093-501ba68a0ba6',
  '1560448204-e02f11c3d0e2',
  '1522708323590-d24dbb6b0267',
  '1578683010236-d716f9a3f461',
  '1584132967334-10e028bd69f7',
  '1445019980597-93fa8acb246c',
  '1551882547-ff40c63fe5fa',
  '1520250497591-112f2f40a3f4',
  '1540518614846-7eded433c457',
  '1505693416388-ac5ce068fe85',
  '1616594039964-ae9021a400a0',
  '1587985064135-0366536eab42',
  '1568495248636-6432b97bd949',
  '1512918728675-ed5a9ecdebfd',
  '1598928506311-c55ded91a20c',
  '1615874959474-d609969a20ed',
  '1590073242678-70ee3fc28e8e',
  '1580041065738-e72023775cdc',
  '1566665797739-1674de7a421a',
  '1517840901100-8179e982acb7',
  '1455587734955-081b22074882',
  '1549638441-b787d2e11f14',
  '1611048267451-e6ed903d4a38',
  '1591088398332-8a7791972843',
  '1528697203043-733bfdca5c9e',
  '1631049421450-49dd0e5b0b90',
  '1560185007-cde436f6a4d0',
  '1559599189-fe84dea4eb79',
  '1521783988139-89397d761dce',
]

export const STAY_PHOTO_COUNT = PHOTO_IDS.length

/** A cropped, auto-formatted CDN URL at the size the layout actually needs. */
export function stayPhotoUrl(seed: number, variant = 0, width = 800): string {
  const id = PHOTO_IDS[Math.abs(seed + variant * 7) % PHOTO_IDS.length]
  const height = Math.round((width * 3) / 5)
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=entropy&w=${width}&h=${height}&q=75`
}

export { PHOTO_IDS }
