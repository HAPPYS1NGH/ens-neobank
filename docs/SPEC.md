# Tangem × ENS subnames — build spec

Read this whole file before writing code. Every agent working on this repo shares it.

## What we are building

A working clone of the **Tangem iOS wallet (6.2)** in which **naming a wallet issues a real
ENS subname** under `tange.eth`. The name is claimed at the moment the user names their
wallet — the field Tangem already has — with no extra screen, no wallet connection, and no
separate claim flow.

Names are live on Ethereum mainnet. Everything else (balances, prices, transfers) is
simulated.

### The argument

Tangem's home screen puts a wallet label directly under the balance: `$0.00` / **`Wallet ☁️`**.
Today that string is a local device label — it means nothing off the phone and nobody else
can use it. This demo makes it a subname instead.

Four places in the existing UI change:

| Screen | Today | Here |
|---|---|---|
| Onboarding, after *Create wallet* | Wallet is auto-named `Wallet` | The name field claims `harpreet.tange.eth` |
| Home | `Wallet ☁️` under the balance | `harpreet.tange.eth`, still under the balance |
| Manage tokens | Toggling `BASE MAIN L2` adds a local account | …and writes that chain's address record onto the same name |
| Receive assets | `0x98EEc6E5bE5FcF8D4027Aa7058bc24c4e2007597` | The name, with the address one tap away |
| Send | Paste a hex address | Type `alice`, or any ENS name; it resolves per chain |
| Details → Address book | Contacts stored as hex | Contacts stored as ENS names, resolved live |

**One name, every chain.** The wallet gets one name at creation, minted bare — with no
address records. Every network the user toggles on in *Manage tokens* then writes that
chain's address onto the same name, so a single `harpreet.tange.eth` gains BTC, ETH, Base,
Optimism, Arbitrum and Solana as the user enables them.

Rules the UI enforces (deliberate departures from the real app, documented in the README):

- **Every wallet gets a name by default.** The onboarding name step cannot be completed
  with an empty field — the button stays disabled. Leaving without one is possible, but it
  takes ticking *Continue without a name*, because a blank field is far more often someone
  skipping past the step than someone declining it.
- **The name is claimed once per wallet.** Tangem allows several wallets (one mobile, many
  hardware cards). Each is a separate identity and gets its own name; the *Add Wallet* sheet
  routes into the same name step.
- **Networks join the name, they do not fork it.** Toggling a network on writes an address
  record. Toggling it off does not delete the record — the README says why.

## Parent name

`tange.eth` — confirmed by the repo owner as the parent they control. It is **not**
`tangem.eth`. Do not "correct" it anywhere. It appears in `ALLOWED_PARENTS` in
`src/server/config.ts`; the server refuses to start with any other parent.

Because the parent is `tange.eth` rather than the exact brand string, the README must state
plainly that names read `label.tange.eth`, and no screen may render a fake `…tangem.eth`.
Show the real name everywhere.

## Design tokens — sampled from the reference pixels

Reference screenshots live in `reference/screens/`, all `1320 × 2868` (iPhone 17 Pro Max,
440 × 956 CSS pt @3x). Sample the pixels; do not guess from Tangem's marketing site.

Confirmed so far:

| Token | Value | Where |
|---|---|---|
| Accent blue | `#4396F7` | `+` icons, `Terms of service`, `MAIN` / `MAIN L2` network tags, `Buy Tangem Wallet`, **and price-up arrows — there is no green anywhere**; price-down is `#EB483F` |
| Ink / primary button | `#1E1E1E` | `Create wallet` and `Save` buttons, primary text |
| Icon ink | `#0F0F0F` | Glyphs and the Tangem mark (official token `neutral.95`; `#1E1E1E` was an antialiased-edge sample) |
| Secondary button | `#EBEBEB` | `Import existing wallet` |
| Sheet background | `#F4F4F4` | `Manage tokens`, `Choose token`, `Add & Manage` |
| Field fill | `#DEDEDE` | Search inputs inside sheets |
| Card | `#FFFFFF` | Token rows, list groups |
| Bottom bar | `#E8E8E8` | The `Crypto, news and more` dock |
| Home wash | radial `#B5BAE7` → `#F4F4F4` | The lavender bloom behind the balance; scrim over it is flat `rgba(0,0,0,0.71)`, no blur |
| Toggle | 50 × 22, knob 18 | Custom, not the iOS switch; on `#1E1E1E`, off `#C5C5C7` |

