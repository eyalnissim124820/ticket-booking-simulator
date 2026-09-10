/**
 * Verifies every listing photo id still resolves on the Unsplash CDN.
 * Run with `npm run check:photos`. Needs outbound network access.
 */
import { PHOTO_IDS, stayPhotoUrl } from '../src/data/stayPhotos.ts'

const results = await Promise.all(
  PHOTO_IDS.map(async (id, i) => {
    const url = stayPhotoUrl(i, 0, 200)
    try {
      const res = await fetch(url, { method: 'HEAD', redirect: 'follow' })
      return { id, ok: res.ok, status: res.status }
    } catch (error) {
      return { id, ok: false, status: String(error.cause?.code ?? error.message) }
    }
  }),
)

const bad = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.id}  ${r.status}`)
console.log(`\n${results.length - bad.length}/${results.length} photo ids resolve.`)

if (bad.length) {
  console.log('\nReplace these ids in src/data/stayPhotos.ts:')
  for (const r of bad) console.log(`  ${r.id}`)
  process.exitCode = 1
}
