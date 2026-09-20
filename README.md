# ENS mobile wallet kit

A Next.js phone demo that issues **gasless offchain ENS subnames** under a
parent name you own. Naming the wallet mints the name. Adding a chain writes
that chain's address onto it. Send resolves names. Reset starts the walkthrough
over without burning the name.

This is the internal base for spinning up **mobile** partner demos — the phone
analog of `namespace-offchain-subname-client-demo`. Clone it, point
`app.config.ts` at the client's parent and palette, restyle the chrome to their
app, keep the plot. It is not a public template: expect to edit it per
engagement rather than configure around it.

The geometry was distilled from the Tangem iOS demo (best UX we have). This
checkout ships as **Ninza** — names mint under `ninza.eth`, chrome reads
`brandPresets.ninza`. `brandPresets.neutral` stays the unbranded starting
point for the next fork.

> Names are live on Ethereum mainnet. Everything else (balances, prices,
> transfers) is simulated. The seed in `localStorage` is a real spendable key
> stored in plain text. **Never fund it.**

## Quick start

```bash
npm install
cp .env.example .env.local   # add your Namespace API key
npm run dev                  # http://localhost:3010
```

Then in `app.config.ts`:

```ts
registry: {
  allowedParents: ['ninza.eth'],
  productionParent: 'ninza.eth',
},
brand: brandPresets.ninza,
```

The server refuses to start if `NAMESPACE_PARENT_NAME` is not in
`allowedParents`. Set `.env.local` to match.

To confirm colour is driven by the preset, switch to `brandPresets.example`
(green accent), look at Home, switch back.

## What you get

The seven beats in [`plot.md`](plot.md):

1. Create wallet → name (availability, normalized preview, skip is a checkbox)
2. Claim receipt from registry truth (bare mint, no invented chains)
3. Home shows the name under the balance
4. Add a chain → write that address onto the same name
5. Receive is name-first; add-network-from-receive
6. Send resolves names out loud, with try-chips (`own name`, `vitalik.eth`)
7. Reset demo (arm-then-commit, names stay minted) + `?reset=1`

Plus an ENS address book, multi-wallet (each wallet its own name), and
out-of-scope chrome that toasts instead of vanishing.

## Changing brand, theme, colour

One file for identity and colour: **`src/config/brands.ts`**, selected from
**`app.config.ts`**.

| What | Where |
|---|---|
| Product name, CTAs, onboarding, reset copy, proof prefix | `brand.copy` |
| Accent, ink, wash, price-up/down | `brand.colors` — injected as CSS variables by the layout |
| Logo | `brand.logo.src` or letter mark from `shortName` |
| Parent allowlist | `registry` in `app.config.ts` |
| Demo metadata tag / localStorage prefix | `brand.demoTag`, `brand.storagePrefix` |

Do not put a product name or a hex colour in a screen. Agents: see `AGENTS.md`.

Geometry (radii, type, row heights) stays in `src/app/globals.css` until you
are restyling chrome to a new app's pixels — that is a later step, recorded in
`docs/DESIGN.md`.

## Environment

| Variable | Purpose |
|---|---|
| `NAMESPACE_API_KEY` | Server-only. From [dev.namespace.ninja](https://dev.namespace.ninja) |
| `NAMESPACE_PARENT_NAME` | Must be in `registry.allowedParents` |
| `NAMESPACE_NETWORK` | `mainnet` or `sepolia` |
| `ENS_RPC_URL` | Public RPC, used only to resolve names *outside* our parent |
| `NEXT_PUBLIC_DISPLAY_PARENT` | What the UI prints after the label. Match the parent |

## Commands

```bash
npm run typecheck
npm run build
npm run check:secrets   # after build; fails if the API key reached the client
npm run cleanup         # lists names tagged with brand.demoTag; dry run by default
```

`npm run shots` walks the flow in Playwright (viewport 440×956 @3x) and writes
`shots/*.png`. Requires the dev server on port 3010.

## Documentation

| File | For |
|---|---|
| [`plot.md`](plot.md) | The seven beats a reskin must keep |
| [`AGENTS.md`](AGENTS.md) | Reskin checklist and invariants |
| [`docs/STARTER-KIT.md`](docs/STARTER-KIT.md) | Architecture, security, how to add a brand |
| [`docs/DESIGN.md`](docs/DESIGN.md) | Geometry of the reference skin |

## Basepoint

This kit was copied from the Tangem demo at `origin/main`
(`0c95f76` — every wallet its own identity). Subsequent commits are the
debrand and the agent-facing config. The Tangem, D'CENT, and Tokocrypto
clones remain the pixel-accurate pitches; this repo is what you start from
for the next one.