The full audited set lives in `docs/DESIGN.md`. Two subtleties recorded there: the balance
two-tone is **size only** (`$0` and `.00` are the same ink), and text sitting on the wash is
translucent black, not the page ink.

Fill in the rest (text greys, the red/blue price-change pair, BTC orange, Base blue,
toggle track colours, corner radii, type scale) by sampling. Record everything you sample
in `docs/DESIGN.md` with the source image and coordinate, so the numbers are auditable.

## Theme

**Light only.** `IMG_4307` and `IMG_4308` (the *Details* screens) were shot at night with
iOS auto-dark on — they are the same screens in the other theme, not a different design.
Recolour them to light using the token table above. There is no dark theme in this build.

## Screens to build

| # | Screen | Reference | Notes |
|---|---|---|---|
| 1 | Create Mobile Wallet (onboarding) | `IMG_4295` | Three feature rows, `Import existing wallet` + `Create wallet`, terms line |
| 2 | **Name your wallet** | new | The claim. Live availability, normalized label preview, `Continue without a name` |
| 3 | **Name claimed** | new | Confirmation, the full name, what it now receives |
| 4 | Home | `IMG_4296`, `IMG_4306` | Balance, wallet name, Add funds / Swap / Transfer, promo card, token list, `Add & Manage` pill, bottom dock |
| 5 | Add & Manage sheet | `IMG_4300` | `Add tokens` / `Organize tokens` |
| 6 | Manage tokens | `IMG_4302`, `IMG_4303`, `IMG_4304`, `IMG_4305` | Expandable coins → per-network toggles, `Add custom token`, sticky `Save` |
| 7 | Choose account | `IMG_4301` | `Wallet · 2 tokens · $0.00` + Cancel |
| 8 | Choose token | `IMG_4297` | Regional-restriction notice, `In your portfolio`, bottom search |
| 9 | Transfer sheet | `IMG_4298` | Asset header, Send / Swap / Swap & Send / Sell rows |
| 10 | Token detail | `IMG_4299` (behind the sheet) | `Ethereum` / `Main network`, total balance, `Quick top up` chips, `Buy` row |
| 11 | Receive assets | `IMG_4299` | Name first, address second, `Show QR code`, Copy / Share, wrong-network warning |
| 12 | **Send** | new | Recipient field that resolves names, per-chain |
| 13 | Send review + sent | new | |
| 14 | Details | `IMG_4307` (recolour to light) | WalletConnect, Address book, Wallets group, Buy Tangem Wallet, App settings, support, socials, version |
| 15 | Add wallet sheet | `IMG_4308` (recolour) | `Add hardware wallet` / `Add mobile wallet` |
| 16 | Wallet detail / rename | new | Shows the claimed name; renaming an unnamed wallet claims one |
| 17 | **Address book** | new | Contacts stored as ENS names, resolved live, badged `ENS` |

Bold rows have no screenshot. Build them from Tangem's surrounding visual language — same
radii, same row heights, same button shapes — not from invention.

## Chain set

Tangem's *Manage tokens* list, in order: Bitcoin, Ethereum, Tether, BNB, XRP, USDC, Solana,
TRON, Hyperliquid, Dogecoin, Zcash. Ethereum expands to `ETHEREUM MAIN`, `ARBITRUM NOVA`,
`ARBITRUM ONE`, `AURORA`, `BASE`, `BLAST`, `CYBER`, `LINEA` (and more below the fold), each
`MAIN L2`-tagged. BNB expands to `BNB SMART CHAIN`, `BNB BEACON CHAIN`, `ETHEREUM ERC20`.
Solana expands to `SOLANA MAIN`.

