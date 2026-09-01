import { chromium } from 'playwright'

const OUT = new URL('.', import.meta.url).pathname
const BASE = 'http://localhost:3008'

const browser = await chromium.launch()
// iPhone 17 Pro Max: 1320×2868 px @3x → 440×956 CSS points (docs/DESIGN.md).
const ctx = await browser.newContext({
  viewport: { width: 440, height: 956 },
  deviceScaleFactor: 3, isMobile: true, hasTouch: true,
})
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

const shot = async (name) => {
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}${name}.png` })
  console.log('  shot:', name)
}
const scrollDown = async () => {
  await page.locator('.screen, .tg-screen').last().evaluate((el) => { el.scrollTop = el.scrollHeight }).catch(() => {})
  await page.waitForTimeout(250)
}
// a sheet's exit transition keeps the layer on top; clicks aimed through it
// land on whatever sits under the pointer in the sheet
const waitSheetGone = async () => {
  await page.locator('.tg-sheet-layer button').first().waitFor({ state: 'detached' }).catch(() => {})
  await page.waitForTimeout(600)
}

await page.goto(BASE, { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await shot('01-onboarding')

// ---- claim flow (mints a real subname under tange.eth) ----
await page.locator('button:has-text("Create wallet")').click()
await page.waitForTimeout(700)
await shot('02-name-wallet-empty')

const label = 'tangemdemo' + Math.floor(Math.random() * 9000 + 1000)
await page.locator('input[placeholder="yourname"]').fill(label)
await page.waitForTimeout(1800)
await shot('03-name-wallet-available')

await page.locator('button:has-text("Claim name")').click()
await page.waitForTimeout(8000)
await shot('04-name-claimed')
console.log('  LABEL:', label)

await page.locator('button:has-text("Continue")').click()
await page.waitForTimeout(900)
await shot('05-home-named')

// ---- Add & Manage -> Manage tokens ----
await page.locator('button:has-text("Add & Manage")').click()
await page.waitForTimeout(600)
await shot('06-add-manage')
await page.locator('button:has-text("Organize tokens")').click()
await page.waitForTimeout(700)
await shot('07-manage-tokens')
// clicks inside the open sheet must be scoped to the sheet layer, or they
// resolve to the home token row sitting underneath it
await page.locator('.tg-sheet-layer button:has-text("Ethereum")').first().click()
await page.waitForTimeout(600)
await shot('08-manage-tokens-expanded')
await page.getByRole('button', { name: 'Close' }).click()
await page.waitForTimeout(500)

// ---- token detail (home Ethereum row) -> receive -> transfer -> send ----
await page.locator('button:has-text("Ethereum")').first().click()
await page.waitForTimeout(800)
await shot('09-token-detail')
await page.locator('button:has-text("Receive")').first().click()
await page.waitForTimeout(1000)
await shot('10-receive')
await page.getByRole('button', { name: 'Close' }).click()
await waitSheetGone()
await page.locator('button:has-text("Transfer")').first().click()
await page.waitForTimeout(700)
await shot('11-transfer-sheet')
await page.locator('.tg-sheet-layer button:has-text("Send")').first().click()
await page.waitForTimeout(700)
await shot('12-send-empty')

// public-ENS path (ETH chain, so vitalik.eth has a coin-60 answer)
await page.locator('input[aria-label="Recipient"]').fill('vitalik.eth')
await page.waitForTimeout(3500)
await shot('13-send-resolved-ens')
await page.locator('input[aria-label="Amount"]').fill('0.25')
await page.waitForTimeout(400)
await page.locator('.btn--primary').click()
await page.waitForTimeout(1600)
await shot('14-send-review')
await page.locator('.btn--primary').click()
await page.waitForTimeout(2500)
await shot('15-send-done')
await page.locator('button:has-text("Done")').click()
await page.waitForTimeout(900)

// ---- choose token via Add funds (purpose buy) ----
await page.locator('button:has-text("Add funds")').first().click()
await page.waitForTimeout(700)
await shot('16-choose-token')
await page.getByRole('button', { name: 'Close' }).click()
await page.waitForTimeout(400)

// ---- details, add wallet, wallet detail, address book ----
await page.locator('button[aria-label="Details"]').click()
await page.waitForTimeout(700)
await shot('17-details')
await page.locator('button:has-text("Add Wallet")').click()
await page.waitForTimeout(600)
await shot('18-add-wallet')
await page.getByRole('button', { name: 'Close' }).click()
await page.waitForTimeout(400)
await page.locator('button:has-text("Address book")').first().click()
await page.waitForTimeout(800)
await shot('19-address-book')
await page.locator('button:has-text("Add contact")').first().click()
await page.waitForTimeout(600)
await page.locator('input').first().fill('tangemdemo9273.tange.eth')
await page.waitForTimeout(2500)
await shot('20-add-contact')
await page.getByRole('button', { name: 'Back' }).click()
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Back' }).click()
await page.waitForTimeout(600)
// wallet detail sits behind the wallets-group row in Details
await page.locator('button:has-text("Wallet")').first().click()
await page.waitForTimeout(800)
await shot('21-wallet-detail')

console.log('  ERRORS:', errors.length ? errors.slice(0, 6) : 'none')
await browser.close()