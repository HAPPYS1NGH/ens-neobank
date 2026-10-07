# Neobank quickstart

This branch turns the kit into a neobank demo: open an account, pick a
username, get paid by name. The username is a real ENS subname under a parent
the bank owns. Balances and transfers stay simulated, the same as on `main`.

You need three things:

| Input | Example | Where it goes |
|---|---|---|
| ENS parent the bank owns | `bank.eth` | `src/config/client.ts` allowlist, `.env.local` |
| Namespace API key for that parent | from [dev.namespace.ninja](https://dev.namespace.ninja) | `.env.local` only |
| Product website | `https://bank.example` | scanned for name, logo, colours |

## Run it

```bash
npm install
npx playwright install chromium        # first time only; the scan drives a real browser
npm run neobank:setup -- --ens bank.eth --site https://bank.example --key <namespace key>
npm run dev                            # http://localhost:3010
```

If you'd rather keep the key out of shell history, drop `--key` and either
export `NAMESPACE_API_KEY` first or let the script prompt for it.

Optional flags: `--network sepolia`, `--force` (regenerate an already generated
client and lose hand edits), `--skip-key-check` (offline).

## What setup does

1. Normalizes the ENS name and checks the API key against Namespace with a
   read-only search. A rejected key stops the run.
2. Opens the website in headless Chromium at desktop and phone sizes, declines
   the cookie banner if it can, and records the page title, manifest, icons,
   button fills, page surfaces, fonts and headlines. Output goes to
   `brand-scan/<slug>/`: `scan.json`, `desktop.png`, `mobile.png`,
   `mobile-full.png` and the header wordmark when there is one. That folder is
   gitignored.
3. Saves a square mark to `public/brand/<slug>.<ext>`. It tries the SVG
   favicon first, then apple-touch-icon, manifest icons and large PNG favicons.
   The header slot is a 22px square, so a wide wordmark is kept in
   `brand-scan/` for reference, not used as the logo.
4. Derives colours:
   - `accent` comes from the biggest saturated button fill. If there isn't
     one, it tries `theme-color`, the manifest, the biggest saturated surface,
     non-default link colours, then `--primary`/`--brand` CSS variables.
   - `text1`, which is also the primary button fill, comes from the biggest
     dark button fill, then the heading or body text.
   - The soft chip, balance bloom and toggle are derived from those two.
   - A red-hued accent gets a green `priceUp` so gains and losses don't look
     the same.
5. Writes `src/config/client.ts` (brand and parent), merges `.env.local` (key,
   parent, network, display parent; file mode 600) and sets `DEMO_TAG` in
   `scripts/cleanup-demo-names.mjs` to `<slug>-neobank`.

It mints nothing. The first real write is the first username someone claims
in the app.

## After setup

The scan gets you close. It doesn't get you finished. Compare the app with
`brand-scan/<slug>/mobile.png` and fix what's off in `src/config/client.ts`.

Setup prints where each colour came from and flags low contrast. Bot walls,
hero videos and seasonal campaigns can throw the picks off, so trust the
screenshot over the number.

The copy is generic neobank copy until you change it. Rewrite the onboarding
lines in the bank's voice, using the headlines in `scan.json`, by overriding
fields in `clientBrand.copy`. Leave the `neobank` preset in `brands.ts` alone;
the next bank starts from it.

Check the logo still reads at 22px, and record where it came from in
`docs/BRAND.md`.

Then verify:

```bash
npm run typecheck && npm run build && npm run check:secrets
```

`check:secrets` reads `NAMESPACE_API_KEY` from the shell, not `.env.local`.
Export it first if you want the real key value included in the bundle check.

## When the scan fails

Some sites block headless browsers. Setup still writes a working client with
the kit's default colours and a letter mark, and lists the failure under
**Check**. Fill the colours in by hand from a real screenshot. For an agent,
that means a browser tool such as Claude in Chrome. Then set `logo.src` once
you have an asset.
