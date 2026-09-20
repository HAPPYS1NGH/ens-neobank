# Plot

This is the story the demo tells. A reskin may change every pixel, every string,
and every piece of chrome to match a new app. It may not drop, skip, reorder, or
invert a beat.

Read this file before touching a screen. If a change would make a beat untrue,
it is the wrong change.

The names are real (Namespace offchain registry, Ethereum mainnet). Balances,
prices, and the transfer itself are simulated. Every screen that mixes the two
must keep them distinguishable.

---

## Beats

### 1. Create, then name

The user creates a wallet and is walked into a name step. The name field is the
claim: live availability, a live preview of the ASCII-normalized label, and
the real parent (`label.<parent>`). An empty field cannot submit. Skipping is
possible but deliberate — a checkbox, not a blank field.

### 2. The name is claimed on the registry

Tapping claim mints a real ENS subname under the configured parent. The receipt
screen is registry truth: it lists the chains the name actually holds address
records for. A fresh mint is **bare** — no address records yet. The receipt
says so, and offers the next step (add a network). It does not invent chains
the user has not added.

### 3. Home shows the name

The string under the balance is the claimed name, standing where a local wallet
label used to stand. An unnamed wallet still works, and Home offers a tap-to-claim
prompt because a missing name is the one thing left to fix on that screen.

### 4. Adding a chain writes it onto the name

Turning a network on (Add chain, Organize tokens, or Receive → Add chain) writes
that chain's address onto the **same** name. Networks join the name; they do not
fork it. Toggling a network off hides the token locally and **does not** delete
the record — someone who saved the name as a payee must still be able to pay it.

Add chain and Organize tokens list only networks the offchain name can hold.
Chains the registry cannot write (XRP, TRON, …) are not offered.

### 5. Receive is name-first

Receive shows the name, with the hex address one tap away. The name only stands
in for a network once that network's record is actually on the name (read back,
not assumed). A chain the registry cannot hold, or a wallet with no name, falls
back to address-first and says why. From Receive, the user can add another
network and land back on Receive for it.

### 6. Send resolves names, out loud

The recipient field accepts a bare label (treated as `label.<parent>`), a name
under our parent, any public ENS name, or a raw address. Resolution is visible:
pending, resolved address, which system answered (`<PARENT>` vs `ENS`), coin
type. Empty state offers chips so a reviewer can fire a lookup without a second
account — the wallet's own name if it has one, and `vitalik.eth` for the public
ENS path. Nothing is broadcast. Review and done both say the transfer is
simulated.

### 7. Reset demo

Details has a Reset demo row. It asks twice (arm, then commit). It clears local
state — seed, wallets, settings — and reloads. Minted names are **not** deleted;
the caption says so. `?reset=1` on the URL does the same thing, then strips the
param.

---

## What is not the plot

Swap, scan, buy, sell, WalletConnect, import seed, custom tokens, social links,
hardware-shop rows. Keep them on screen if the target app has them, and toast
that they are outside the demo. Do not delete chrome to "simplify" — a missing
control looks like a bug. Do not make them work.

---

## Invariants the plot depends on

These live in `src/server/` and `src/lib/`. A reskin does not rewrite them.

- `updateSubname` is a full-replace upsert. Every write goes through
  `addAddress` in `src/server/namespace.ts`, which reads current state and
  re-sends everything it means to keep.
- Availability is inverted at the SDK: 404 means free. The availability route
  already translates this; screens must not re-invert it.
- Coin `2147483648` is the EVM fallback, written with the first EVM address.
  The merge path must recognise it.
- Written coin types are not read coin types (Base writes `8453`, public ENS
  reads `2147492101`). Both numbers are in `src/lib/chains.ts`.
- Proof messages on client and server share `brand.copy.proofPrefix` from
  `app.config.ts`. Changing one side alone breaks every write.
- The seed in `localStorage` is a real spendable key. Never fund it. The UI
  already says so; do not soften that.
