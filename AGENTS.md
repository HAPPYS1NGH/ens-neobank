<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Neobank branch: start here

This branch is the kit pre-shaped for neobanks: "open an account, pick a
username, get paid by name". A new bank needs exactly three inputs from the
user:

1. **ENS parent** the bank owns, e.g. `bank.eth`
2. **Namespace API key** for that parent
3. **Product website**, e.g. `https://bank.example`

If any of the three is missing, ask for it before doing anything else. Don't
guess a parent or reuse another bank's key.

### When you have all three

1. Run setup. It validates the name, checks the key (read-only), scans the
   site, saves the logo, derives colours, writes `src/config/client.ts`,
   `.env.local` and the cleanup `DEMO_TAG`:

   ```bash
   NAMESPACE_API_KEY='<key>' npm run neobank:setup -- --ens <parent> --site <url>
   ```

   Pass the key through the environment as shown, never in a file you commit,
   and never echo it back to the user. If `src/config/client.ts` was already
   generated for a different bank, ask before re-running with `--force`.
   If Chromium is missing, run `npx playwright install chromium` and retry.
2. Read setup's **Check** list and fix each item in `src/config/client.ts`.
3. Look at `brand-scan/<slug>/mobile.png` and `desktop.png` (Read tool). If
   setup reported a bot wall or blank page, use a browser tool to view the
   live site instead. Correct `colors` where the screenshot disagrees with
   the pick. Keep `accent` at 3:1 or better on white.
4. Rewrite onboarding copy in the bank's voice from `scan.json` →
   `headings`/`description`. Override fields in `clientBrand.copy`. Keep the
   neobank vocabulary (account, username, get paid) and the simulated-money
   honesty from `plot.md`.
5. Record the logo source in `docs/BRAND.md`.
6. Run `npm run dev`, open the onboarding and name step, and compare with the
   site screenshot.
7. Verify: `npm run typecheck && npm run build && npm run check:secrets`.
8. Commit `src/config/client.ts`, `public/brand/<slug>.*`, the cleanup script
   and `docs/BRAND.md`. Never commit `.env.local` or `brand-scan/`.

That's the quick path, and it stops there. Restyling chrome to the bank's app
(step 9 of the reskin checklist below) only happens when the user asks for it.

Files that matter on this branch:

| File | Role |
|---|---|
| `src/config/client.ts` | The bank: parent allowlist + brand. Generated, then hand-edited. |
| `src/config/brands.ts` → `neobank` | Base copy for every neobank. Don't edit it for one bank. |
| `scripts/neobank-setup.mjs` | The three-input setup. |
| `scripts/scan-brand.mjs`, `scripts/brand-palette.mjs` | Site scan and colour picks. |
| `docs/NEOBANK.md` | Human-facing version of this section. |

On this branch, read "copy `neutral`" and "point `app.config.ts` at the
preset" below as "edit `src/config/client.ts`". `app.config.ts` just
re-exports it.

# ENS mobile wallet kit

Read `plot.md` before changing a screen. Read this file before adding a string
or a colour. Read `docs/STARTER-KIT.md` before touching `src/server/`.

This repo is the reference used to build **another app's** subname flow. The
geometry is the Tangem demo distilled; the brand is not. Fork it, point
`app.config.ts` at a new preset, restyle the chrome to the new app, keep the
plot.

## Reskin checklist

Do these in order. Stop after step 8 if you only need colour/name; continue
through 11 to clone a real app.

1. **Read `plot.md`.** Do not drop a beat.
2. **Copy `neutral` in `src/config/brands.ts`.** Rename the copy after the
   client (`acme`, `tokocrypto`, …). Do not edit `neutral` in place — the next
   fork needs it.
3. **Point `app.config.ts` at the new preset.** Set `registry.allowedParents`
   and `registry.productionParent` to the ENS parent you own.
4. **Retune `brand.colors`.** Sample hex from the new app's screenshots. Do not
   inline a hex in a screen — if a colour is missing from `BrandColors`, add
   the field to `src/config/types.ts` and both presets, then use the token.
5. **Logo.** Drop an SVG in `public/brand/` and set `brand.logo.src`. Leave
   `src: null` to keep the letter mark from `shortName`.
6. **Rewrite `brand.copy`.** Every product name, CTA, onboarding line, reset
   caption, and proof prefix lives here. Screens import `brand` from `@config`.
   If you are about to hardcode a product name in a component, add a field to
   `BrandCopy` instead.
7. **Isolate this fork.** Change `demoTag` (registry metadata) and
   `storagePrefix` (localStorage) so you do not list, delete, or inherit
   another demo's names or seed. Then set `DEMO_TAG` in
   `scripts/cleanup-demo-names.mjs` to the same string as `demoTag`.
8. **Env.** `.env.local`: `NAMESPACE_PARENT_NAME` and
   `NEXT_PUBLIC_DISPLAY_PARENT` must match each other and the allowlist.
   `NAMESPACE_API_KEY` is server-only.
9. **Restyle chrome to the new app.** Replace onboarding layout, home header,
   tab bar, sheets — sampled from the new app's pixels, recorded in
   `docs/DESIGN.md`. Keep the seven beats. Out-of-scope controls stay on screen
   and toast via `toastNotInDemo()`.
10. **Chains.** `src/lib/chains.ts` is the writable set. Add or hide networks
    to match the product; unwritable ones stay visible with the reason. Do not
    invent a coin type the registry rejects.
11. **Verify.** `npm run typecheck && npm run build && npm run check:secrets`.

To see colour swap with no other work: set `brand: brandPresets.example` in
`app.config.ts` and look at Home. Then switch back. Do not ship `example`.

## Composability rules

- `app.config.ts` (on this branch, `src/config/client.ts` behind it) is the
  only place a brand name, parent allowlist, demo tag, proof prefix, or
  colour belongs. Screens read `brand` / `registry`.
- Colour is injected from `brand.colors` by `src/app/layout.tsx` via
  `src/config/tokens.ts`. Geometry, type, and radius stay in
  `src/app/globals.css` and are shared on purpose.
- `brand.copy.proofPrefix` is shared by `src/wallet/api.ts` and
  `src/server/proof.ts`. Change the preset, not those files.
- `brand.demoTag` is written server-side in `src/server/namespace.ts`. A client
  cannot spoof or omit it.
- Never hardcode a parent ENS name in a screen. Use `w.parent` (from
  `NEXT_PUBLIC_DISPLAY_PARENT` / `registry.productionParent`).

## Runtime boundaries

- There is no URL router. `screen` / `sheet` unions in `src/wallet/store.tsx`
  are the routes. The demo is a phone.
- `NAMESPACE_API_KEY` is server-only. Client code must not import
  `@thenamespace/offchain-manager` or anything under `src/server/`.
- Writes are signed ownership messages, not SIWE. The seed lives in
  localStorage. Never fund those addresses.
- `createSubname` runs only after a fresh availability check.
- Address-record writes go through `addAddress` (read-merge-write). Omitting a
  record from `updateSubname` deletes it.
- Never log or commit API keys, signatures, or the seed.

## Verification

```bash
npm run typecheck
npm run build
npm run check:secrets
```

`check:secrets` needs a completed build. All three must pass.

When changing the config surface, verify **both** presets still typecheck:
`brandPresets.neutral` and `brandPresets.example`.

## Out of scope without explicit approval

Deployment, GitHub pushes, public sharing, live Namespace writes beyond the
demo claim path, and deleting a beat from `plot.md`.
