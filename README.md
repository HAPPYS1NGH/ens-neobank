# Tangem × ENS subnames

A working clone of the Tangem iOS wallet (6.2) where **naming a wallet issues a real ENS
subname**. The name is claimed at the moment the user fills in the wallet-name field Tangem
already shows after *Create wallet* — no extra screen, no wallet connection, no separate
claim flow.

Names are live on Ethereum mainnet, issued under **`tange.eth`**. Everything else (balances,
prices, transfers) is simulated, and every screen says where.

> The parent is `tange.eth`, **not** `tangem.eth`. That is the name the repo owner actually
> controls — confirmed deliberate, so do not "correct" it here, in the UI, or in the server
> allowlist. Every name this demo issues reads `label.tange.eth`. No screen renders a fake
> `…tangem.eth`, because a pitch built on showing people a live name has no business also
> showing them a name that does not exist.

This is an unofficial clone built for a pitch. It is not endorsed by Tangem AG; the mark in
the header comes from Tangem's own media kit, used unmodified to identify the app.

## The idea

Tangem's home screen puts a wallet label directly under the balance: `$0.00` / **`Wallet ☁️`**.
Today that string is a local device label — it means nothing off the phone and nobody else
can use it. This demo makes it a subname instead.

| Screen | Today | Here |
|---|---|---|
| Onboarding, after *Create wallet* | Wallet is auto-named `Wallet` | The name field claims `harpreet.tange.eth` |
| Home | `Wallet ☁️` under the balance | `harpreet.tange.eth`, standing in the same spot |
| Manage tokens | Toggling `BASE MAIN L2` adds a local account | …and writes that chain's address record onto the same name |
| Receive assets | a 42-character hex string | The name, with the address one tap away |
| Send | Paste a hex address | Type `alice`, or any ENS name; it resolves per chain |
| Details → Address book | Contacts stored as hex | Contacts stored as ENS names, resolved live |

**One name, every chain.** The wallet gets one name at creation. Every network the user
toggles on in *Manage tokens* adds its address to that same name, so a single
`harpreet.tange.eth` receives BTC, ETH, Base, Arbitrum, Solana and the rest of the writable
set — not a different identity per network.

Tangem's whole pitch is that the key is on the card and the wallet is yours. A name the
wallet issues extends that from the key to the address: the same self-custody, now with a
handle other people can type.

### Rules the UI enforces

Three deliberate departures from the real app, each with a reason:

- **Every wallet gets a name by default.** The name step cannot be completed with an empty
  field — the button stays disabled. Leaving without one is still possible, but it takes
  ticking *Continue without a name*, because a blank field is far more often someone skipping
  past the step than someone declining it. The escape is real: that wallet is fully usable,
  and Home shows a small blue *Tap to claim* prompt because a missing name is the one thing
  left to fix on that screen. It can also be claimed later from Details → the wallet row.
- **One name per wallet.** Tangem supports several wallets — one mobile, many hardware cards
  — and each is a separate identity, so each claims its own name. The *Add wallet* sheet
  routes into the same name step rather than letting a second card share the first wallet's
  name.
- **Networks join the name, they do not fork it.** Toggling a network on and pressing Save
  writes that chain's address record onto the existing name. Toggling it off does **not**
  delete the record — the toggle hides the token, and the caption under the switch says the
  record stays on the name. Someone who saved `harpreet.tange.eth` as a payee keeps being
  able to pay it; silently breaking their next transfer is worse than one extra record.

## Running it

```bash
npm install
cp .env.example .env.local   # add your Namespace API key
npm run dev                  # http://localhost:3008
```

Open it on a phone, or in a desktop browser where it renders inside a phone frame. The UI is
mobile-only by design — there is no desktop layout and no dark theme. The frame is an iPhone
17 Pro Max (440 × 956 CSS points, 1320 × 2868 px @3x), complete with Dynamic Island, a
simulated status bar and home indicator, because unlike the D'CENT shots these screenshots
show the phone.

### Environment

