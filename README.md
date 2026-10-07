# ENS neobank kit

A Next.js phone demo that issues **gasless offchain ENS subnames** under a
parent name you own. Open an account, pick a username, get paid by name.
Naming the wallet mints the name. Adding a chain writes that chain's address
onto it. Send resolves names.

An agent builds a bank's demo from three inputs:

1. ENS parent the bank owns, for example `bank.eth`
2. Namespace API key for that parent
3. The bank's website, for example `https://bank.example`

```bash
npm install
npx playwright install chromium
NAMESPACE_API_KEY='<key>' npm run neobank:setup -- --ens bank.eth --site https://bank.example
npm run dev
```

Setup scans the website, saves the logo, derives colours, and writes
`src/config/client.ts` plus `.env.local`. It mints nothing. The first real
write is the first username someone claims in the app.

If any of the three inputs is missing, ask for it. Pass the key through the
environment, as above. Agents then follow [`AGENTS.md`](AGENTS.md): check the
scan, match the screenshots, and rewrite the onboarding copy in the bank's
voice. [`docs/NEOBANK.md`](docs/NEOBANK.md) is the same path in long form.

Until setup runs, this checkout is the unbranded neobank under `ninza.eth`.

> Names are live on Ethereum mainnet. Everything else (balances, prices,
> transfers) is simulated. The seed in `localStorage` is a real spendable key
> stored in plain text. **Never fund it.**

The server refuses to start if `NAMESPACE_PARENT_NAME` is not in
`allowedParents`. Setup writes `.env.local` to match `src/config/client.ts`.

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

One file for this bank's identity and colour: **`src/config/client.ts`**.
`app.config.ts` re-exports it. Leave the `neobank` preset in
`src/config/brands.ts` alone so the next bank still has a base.

| What | Where |
|---|---|
| Product name, CTAs, onboarding, reset copy, proof prefix | `clientBrand.copy` |
| Accent, ink, wash, price-up/down | `clientBrand.colors` — injected as CSS variables by the layout |
| Logo | `clientBrand.logo.src` or letter mark from `shortName` |
| Parent allowlist | `clientRegistry` in `src/config/client.ts` |
| Demo metadata tag / localStorage prefix | `clientBrand.demoTag`, `clientBrand.storagePrefix` |

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
