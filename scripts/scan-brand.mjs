/**
 * Scans a product website for the brand inputs a neobank fork needs: name,
 * square mark, colours, fonts, headline copy, and phone/desktop screenshots.
 *
 *   node scripts/scan-brand.mjs https://bank.example            # prints JSON
 *   import { scanBrand } from './scan-brand.mjs'                # used by neobank-setup
 *
 * Everything lands in brand-scan/<slug>/ (gitignored). The scan is a starting
 * point, not the answer: colours come from computed styles, which a cookie
 * banner or a bot wall can skew. The agent checks the screenshots before
 * trusting a value.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const SECOND_LEVEL = new Set(['co', 'com', 'org', 'net', 'gov', 'ac', 'edu'])

/** `app.monzo.com` → `monzo`, `bank.co.uk` → `bank`. */
export function slugFromUrl(url) {
  const parts = new URL(url).hostname.replace(/^www\./, '').split('.')
  let label = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
  if (parts.length >= 3 && SECOND_LEVEL.has(label)) label = parts[parts.length - 3]
  return label.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'
}

// Runs in the page. Collects raw signals; ranking happens in Node.
function collectInPage() {
  const meta = (sel) => document.querySelector(sel)?.getAttribute('content')?.trim() || null
  const abs = (href) => (href ? new URL(href, location.href).href : null)
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && Number(s.opacity) > 0.1
  }

  const icons = [...document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="mask-icon"]')].map((l) => ({
    rel: l.getAttribute('rel'),
    href: abs(l.getAttribute('href')),
    sizes: l.getAttribute('sizes'),
    type: l.getAttribute('type'),
  }))

  // Button and link fills, weighted by area so the hero CTA outvotes a chip.
  const fills = []
  const controls = document.querySelectorAll('button, [role="button"], a[class*="btn" i], a[class*="button" i], a[class*="cta" i], input[type="submit"]')
  for (const el of controls) {
    if (!visible(el)) continue
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    fills.push({ bg: s.backgroundColor, fg: s.color, area: Math.round(r.width * r.height), text: el.textContent.trim().slice(0, 40) })
  }
  const links = [...document.querySelectorAll('a')].filter(visible).slice(0, 200).map((a) => getComputedStyle(a).color)

  // Every painted surface in the first few screens, weighted by area. Catches a
  // brand colour that lives in section backgrounds or svg art, not in buttons.
  const surfaces = {}
  const limit = innerHeight * 3
  for (const el of [...document.body.querySelectorAll('*')].slice(0, 4000)) {
    const r = el.getBoundingClientRect()
    if (r.top > limit || r.width < 8 || r.height < 8 || !visible(el)) continue
    const s = getComputedStyle(el)
    const area = Math.min(r.width * r.height, innerWidth * innerHeight)
    const isSvgShape = el instanceof SVGElement && el.tagName.toLowerCase() !== 'svg'
    const paint = isSvgShape ? s.fill : s.backgroundColor
    if (paint && !paint.startsWith('url')) surfaces[paint] = (surfaces[paint] ?? 0) + Math.round(area)
  }

  // :root custom properties that hold a colour. Cross-origin sheets throw; skip them.
  const cssVars = {}
  for (const sheet of document.styleSheets) {
    let rules
    try { rules = sheet.cssRules } catch { continue }
    for (const rule of rules) {
      if (!(rule instanceof CSSStyleRule) || !/(^|,)\s*(:root|html|body)\b/.test(rule.selectorText)) continue
      for (const prop of rule.style) {
        if (!prop.startsWith('--')) continue
        const value = rule.style.getPropertyValue(prop).trim()
        if (/^(#[0-9a-f]{3,8}|rgba?\(|hsla?\(|oklch\()/i.test(value)) cssVars[prop] = value
      }
    }
  }

  // Header logo: an svg or img inside the header, a home link, or anything named logo.
  const logoEls = [
    ...document.querySelectorAll('header a[href="/"] svg, header a[href="/"] img, a[href="/"] svg, a[href="/"] img, [class*="logo" i] svg, [class*="logo" i] img, img[alt*="logo" i], header svg, header img'),
  ].filter(visible)
  const logoEl = logoEls[0] || null
  const logoBox = logoEl?.getBoundingClientRect()
  const wordmark = logoEl
    ? {
        kind: logoEl.tagName.toLowerCase() === 'svg' ? 'svg' : 'img',
        src: logoEl.tagName.toLowerCase() === 'img' ? abs(logoEl.currentSrc || logoEl.getAttribute('src')) : null,
        svg: logoEl.tagName.toLowerCase() === 'svg' ? logoEl.outerHTML : null,
        color: getComputedStyle(logoEl).color,
        width: Math.round(logoBox.width),
        height: Math.round(logoBox.height),
      }
    : null

  const font = (sel) => {
    const el = document.querySelector(sel)
    return el ? getComputedStyle(el).fontFamily : null
  }
  const header = document.querySelector('header, nav')
  const headings = [...document.querySelectorAll('h1, h2')].filter(visible).slice(0, 6).map((h) => h.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean)

  return {
    url: location.href,
    title: document.title.trim(),
    siteName: meta('meta[property="og:site_name"]') || meta('meta[name="application-name"]') || meta('meta[name="apple-mobile-web-app-title"]'),
    description: meta('meta[name="description"]') || meta('meta[property="og:description"]'),
    themeColor: meta('meta[name="theme-color"]'),
    ogImage: abs(meta('meta[property="og:image"]')),
    manifest: abs(document.querySelector('link[rel="manifest"]')?.getAttribute('href')),
    icons,
    fills,
    links,
    surfaces,
    cssVars,
    wordmark,
    colors: {
      bodyBg: getComputedStyle(document.body).backgroundColor,
      bodyText: getComputedStyle(document.body).color,
      headerBg: header ? getComputedStyle(header).backgroundColor : null,
      h1: document.querySelector('h1') ? getComputedStyle(document.querySelector('h1')).color : null,
    },
    fonts: { body: font('body'), heading: font('h1'), button: font('button') },
    headings,
  }
}

// Cookie banners cover the screenshot and add their buttons to the colour vote.
// Prefer declining; only a banner with no decline option is left in place.
async function dismissCookieBanner(page) {
  const decline = page.getByRole('button', { name: /^(reject all|reject|decline( all)?|only (necessary|essential)|necessary only|deny)( cookies)?$/i })
  if (await decline.first().isVisible().catch(() => false)) {
    await decline.first().click({ timeout: 2000 }).catch(() => {})
    await page.waitForTimeout(600)
  }
}

async function fetchJson(url) {
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } })
    return res.ok ? await res.json() : null
  } catch {
    return null
  }
}