The writable set is whatever the Namespace registry accepts — see `src/lib/chains.ts`,
inherited from the D'CENT build and already carrying the hard-won notes. Networks the
registry cannot hold (XRP, coin type 144) stay **visible and honest**, shown with the reason,
never hidden.

## Architecture

Inherited wholesale from the D'CENT demo at `../dcent`, which is proven. Two API routes hold
the key; everything else is a client-side wallet.

```
src/
  server/          API-key side. Nothing here reaches the browser.
    config.ts        env + ENSIP-15 parent normalization + allowlist guard  [already ported]
    namespace.ts     the SDK wrapper — mint, read, and read-merge-write     [already ported]
    proof.ts         signature check that replaces a session layer          [already ported]
    resolve.ts       the two-path resolver — our registry, or public ENS    [already ported]
    validation.ts    label normalization and reserved names                 [already ported]
    http.ts          response envelope; 5xx redacted to a request id        [already ported]
  lib/
    chains.ts        chains, with written vs. publicly-read coin types      [needs Tangem set]
    keys.ts          deterministic demo keys derived from one stored seed   [already ported]
    format.ts        display formatting                                     [needs Tangem style]
    assets.ts        asset metadata
  wallet/            the app: store, api client, screens, components
  app/api/subnames/  availability · mint · add-address · read
  app/api/resolve/   resolve anything the Send field accepts
```

Copy the four API routes from `../dcent/src/app/api/` unchanged unless a Tangem screen needs
something they do not expose.

### Things that will bite you — carried over from the D'CENT build, all verified

- **`updateSubname` is a full-replace upsert.** Any record left out of the request is
  cleared. `addAddress` in `src/server/namespace.ts` reads current state and re-sends
  everything it means to keep. Route every write through it.
- **Availability is inverted.** `GET /api/v1/subnames/{full}` returns **404 when the name is
  free** and 200 when taken.
- **The EVM fallback record is ours.** Coin `2147483648` is written at mint time so the name
  resolves on EVM chains added later. The merge path must recognise it or it fails closed on
  the second network.
- **Written coin types are not read coin types.** The SDK writes Base at `8453`; a public ENS
  client reads it at `2147492101`. Both numbers are in `src/lib/chains.ts`.
- **XRP cannot be written.** The registry rejects coin type 144 outright. Not an SDK gap.
- **Labels are ASCII.** Show the normalized label live rather than mangling it silently.
- **The registry is shared.** Tag every name this app creates `{ demo: 'tangem-ios' }`
  server-side so `npm run cleanup` can find them. Cleanup is a dry run unless labels are
  named explicitly.

### Keys, not wallet-connect

A hardware wallet holds keys; there is no "connect wallet" step to imitate, and Tangem's
whole pitch is that the key is on the card. So the app holds keys too. One 32-byte seed in
`localStorage`, every chain's keypair derived from it — secp256k1 for EVM and Bitcoin
(P2WPKH `bc1…`), ed25519 for Solana. Before the server writes a name it verifies a signature
over a message naming that exact action, binding the signature to one claim.

**The seed is a real spendable key stored in plain text. Never fund it. Say so in the README.**

## Device frame

Desktop renders the app inside an iPhone 17 Pro Max frame — 440 × 956 CSS points, with the
Dynamic Island and home indicator, matching `IMG_4306` which was shot with the frame visible.
Mobile-only by design: no desktop layout. Port the frame from `../dcent/src/wallet/components/Shell.tsx`.

Unlike the D'CENT build, Tangem's screenshots **do** show a status bar and the Dynamic Island,
so render a simulated status bar (time, signal, wifi, battery) inside the frame.

## House rules

- TypeScript throughout. `npm run typecheck` and `npm run build` must both pass.
- `npm run check:secrets` must pass — the API key and the server SDK must never reach the
  client bundle.
- No hardcoded secrets. `.env.local` is gitignored; `.env.example` is the template.
- Comment the *why*, not the *what*. Match the tone of the ported `src/server` files.
- No new dependencies without a reason written in the README.
- Prices, balances and percentages are simulated — keep them in one obvious place so nobody
  mistakes them for live data.
