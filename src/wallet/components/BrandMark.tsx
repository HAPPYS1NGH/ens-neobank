'use client'

import { brand } from '@config'

/**
 * Header mark. A real SVG in `brand.logo.src` wins; otherwise a letter chip
 * from `shortName`. Colour follows `--text-1` / `--text-on-dark`, so a preset
 * swap retints it without touching this file.
 */
export function BrandMark({
  size = 22,
  className,
}: {
  size?: number
  className?: string
}) {
  if (brand.logo.src) {
    return (
      // Brand assets are expected to already be the right colour, or to use
      // currentColor when inlined. <img> cannot inherit currentColor.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logo.src}
        alt={brand.logo.alt}
        width={size}
        height={size}
        className={className}
        style={{ objectFit: 'contain' }}
      />
    )
  }

  return (
    <span
      className={className}
      aria-label={brand.logo.alt}
      role="img"
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: 'var(--text-1)',
        color: 'var(--text-on-dark)',
        display: 'grid',
        placeItems: 'center',
        fontSize: Math.round(size * 0.48),
        fontWeight: 700,
        letterSpacing: '-0.04em',
        lineHeight: 1,
        flex: 'none',
      }}
    >
      {brand.shortName.slice(0, 1).toUpperCase()}
    </span>
  )
}
