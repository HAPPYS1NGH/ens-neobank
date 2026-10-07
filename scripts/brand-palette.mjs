/**
 * Turns a raw site scan (scripts/scan-brand.mjs) into `BrandColors`.
 *
 * The kit is a light UI, so only the accent and ink are taken from the site.
 * Everything else is derived from them: soft chip, balance bloom, toggle track.
 * Each pick records where it came from so the agent can check it against the
 * screenshots instead of trusting it blind.
 */

const FALLBACK = {
  accent: '#4396f7',
  text1: '#1e1e1e',
  priceDown: '#eb483f',
  washEdge: '#f4f4f4',
  themeColor: '#ffffff',
}
const PRICE_UP_GREEN = '#16bb7a'

/** Parses #rgb, #rrggbb, #rrggbbaa, rgb(), rgba(). Returns null for anything else or near-transparent. */
export function parseColor(value) {
  if (!value || typeof value !== 'string') return null
  const v = value.trim().toLowerCase()
  let hex = v.match(/^#([0-9a-f]{3,8})$/)?.[1]
  if (hex) {
    if (hex.length === 3 || hex.length === 4) hex = [...hex].map((c) => c + c).join('')
    const alpha = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    if (alpha < 0.5) return null
    return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16))
  }
  const rgb = v.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+%?))?\s*\)$/)
  if (!rgb) return null
  const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? parseFloat(rgb[4]) / 100 : parseFloat(rgb[4])
  if (alpha < 0.5) return null
  return [rgb[1], rgb[2], rgb[3]].map((n) => Math.round(Number(n)))
}

export const toHex = ([r, g, b]) => '#' + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')).join('')

const mix = (a, b, t) => a.map((n, i) => n + (b[i] - n) * t)

function saturation([r, g, b]) {
  const max = Math.max(r, g, b) / 255
  const min = Math.min(r, g, b) / 255
  const l = (max + min) / 2
  if (max === min) return 0
  return (max - min) / (1 - Math.abs(2 * l - 1))
}

function hue([r, g, b]) {
  const max = Math.max(r, g, b)
  const d = max - Math.min(r, g, b)
  if (d === 0) return 0
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return (h * 60 + 360) % 360
}

function luminance(rgb) {
  const [r, g, b] = rgb.map((n) => {
    const c = n / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/** Unstyled link colours. A site that never set them has not chosen them. */
const BROWSER_LINK_DEFAULTS = new Set(['#0000ee', '#551a8b', '#0000ff', '#ff0000'])

/** A brand colour, not a grey and not a near-white/near-black. */
const isBrandy = (rgb) => saturation(rgb) > 0.3 && luminance(rgb) > 0.02 && luminance(rgb) < 0.85

function pickAccent(scan) {
  // Biggest saturated button fill wins: on a bank site that is the "Open account" CTA.
  const byColour = new Map()
  for (const fill of scan.fills ?? []) {
    const rgb = parseColor(fill.bg)
    if (!rgb || !isBrandy(rgb)) continue
    const hex = toHex(rgb)
    byColour.set(hex, (byColour.get(hex) ?? 0) + fill.area)
  }
  const topFill = [...byColour.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topFill) return { hex: topFill[0], source: 'largest saturated button fill' }

  for (const [value, source] of [
    [scan.themeColor, 'meta theme-color'],
    [scan.manifestJson?.theme_color, 'web manifest theme_color'],
  ]) {
    const rgb = parseColor(value)
    if (rgb && isBrandy(rgb)) return { hex: toHex(rgb), source }
  }

  const surface = Object.entries(scan.surfaces ?? {})
    .map(([value, area]) => [parseColor(value), area])
    .filter(([rgb]) => rgb && isBrandy(rgb))
    .sort((a, b) => b[1] - a[1])[0]
  if (surface) return { hex: toHex(surface[0]), source: 'largest saturated surface on the page' }

  const linkCounts = new Map()
  for (const value of scan.links ?? []) {
    const rgb = parseColor(value)
    if (!rgb || !isBrandy(rgb) || BROWSER_LINK_DEFAULTS.has(toHex(rgb))) continue
    const hex = toHex(rgb)
    linkCounts.set(hex, (linkCounts.get(hex) ?? 0) + 1)
  }
  const topLink = [...linkCounts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (topLink) return { hex: topLink[0], source: 'most common saturated link colour' }

  const cssVar = Object.entries(scan.cssVars ?? {}).find(([name, value]) => /primary|brand|accent/i.test(name) && parseColor(value) && isBrandy(parseColor(value)))
  if (cssVar) return { hex: toHex(parseColor(cssVar[1])), source: `css variable ${cssVar[0]}` }

  return { hex: FALLBACK.accent, source: 'fallback (no brand colour found on the site)' }
}

function pickInk(scan) {
  // text1 is also the primary button fill, so a dark CTA (navy, ink) is the best source.
  const darkFill = (scan.fills ?? [])
    .map((fill) => ({ rgb: parseColor(fill.bg), area: fill.area }))
    .filter(({ rgb }) => rgb && luminance(rgb) < 0.06)
    .sort((a, b) => b.area - a.area)[0]
  if (darkFill) return { hex: toHex(darkFill.rgb), source: 'largest dark button fill' }

  for (const [value, source] of [
    [scan.colors?.h1, 'h1 colour'],
    [scan.colors?.bodyText, 'body text colour'],
  ]) {
    const rgb = parseColor(value)
    // Ink must read on the kit's light surfaces; a dark-mode site's white text cannot.
    if (rgb && luminance(rgb) < 0.06) return { hex: toHex(rgb), source }
  }
  return { hex: FALLBACK.text1, source: 'fallback (site ink is not dark enough for a light UI)' }
}

/**
 * @returns {{ colors: Record<string,string>, sources: Record<string,string>, warnings: string[] }}
 */
export function derivePalette(scan) {
  const accent = pickAccent(scan)
  const ink = pickInk(scan)
  const accentRgb = parseColor(accent.hex)
  const inkRgb = parseColor(ink.hex)
  const white = [255, 255, 255]
  const redHued = hue(accentRgb) < 25 || hue(accentRgb) > 335

  const colors = {
    accent: accent.hex,
    accentSoft: toHex(mix(accentRgb, white, 0.9)),
    text1: ink.hex,
    iconInk: toHex(mix(inkRgb, [0, 0, 0], 0.5)),
    trackOn: ink.hex,
    // A red brand cannot also mean "up" next to a red priceDown.
    priceUp: redHued ? PRICE_UP_GREEN : accent.hex,
    priceDown: FALLBACK.priceDown,
    washCore: toHex(mix(accentRgb, white, 0.65)),
    washEdge: FALLBACK.washEdge,
    themeColor: FALLBACK.themeColor,
  }

  const warnings = []
  const onWhite = contrast(accentRgb, white)
  if (onWhite < 3) {
    warnings.push(
      `accent ${accent.hex} has ${onWhite.toFixed(1)}:1 contrast on white; links and network tags will be hard to read. Use a darker shade of the brand for \`accent\`.`,
    )
  }
  if (redHued) warnings.push(`accent ${accent.hex} is red-hued, so priceUp is green ${PRICE_UP_GREEN} to stay distinct from priceDown.`)
  if (accent.source.startsWith('fallback')) warnings.push('no brand colour found; accent is the kit default. Sample it from the screenshots.')

  return { colors, sources: { accent: accent.source, text1: ink.source }, warnings }
}