/**
 * @param {string} url  product website
 * @param {{ outDir?: string }} [opts]
 * @returns {Promise<object>} raw scan, also written to <outDir>/scan.json
 */
export async function scanBrand(url, { outDir } = {}) {
  const slug = slugFromUrl(url)
  const dir = outDir ?? join('brand-scan', slug)
  mkdirSync(dir, { recursive: true })

  const browser = await chromium.launch()
  const scan = { input: url, slug, scannedAt: new Date().toISOString(), errors: [] }
  try {
    const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, userAgent: UA })
    const page = await desktop.newPage()
    try {
      const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
      await page.waitForTimeout(1500)
      if (res && res.status() >= 400) scan.errors.push(`site answered HTTP ${res.status()}; the scan may be a bot wall`)
      await dismissCookieBanner(page)
      Object.assign(scan, await page.evaluate(collectInPage))
      await page.screenshot({ path: join(dir, 'desktop.png') })
    } catch (err) {
      scan.errors.push(`desktop scan failed: ${err.message.split('\n')[0]}`)
    }

    const phone = await browser.newContext({
      viewport: { width: 440, height: 956 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
      userAgent: UA.replace('Macintosh; Intel Mac OS X 10_15_7', 'iPhone; CPU iPhone OS 18_0 like Mac OS X') + ' Mobile',
    })
    const mobile = await phone.newPage()
    try {
      await mobile.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 })
      await mobile.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
      await mobile.waitForTimeout(1500)
      await dismissCookieBanner(mobile)
      await mobile.screenshot({ path: join(dir, 'mobile.png') })
      await mobile.screenshot({ path: join(dir, 'mobile-full.png'), fullPage: true, clip: { x: 0, y: 0, width: 440, height: 4000 } }).catch(() => {})
    } catch (err) {
      scan.errors.push(`mobile screenshot failed: ${err.message.split('\n')[0]}`)
    }
  } finally {
    await browser.close()
  }

  if (scan.manifest) scan.manifestJson = await fetchJson(scan.manifest)
  writeFileSync(join(dir, 'scan.json'), JSON.stringify(scan, null, 2))
  return scan
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.argv[2]
  if (!url) {
    console.error('usage: node scripts/scan-brand.mjs <https://product.site>')
    process.exit(1)
  }
  const scan = await scanBrand(url)
  console.log(JSON.stringify(scan, null, 2))
}
