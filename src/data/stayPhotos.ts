/**
 * Photographs for stay listings.
 *
 * Each listing resolves to an ordered list of candidate URLs and uses the first
 * that loads, falling back to generated artwork if none do. The default sources
 * need no API key and, importantly, no per-photo id: the URL itself asks for a
 * photo, so there is nothing that can go stale or 404.
 *
 *   1. LoremFlickr — real Flickr photos matching `hotel,room,interior`, pinned
 *      per listing with `lock` so a property always shows the same room.
 *   2. Lorem Picsum — Unsplash photography, seeded per listing. Keyless and very
 *      stable; the safety net when the tagged source is unavailable.
 *
 * To pin specific Unsplash photographs instead, paste their ids into
 * UNSPLASH_IDS below — an id is the last segment of an Unsplash photo URL
 * (`unsplash.com/photos/<slug>-<id>` is served as `images.unsplash.com/photo-<id>`).
 * Anything listed there is tried first. Verify ids with `npm run check:photos`
 * before relying on them; an id that does not resolve just costs a wasted
 * request before the next source takes over.
 */

/** Verified Unsplash ids, tried ahead of the keyless sources. Empty by default. */
export const UNSPLASH_IDS: string[] = []

const tagged = (width: number, height: number, lock: number) =>
  `https://loremflickr.com/${width}/${height}/hotel,room,interior?lock=${lock}`

const seeded = (width: number, height: number, lock: number) =>
  `https://picsum.photos/seed/elibaba${lock}/${width}/${height}`

const unsplash = (id: string, width: number, height: number) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&crop=entropy&w=${width}&h=${height}&q=75`

/** Candidate URLs for one listing image, best first. */
export function stayPhotoSources(seed: number, variant = 0, width = 800): string[] {
  const height = Math.round((width * 3) / 5)
  const lock = Math.abs(Math.round(seed) + variant * 7) % 10000
  const pinned = UNSPLASH_IDS.length
    ? [unsplash(UNSPLASH_IDS[lock % UNSPLASH_IDS.length], width, height)]
    : []
  return [...pinned, tagged(width, height, lock), seeded(width, height, lock)]
}
