/**
 * Checks that every listing photo source responds.
 * Run with `npm run check:photos`. Needs outbound network access.
 */
import { UNSPLASH_IDS, stayPhotoSources } from '../src/data/stayPhotos.ts'

// One sample per source tier, plus every pinned Unsplash id if any are set.
const samples = stayPhotoSources(0, 0, 400).map((url, tier) => ({ label: `tier ${tier + 1}`, url }))
const pinned = UNSPLASH_IDS.map((id, i) => ({ label: `unsplash ${id}`, url: stayPhotoSources(i, 0, 400)[0] }))

const results = await Promise.all(
  [...samples, ...pinned].map(async ({ label, url }) => {
    try {
      const res = await fetch(url, { redirect: 'follow' })
      return { label, url, ok: res.ok, status: res.status }
    } catch (error) {
      return { label, url, ok: false, status: String(error.cause?.code ?? error.message) }
    }
  }),
)

for (const r of results) console.log(`${r.ok ? 'ok  ' : 'FAIL'}  ${r.label.padEnd(22)} ${r.status}  ${r.url}`)

const bad = results.filter((r) => !r.ok)
console.log(`\n${results.length - bad.length}/${results.length} sources respond.`)
if (bad.length === results.length) {
  console.log('Nothing responded — listings will show generated artwork.')
  process.exitCode = 1
}
