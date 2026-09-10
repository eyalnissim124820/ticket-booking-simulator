import { useEffect, useState } from 'react'
import { stayPhotoUrl } from '../../data/stayPhotos'
import { PropertyArt } from './PropertyArt'

/**
 * A listing photograph, with the generated illustration as a standby.
 *
 * The photos are remote, so any of them can fail — offline, a blocked CDN, a
 * retired id. Rather than leave a hole in the grid, a failed load falls back to
 * the same seeded artwork the app used before, which always renders.
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
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const src = stayPhotoUrl(seed, variant, width)

  // A new listing means a new photo: clear the previous outcome.
  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [src])

  if (failed) return <PropertyArt seed={seed} variant={variant} />

  return (
    <>
      {/* The artwork sits underneath as the loading state, so the card is never blank. */}
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
        onError={() => setFailed(true)}
      />
    </>
  )
}
