# Starter kit guide

A Next.js phone app that issues **gasless offchain ENS subnames** under a parent
you own. Naming the wallet mints the name. Adding a chain writes that chain's
address onto it. Send resolves names. Reset starts over locally without burning
the name.

Nothing about it is specific to any one brand. One config file decides the
parent registry, the branding, and the colours.

For the story the UI must keep telling, see [`plot.md`](../plot.md). For the
agent reskin checklist, see [`AGENTS.md`](../AGENTS.md).

- [Quick start](#quick-start)
- [How it fits together](#how-it-fits-together)
- [Adding a brand](#adding-a-brand)
- [The security model](#the-security-model)
- [Verification](#verification)

---

## Quick start

You need a parent ENS name you control and a Namespace API key for it
([namespace.ninja](https://namespace.ninja)).

### 1. Point the registry at your parent

```ts
// app.config.ts
registry: {
  allowedParents: ['yourname.eth'],
  productionParent: 'yourname.eth',
},
```

`allowedParents` is a fail-closed guard: the server refuses to start if
`NAMESPACE_PARENT_NAME` is not in this list. Set it to `null` to accept any
valid ENS name — reasonable in local dev, risky once a production key is in
the environment.

### 2. Fill in the environment

```bash
cp .env.example .env.local
```

```dotenv
NAMESPACE_API_KEY=ns-...
NAMESPACE_PARENT_NAME=yourname.eth
NAMESPACE_NETWORK=mainnet
NEXT_PUBLIC_DISPLAY_PARENT=yourname.eth
```

None of these except `NEXT_PUBLIC_DISPLAY_PARENT` reach the browser.
`npm run check:secrets` fails the build if the API key ever does.

### 3. Pick your branding

```ts
// app.config.ts
brand: brandPresets.neutral,   // or brandPresets.example, or your own
```

Copy `neutral` in `src/config/brands.ts`, rename it, edit `copy` and `colors`.
See [Adding a brand](#adding-a-brand).

### 4. Run it

```bash
npm install
npm run dev                    # http://localhost:3010
```

Open it on a phone, or in a desktop browser where it renders inside a phone
frame. Mobile-only by design.

---

## How it fits together

| Layer | Where | Reaches the browser? | What it does |
|---|---|---|---|
| **Config** | `app.config.ts`, `src/config/**` | Yes (no secrets) | Brand, colours, parent allowlist, demo tag |
| **Server** | `src/server/**`, `src/app/api/**` | Never | Holds the API key, verifies signatures, talks to Namespace |
| **Client** | `src/wallet/**`, `src/lib/**` | Yes | Wallet, UI, `fetch` to `/api` |

The split is enforced by `scripts/check-client-boundary.mjs` against the built
bundle. It is not advisory.

### Claiming a name

```
NameWallet screen
  → GET  /api/subnames/availability?label=…     debounced
  → wallet signs brand.copy.proofPrefix + claim line
  → POST /api/subnames                          mint, bare (no address records)
```

### Adding a chain

```
Manage tokens Save  /  Receive → Add network
  → wallet signs brand.copy.proofPrefix + add-address line
  → PATCH /api/subnames                         read-merge-write one chain
```

A name mints **bare**. Address records appear only when the user adds that
network. That is beat 4 of the plot; do not "fix" it by writing every chain
at mint unless the product is custodial and you have changed the plot on
purpose (Tokocrypto did this; document it).

### Send

```
Send field
  → GET /api/resolve?name=&chain=               internal registry or public ENS
```

Bare `alice` is `alice.<parent>`. `vitalik.eth` goes out over CCIP-Read. A hex
address is used as typed.

---

## Adding a brand

1. Copy `neutral` in `src/config/brands.ts`. Rename the export.
2. Fill in `name`, `shortName`, `theme`, `demoTag`, `storagePrefix`.
3. Retune `colors` from the new app's screenshots. Only colour. Spacing,
   radius, and type stay in `:root` until you are replacing chrome.
4. Rewrite `copy`. `proofPrefix` is the first line of every signed message —
   keep it short and unique per fork.
5. Optional: drop an SVG in `public/brand/` and set `logo.src`.
6. Point `app.config.ts` at the new preset. Update `registry.allowedParents`.
7. Set `DEMO_TAG` in `scripts/cleanup-demo-names.mjs` to `demoTag`.
8. Set `.env.local` to the new parent.

To confirm the colour path works before you have screenshots, switch
`app.config.ts` to `brandPresets.example` (green) and look at Home.

When you later replace screens to match the new app, sample pixels into
`docs/DESIGN.md` and keep every beat in `plot.md`. Out-of-scope controls stay
visible and call `toastNotInDemo()`.

---

## The security model

**The seed is the session.** There is no SIWE and no cookie. One 32-byte seed
in `localStorage` derives every chain's key. Before the server writes, it
verifies a signature over a message naming that exact action
(`src/server/proof.ts`). A signature for one claim cannot mint another.

**The API key never reaches the browser.** `src/server/` is `server-only`.
`check:secrets` greps the built bundle for the key, the env var name, and the
offchain SDK.

**`updateSubname` is a full-replace upsert.** `addAddress` reads current state
and re-sends everything it means to keep, including the EVM fallback coin
`2147483648`. A naive "send only the new chain" call clears the rest.

**Errors do not leak.** `handleApi()` returns the real message only for 4xx.
Anything 5xx becomes a generic message plus a request id.

**Reset does not burn names.** `resetWallet()` clears the seed and local
state. Names stay on the registry. Cleanup is a separate, dry-run-by-default
script filtered on `brand.demoTag`.

---

## Verification

```bash
npm run typecheck
npm run build
npm run check:secrets
```

`check:secrets` needs a completed build.