| Variable | Purpose |
|---|---|
| `NAMESPACE_API_KEY` | Server-only. Scoped to the parent below. Get one at [dev.namespace.ninja](https://dev.namespace.ninja). |
| `NAMESPACE_PARENT_NAME` | The ENS parent you own — `tange.eth` for this build. Must appear in `ALLOWED_PARENTS` in `src/server/config.ts` or the server refuses to start. |
| `NAMESPACE_NETWORK` | `mainnet` or `sepolia`. |
| `ENS_RPC_URL` | Public Ethereum RPC used to resolve names *outside* our parent (`vitalik.eth`) through standard ENS with CCIP-Read. |

### Scripts

```bash
npm run typecheck      # tsc --noEmit
npm run build          # production build
npm run check:secrets  # fails if the API key or server SDK reached the client bundle
npm run cleanup        # lists demo-created names; --apply deletes them
```

`npm run shots` walks the whole app headless (Playwright, viewport 440×956 @3x to match the
reference PNGs) and drops 21 captures into `shots/` — onboarding through wallet detail,
including a live claim. Each run mints a fresh `tangemdemo<4 digits>` name, so clean it up
afterwards with `npm run cleanup -- --apply <label>` if you do not want it. Requires the dev
server on port 3008 (`npm run dev -- -p 3008`) and `npx playwright install chromium` once.

`cleanup` is a dry run unless you name labels explicitly. Every name this app creates is
tagged `{ demo: 'tangem-ios' }` server-side, and that tag also matches names real people
claimed while trying the demo, so deletion is never one careless flag away:

```bash
npm run cleanup                        # list what is tagged
npm run cleanup -- --apply demo1234    # delete one
npm run cleanup -- --apply --all       # delete every tagged name
```

## What is real and what is not

**Real.** Subname issuance, availability checks, address records across thirteen chains, name
resolution in both directions, and the ownership signature. A name created here resolves
through public mainnet ENS on the chains the registry can hold.

**Simulated.** Balances, prices, charts, fees, and the transfer itself. All of it lives in
one obvious place — `src/lib/assets.ts` carries the banner `SIMULATED DATA — NOT A PRICE
FEED`, and every price and percentage in the app is a constant from that file. The Send flow
resolves a real name to a real address and then stops: SendReview says *Simulated transfer*,
SendDone lists the status row as *Simulated — not broadcast*, and the Send screen's own hint
reads "This demo does not move funds; only the name lookup is real."

The parts of the app that exist in Tangem but not in this demo are kept on screen and toasted
rather than removed: Scan, Swap, WalletConnect, Import existing wallet, Buy, Sell, Swap &
Send, and *Add custom token* all respond with some version of "not part of this demo — names
are the part that is real". A Manage tokens save on a wallet that has no name saves locally
and says exactly that. Nothing pretends.

## Architecture

Two API routes hold the key; everything else is a client-side wallet.

```
src/
  server/          API-key side. Nothing here reaches the browser.
    config.ts        env + ENSIP-15 parent normalization + allowlist guard
    namespace.ts     the SDK wrapper — mint, read, and read-merge-write
    proof.ts         signature check that replaces a session layer
    resolve.ts       the two-path resolver — our registry, or public ENS
    validation.ts    label normalization, length and reserved names
    http.ts          response envelope; 5xx redacted to a request id
  lib/
    chains.ts        Tangem's coins → networks, mapped onto writable coin types
    assets.ts        asset metadata + the one fenced-off home of simulated prices
    keys.ts          deterministic demo keys derived from one stored seed
  wallet/            the app: store, api client, screens, components
  app/api/subnames/  availability · mint · add-address · read · read-by-owner
  app/api/resolve/   resolve anything the Send field accepts
```

### The two lookups behind the Send field

The recipient field accepts four things and treats them as four different things:

| You type | Path | How |
|---|---|---|
| `alice` | internal | Treated as `alice.tange.eth`, answered from the registry we write to |
| `alice.tange.eth` | internal | Same — a name under our own parent |
| `vitalik.eth`, `someone.id` | **public ENS** | `viem.getEnsAddress` with CCIP-Read, at the coin type a standard client would use for this chain |
| `0x…`, `bc1…`, base58 | none | Used as typed. Nothing is looked up. |

The internal path is authoritative and answers in one request, which matters for a name
claimed seconds earlier. The external path is what proves the wallet resolves the whole
namespace rather than its own corner of it — the resolved card is badged `TANGE.ETH` when our
registry answered and `ENS` when public ENS did, and both cases print the coin type that
answered. The resolution is deliberately visible: pending line, resolved address, source,
coin type. A wallet that resolves names invisibly teaches nobody anything, and this screen
exists to be read as much as used.

Live-verified: `vitalik.eth` resolves at coin type 60 over CCIP-Read; availability, mint,
read and the overlong-label 400 (`LABEL_TOO_LONG`) all behave as described.

### Keys, not wallet-connect

A hardware wallet holds keys; there is no "connect wallet" step to imitate. So the app holds
keys too. One 32-byte seed lives in `localStorage` and every chain's keypair derives from it
— secp256k1 for EVM and Bitcoin (P2WPKH `bc1…`), ed25519 for Solana. Before the server writes
anything it verifies a signature over a message naming that exact action, which binds the
signature to one claim and makes it useless for any other.

**The seed is a real spendable key stored in plain text. Never fund it.** The addresses it
derives are well-formed on purpose — the registry validates address format per coin type, so
a plausible fake would be rejected — which means they are also real enough to receive
something you will never get back.

### Things that will bite you

- **`updateSubname` is a full-replace upsert.** Any record left out of the request is
  cleared. `addAddress` in `src/server/namespace.ts` reads the current state and re-sends
  everything it means to keep. Route every write through it.
- **Availability is inverted.** `GET /api/v1/subnames/{full}` returns **404 when the name is
  free** and 200 when taken. The availability route un-inverts it; nothing else re-inverts it.
- **The EVM fallback record is ours.** Coin `2147483648` (0x80000000, ENSIP-11's EVM default)
  is written at mint time so the name resolves on EVM chains added later. The merge path in
  `namespace.ts` must recognise it or the second network write fails closed.
- **Written coin types are not read coin types.** The SDK writes Base at `8453`; a public ENS
  client reads it at `2147492101`. Every EVM coin type is `2147483648 + chainId` on read; the
  gateway remaps on the way out. Both numbers live in `src/lib/chains.ts`.
- **XRP cannot be written.** The registry rejects coin type 144 outright ("addresses.5.coin
  is not a valid coin"). Not an SDK gap, no client-side workaround. Neither can TRON (SLIP-44
  195), Dogecoin, Zcash, BNB Beacon Chain, HyperEVM, or the Ethereum L2s the registry has no
  entry for (Arbitrum Nova, Aurora, Blast, Cyber, Taiko). All of them stay **visible in
  Manage tokens with the reason rendered under the row** — hiding them would misrepresent
  what the integration covers.
- **Labels are ASCII.** The parent may be Unicode but labels are not, so `Harpreet S`
  becomes `harpreet-s`. The name field shows the normalized label live rather than mangling
  it silently, and the server enforces 3–20 characters plus a reserved list.
- **The signed messages still say `D'CENT demo`.** The proof module and the client's message
  builders were inherited from the D'CENT build and the literal prefix is shared on both
  sides — the server rebuilds the string byte for byte — so changing one side alone breaks
  every write. It is a constant, not a label.
- **The registry is shared.** The tag keeps this demo's names apart from the other client
  demo already in the parent, but see `cleanup` above: the tag also matches names visitors
  claimed, so it stays a dry run until you name labels.
- **Two demo simplifications to know before you poke at it.** Only the active wallet's name
  is re-read from the registry at boot (one owner key, so a second wallet would collide), and
  Choose account shows the same token count and total on every wallet row because the network
  list is shared, not per-wallet.

## Screens

Fourteen reference screenshots live in `reference/screens/` (`IMG_4295`–`IMG_4308`), all
1320 × 2868. Palette and geometry were sampled from the pixels, not the marketing site — the
receipt is `docs/DESIGN.md`. Two of them were shot at night with iOS auto-dark on: **Details
(`IMG_4307`) and the Add-wallet sheet (`IMG_4308`) were recoloured to light, which is a theme
change, not a redesign** — structure, row heights and group gaps are carried over; only the
palette moves. There is no dark theme in this build.

The screens with no public reference — the name step, Send and its review and receipt, wallet
detail, the address book — are built from Tangem's own parts (the 46pt pill button, the 24pt
card, the row shape, the blue network tag) rather than invented.

| # | Screen | Source |
|---|---|---|
| 1 | Create Mobile Wallet (onboarding) | `IMG_4295` |
| 2 | Name your wallet | new |
| 3 | Name claimed | new |
| 4 | Home | `IMG_4296` / `IMG_4306` |
| 5 | Add & Manage sheet | `IMG_4300` |
| 6 | Manage tokens (collapsed, BNB, Solana, Ethereum L2 wall) | `IMG_4302`–`IMG_4305` |
| 7 | Choose account | `IMG_4301` |
| 8 | Choose token | `IMG_4297` |
| 9 | Transfer sheet | `IMG_4298` |
| 10 | Token detail | `IMG_4299` (behind the sheet) |
| 11 | Receive assets | `IMG_4299` |
| 12 | Send | new |
| 13 | Send review + sent | new |
| 14 | Details | `IMG_4307` (recoloured to light) |
| 15 | Add wallet sheet | `IMG_4308` (recoloured to light) |
| 16 | Wallet detail | new |
| 17 | Address book + Add contact | new |

Two behaviours worth calling out because they carry the argument:

- **Receive shows the name only when the record is really there.** The sheet reads the name's
  written records back rather than trusting local state, so a chain the registry does not
  hold yet falls back to exactly what Tangem does today — address first, with a note. The QR
  encodes the name only on EVM chains where the record matches; Bitcoin and Solana (and any
  unnamed wallet) get a QR that carries the address, with an on-screen line saying why.
- **Name claimed renders the receipt from registry truth.** The "it receives on" list comes
  from the mint response's address records, deduped per chain — not from the toggles the user
  happened to have on — so it cannot promise an address the name does not hold.