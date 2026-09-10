import { useEffect, useState } from 'react'
import { stayPhotoSources } from '../../data/stayPhotos'
import { PropertyArt } from './PropertyArt'

/**
 * A listing photograph, with the generated illustration as a standby.
 *
 * Photos come from the network, so any single source can fail — offline, a
 * blocked CDN, a service having a bad day. Rather than leave a hole in the grid
 * this walks the candidate sources in order and, if all of them fail, keeps the
 * seeded illustration, which always renders.
 */
export function StayImage({
  seed,
  variant = 0,
  width = 800,
  alt = '',
  eager = false,
}: {
  seed: number
  variant?: number
  width?: number
  alt?: string
  eager?: boolean
}) {
  const sources = stayPhotoSources(seed, variant, width)
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const key = `${seed}-${variant}-${width}`

  // A different listing starts the chain over.
  useEffect(() => {
    setAttempt(0)
    setLoaded(false)
  }, [key])

  const src = sources[attempt]
  const exhausted = attempt >= sources.length

  if (exhausted) return <PropertyArt seed={seed} variant={variant} />

  return (
    <>
      {/* The artwork sits underneath as the loading state, so nothing is ever blank. */}
      {!loaded && <PropertyArt seed={seed} variant={variant} />}
      <img
        className="stay-img"
        src={src}
        alt={alt}
        width={width}
        height={Math.round((width * 3) / 5)}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        data-loaded={loaded || undefined}
        onLoad={() => setLoaded(true)}
        onError={() => setAttempt((n) => n + 1)}
      />
    </>
  )
}
