import type { BrandColors } from './types'

/**
 * CSS custom properties the layout injects from `brand.colors`.
 * Geometry, type, and radius stay in src/app/globals.css — those are the kit's
 * UX, not a brand. Colour is the only thing a preset is allowed to retune.
 */
export function brandColorCss(colors: BrandColors): string {
  return `:root {
  --accent: ${colors.accent};
  --accent-soft: ${colors.accentSoft};
  --text-1: ${colors.text1};
  --icon-ink: ${colors.iconInk};
  --track-on: ${colors.trackOn};
  --price-up: ${colors.priceUp};
  --price-down: ${colors.priceDown};
  --wash-core: ${colors.washCore};
  --wash-edge: ${colors.washEdge};
}`
}
