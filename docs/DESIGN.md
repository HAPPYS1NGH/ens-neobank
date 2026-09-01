# Design audit — Tangem iOS 6.2

Every number in `src/app/globals.css` came from a pixel in `reference/screens/`.
This file is the receipt: the value, the image it came from, and the coordinate.

## Reading the coordinates

All 14 screenshots are **1320 × 2868** — iPhone 17 Pro Max, `@3x`. The app's own
coordinate space is therefore **440 × 956 points**.

> SPEC.md says 402 × 874 (iPhone 17 Pro). That does not match the files. Measured
> against the Dynamic Island in `IMG_4306` and the on-screen layout widths, these
> are Pro Max shots. The device frame should be **440 × 956**, not 402 × 874.

Coordinates below are **device pixels** (the raw PNG). Divide by 3 for the CSS px
value, because the build renders 1 CSS px = 1 iOS point.

Sampling was done with PIL — exact pixel reads and colour histograms over crops,
never eyedropper guesswork.

---

## Colour

### Surfaces

| Token | Value | Source | Note |
|---|---|---|---|
| `--bg-page` | `#F4F4F4` | `IMG_4296` (1316, 400) | 21% of `IMG_4306` by area |
| `--bg-card` | `#FFFFFF` | `IMG_4296` (200, 1700) | 53% of `IMG_4302` by area |
| `--bg-sheet` | `#F4F4F4` | `IMG_4302` (660, 600) | sheet body, Manage tokens |
| `--bg-sheet-plain` | `#FFFFFF` | `IMG_4299` (660, 1800) | Receive assets sheet is white, not grey |
| `--bg-field` | `#DEDEDE` | `IMG_4302` (700, 840) | **SPEC said `#D5D5D5` — wrong.** 97% of the field crop is `#DEDEDE` |
| `--bg-field-plain` | `#FCFCFC` | `IMG_4297` (660, 2700) | the floating search bar on Choose token |
| `--bg-subtle` | `#EBEBEB` | `IMG_4295` (660, 2392) | Import existing wallet; also the feature-icon circles |
| `--bg-subtle-2` | `#F3F3F3` | `IMG_4299` (450, 2400) | Copy / Share pills |
| `--bg-dock` | `#E8E8E8` | `IMG_4296` (660, 2700) | search dock pill; same value as the Add & Manage pill |
| `--bg-notice` | `#EAEAEA` | `IMG_4299` (600, 2620) | wrong-network strip; a faint `#E7`→`#EC` gradient |
| `--bg-elevated` | `#FDFDFD` | `IMG_4295` (110, 260) | back button; `IMG_4299` (1180, 1660) close button |

### Ink

| Token | Value | Source |
|---|---|---|
| `--text-1` | `#1E1E1E` | `IMG_4295` (302–1016, 838–894) — "Create Mobile Wallet"; 25% of that crop |
| `--text-2` | `#656565` | `IMG_4295` (296–1171, 1098–1129) — "Your private keys are securely encrypted…" |
| `--text-3` | `#919191` | `IMG_4295` (380–940, 2670–2710) — "By continuing, you agree to the"; also `IMG_4299` address, `IMG_4296` tickers |
| `--icon-ink` | `#0F0F0F` | `IMG_4296` (60–120, 230–290) — top-bar wallets icon; `IMG_4299` Copy glyph |
| `--text-wash-1` | `#2C2D32` | `IMG_4296` (560–690, 540–600) — the `$0` glyph core |
| `--text-wash-2` | `#6B6C78` | `IMG_4296` (560–700, 660–720) — "Wallet" under the balance |

The two `--text-wash-*` values are composites: the header text is drawn with a
translucent black over the lavender wash, so it picks up the tint. `#2C2D32`
is black at ≈0.78 over `#C5CBEA`; `#6B6C78` is black at ≈0.48 over `#CCD1EB`.
On white the same styles would land near `#383838` / `#808080`, so these tokens
are only correct **on the wash**.

**The balance is not two-toned in colour.** Both `$0` and `.00` sample `#2C2D32`.
The lighter look is entirely the size drop (34px → 22px). Do not fade the cents.

### Accent and market

| Token | Value | Source |
|---|---|---|
| `--accent` | `#4396F7` | `IMG_4295` (660, 2740) — "Terms of service"; identical on `MAIN` tags (`IMG_4305`) and the `+` glyph (`IMG_4302`) |
| `--accent-soft` | `#E8F4FE` | `IMG_4298` (60–180, 1960–2080) — the tinted circle behind the Send arrow |
| `--price-up` | `#4396F7` | `IMG_4296` (230–620, 1875–1910) — Ethereum `▲ 0.09 %` |
| `--price-down` | `#EB483F` | `IMG_4296` (230–600, 1685–1720) — Bitcoin `▼ 0.43 %` |
| `--warning` | `#F4BA46` | `IMG_4297` (80–140, 580–640) — Regional Restriction triangle |
| `--danger` | `#FF3333` | `IMG_4307` (1100–1180, 1010–1080) — the un-backed-up badge (dark shot) |

Gains are **blue**, not green. This is Tangem's choice and it is consistent across
every shot; the palette has no green in it at all.

### Lines and controls

| Token | Value | Source |
|---|---|---|
| `--divider` | `#EBEBEB` | derived — `IMG_4307` (100 and 900, y = 576) shows a 1-device-px `#3B3B3B` hairline on a `#1E1E1E` card. Recoloured for light |
| `--divider-w` | `0.5px` | the device line is exactly 1 device px = 0.33 pt |
| `--track-off` | `#C5C5C7` | `IMG_4305` toggle bbox x 1040–1190, y 1622–1687 |
| `--track-on` | `#1E1E1E` | `IMG_4305` toggle bbox x 1040–1190, y 1442–1507 (SOLANA MAIN, on) |
| `--knob` | `#FFFFFF` | same bbox, right third |
| `--scrim` | `rgba(0,0,0,0.71)` | see below |

### The modal scrim

`IMG_4301` and `IMG_4305` show the Home screen behind a sheet. Sampling the same
coordinates in the unscrimmed `IMG_4296` and dividing gives a constant ratio:

| coord | `IMG_4296` | `IMG_4301` | ratio |
|---|---|---|---|
| (572, 20) | `#B5BAE7` | `#353845` | 0.293 / 0.301 / 0.299 |
| (1316, 300) | `#F4F4F4` | `#444548` | 0.279 / 0.283 / 0.295 |
| (572, 300) | `#B8BFE7` | `#373B46` | 0.290 |

A constant multiplier means a flat black overlay, no blur: **`rgba(0,0,0,0.71)`**.
(`IMG_4300` reads slightly lighter — that shot caught the sheet mid-presentation,
so ignore it.)

### Coin marks

| Token | Value | Source |
|---|---|---|
| `--coin-btc` | `#E9973C` | `IMG_4296` bbox (86, 1618)–(202, 1734); 67% of the crop |
| `--coin-eth-light` | `#8B91AF` | `IMG_4296` (100–190, 1810–1900) |
| `--coin-eth-mid` | `#63688C` | same crop, 12% |
| `--coin-eth-dark` | `#464972` | same crop, 4% (the lower facet) |
| `--coin-base` | `#204FF4` | `IMG_4306` (80–200, 1980–2100) |
| `--coin-sol-from` | `#8251ED` | `IMG_4304` (100–200, 1380–1470) |
| `--coin-sol-to` | `#70E9AF` | same crop |

**Manage tokens greys out the mark of any coin not yet in the portfolio.** The
sampled values there are monochrome, not brand colour:

| Coin | Greyed value | Source (`IMG_4302`, col x = 175) |
|---|---|---|
| Tether | `#747474` | y 1660–1742 |
| BNB | `#B8B8B8` | y 1852–1959 |
| USDC | `#4B4B4B` | y 2261–2366 |
| TRON | `#3C3C3C` | y 2668–2704 |

Those are `--coin-off-1..4`. `--coin-usdt`, `--coin-bnb`, `--coin-tron`,
`--coin-doge` and `--coin-zec` in `globals.css` are **brand colours, not sampled** —
no screenshot shows those coins in their active state. Flagged so nobody cites
them as measured.

---

## The Home wash

`IMG_4296`, `IMG_4306`. A single lavender radial bloom that decays into
`--bg-page`. It is elliptical and its centre sits essentially on the top edge.

**Centre.** Scanning row y = 20 for minimum luminance and taking the midpoint of
successive iso-luminance bands (thresholds 620/640/660/680) gives x = 555–575;
argmin is x = **572** → 190.7 px CSS → **43% of 440**. Down column x = 572 the
value is flat `#B5BAE7` from y = 0 to y ≈ 100 and rises after, putting the centre
at y ≈ **40 device px** → **13px CSS**.

**Aspect.** For each vertical offset *v* below the centre, the matching horizontal
offset *d* (same luminance) was solved from the y = 20 profile:

| v (px) | 60 | 160 | 260 | 360 | 460 | 560 | 760 |
|---|---|---|---|---|---|---|---|
| d (px) | 48 | 82 | 114 | 169 | 207 | 286 | 357 |
| d/v | 0.80 | 0.51 | 0.44 | 0.47 | 0.45 | 0.51 | 0.47 |

A stable **0.46**, so `ry = rx / 0.46 = 2.17 × rx`.

**Radius.** Along y = 20 from x = 572 the colour reaches `#F1EFF4` at d = 700 and
extrapolates to `#F4F4F4` at d ≈ 840 device px → `rx = 280px CSS`, `ry = 609px`.

**Stops** (sampled at `IMG_4296` y = 20, x = 572 + d, expressed as d/840):

| t | 0.00 | 0.12 | 0.24 | 0.37 | 0.49 | 0.61 | 0.73 | 0.85 | 1.00 |
|---|---|---|---|---|---|---|---|---|---|
| colour | `#B5BAE7` | `#B7BCE8` | `#C1C5EB` | `#CECFEC` | `#DBDAEF` | `#E6E4F2` | `#ECEBF2` | `#F1EFF4` | `#F4F4F4` |

> SPEC.md said `#B7BDE7` → `#F3F2F4`. Close, but the true endpoints are
> `#B5BAE7` → `#F4F4F4`. Corrected in `globals.css`.

The left and right sides are near-symmetric (at d = ±500 the values are `#E6E4F2`
and `#E0DEF0`), so a plain centred ellipse reproduces it.

### The promo card's own wash

`IMG_4296`, card bbox x 36–1283, y 1148–1540. Not the same gradient: a shallow
left-to-right sweep from cool to warm.

| x | 45 | 300 | 660 | 1000 | 1275 |
|---|---|---|---|---|---|
| y = 1350 | `#DFDBE5` | `#E9E6ED` | `#EDECEC` | `#ECF0E9` | `#E5ECDF` |

Its inner "Add funds" button is a darker translucent overlay, sampling
`#D2D1D9` at the left and `#D8DDD5` at the right.

---

## Geometry

All values below are **CSS px** (device px ÷ 3).

### Page structure

| Thing | Value | Source |
|---|---|---|
| Frame | 440 × 956 | 1320 × 2868 ÷ 3 |
| Home horizontal padding | **12** | `IMG_4296` y = 1750: card spans x 36–1283 → 1248 device px = 416 CSS wide |
| Onboarding padding | **16** | `IMG_4295` y = 2392: button spans x 48–1271 |
| Sheet inset from screen | **8** | `IMG_4302` y = 1000: sheet spans x 24–1295 |
| Sheet edge → card edge | **16** | `IMG_4302`: cards span x 72–1247, sheet starts at 24 |
| Card edge → content | **16** | `IMG_4302` BTC mark starts x 122, card at 72 |
| Group gap | **12** | `IMG_4302` search field ends y 909, next card starts y ~945 |

### Radii

Measured by the 45° method — find where the corner's edge offset equals the row
offset; for a circular arc that point is at `0.293 × R`.

| Element | Radius | Source |
|---|---|---|
| Sheet | **32** | `IMG_4302` top edge y = 477, left x = 24; 45° crossing at dx = dy ≈ 29 device px → R ≈ 99 device px |
| Card | **24** | `IMG_4296` token card top y = 1578, left x = 36; 45° crossing at ≈22 device px → R ≈ 75 device px |
| Button | **pill** | `IMG_4295` Create wallet: top y = 2485, bottom y = 2623 (138 device px = 46 CSS), 45° crossing at 20 → R ≈ 68 device px = 23 CSS = half the height |
| Field | **22** | height 44, reads as a pill |
| Toggle | **11** | half of 22 |
| Coin mark / icon chip | **circle** | |

The device draws continuous (squircle) corners; CSS circular radii at these
values match the 45° point, which is where the difference is least visible.

### Heights and sizes

| Thing | Value | Source |
|---|---|---|
| Primary/secondary button | **46** | `IMG_4295` dark button y 2485–2623 = 138 device px |
| Gap between the two buttons | **8** | `IMG_4295`: 2462 → 2485 |
| Home token row pitch | **63** | `IMG_4296` card y 1578–1958 = 380 device px over 2 rows |
| Manage-tokens coin row pitch | **68** | `IMG_4302` mark centres y 1294, 1498, 1701 → 204 device px |
| Indented network row pitch | **60** | `IMG_4305` toggle centres y 1474, 1654 → 180 device px |
| Search field | **44** | `IMG_4302` `#DEDEDE` spans y 778–909 = 132 device px |
| Add & Manage pill | **31 × 141** | `IMG_4296` y 2000–2092; x ≈ 448–872 |
| Search dock pill | **44** | `IMG_4296` `#E8E8E8` y 2634–2765, x 48–1271 |
| Toggle | **50 × 22** | `IMG_4305` bbox x 1040–1190, y 1442–1507. Wider and flatter than iOS's own 51 × 31 |
| Toggle knob | **18** | 22 − 2 × 2 padding; travel 28 |
| Sheet grabber | **40 × 4** | `IMG_4296` x 600–719, y 2551–2562 |
| Coin mark, Home | **39** | `IMG_4296` BTC bbox (86, 1618)–(202, 1734) = 117 device px |
| Coin mark, sheet | **35** | `IMG_4302` BTC bbox (122, 1241)–(226, 1346) = 105 device px |
| Coin mark, network row | **22** | `IMG_4305` sub-icon y 1442–1507 = 66 device px |
| Action circle (Add funds / Swap / Transfer) | **46** | `IMG_4296` col x = 460: y 881–1022 = 142 device px; row y = 940 edges at 389/527, 591/729, 791/929 |
| Action circle spacing | **68** centre to centre | centres at x = 152, 220, 288 |
| Feature icon chip | **40** | `IMG_4295` `#EBEBEB` circle at (120–220, 1010–1110) |

---

## Type scale

SF Pro. Sizes derived two ways and cross-checked: cap height ÷ 0.70, and
x-height ÷ 0.526. Where the two disagreed by more than a point the cap-height
figure won (it is measured off a single glyph, so nothing else can contaminate
the band).

| Element | Size | Weight | Colour | Source |
|---|---|---|---|---|
| Screen title — "Create Mobile Wallet" | **26** | 700 | `--text-1` | `IMG_4295`: `C` cap = 53 device px (y 841–894) → 25.2; x-height 40 → 25.3 |
| Home balance, integer | **34** | 700 | `--text-wash-1` | `IMG_4296`: `0` height 74 device px (y 535–608) → 35.2 |
| Home balance, fraction | **22** | 700 | `--text-wash-1` | `IMG_4296`: `.00` digits 48 device px (y 561–608) → 22.9 |
| Asset balance — Transfer / token detail | **40** | 700 | `--text-1` | `IMG_4298`: digits 87 device px (y 892–979) → 41.4 |
| Section heading — "In your portfolio" | **20** | 700 | `--text-1` | `IMG_4297`: x-height 32 device px (y 838–893 ink) → 20.3 |
| Sheet title — "Manage tokens", "Transfer" | **15** | 600 | `--text-1` | `IMG_4302`: `M` cap 30 (y 577–606) → 14.3; `IMG_4298` x-height 22 → 13.9 |
| Row title — "Bitcoin", "Ethereum" | **15** | 500 | `--text-1` | `IMG_4296`: `B` cap 31 (y 1636–1666) → 14.8 |
| Row value — "$0.00" | **15** | 500 | `--text-1` | `IMG_4296`: `$` 33 device px (y 1636–1668) |
| Feature/list row title — "Private keys stay on your device" | **14** | 600 | `--text-1` | `IMG_4295`: `P` cap 28 (y 1033–1060) → 13.3 |
| Button label — "Create wallet" | **14** | 600 | `#FFFFFF` | `IMG_4295`: ink 28 device px (y 2541–2568), no descenders → 13.3 |
| Wallet name under the balance | **14** | 600 | `--text-wash-2` | `IMG_4296`: x-height 21 device px (y 689–709) |
| Add & Manage pill label | **14** | 600 | `--text-1` | `IMG_4296`: x-height 22 (y 2031–2068 ink) |
| Row subtitle — "Add to your portfolio" | **12** | 400 | `--text-3` | `IMG_4300`: ink 27 device px (y 2413–2439) |
| Body paragraph — "Your private keys are securely…" | **12** | 400 | `--text-2` | `IMG_4295`: x-height 19 device px (y 1106–1124) → 12.0 |
| Ticker / price delta — "BTC 0.00", "▼ 0.43 %" | **12** | 500 | `--text-3` / `--price-*` | `IMG_4296`: ink 22 device px (y 1695–1716) |
| Network tag — `MAIN`, `MAIN L2` | **12** | 600 | `--accent` | `IMG_4305`: all-caps ink 25 device px (y 1463–1487) → 11.9 |
| Network row label — `SOLANA`, `ARBITRUM ONE` | **12** | 600 | `--text-1` | same band |
| Terms line | **12** | 400 | `--text-3` | `IMG_4295`: x-height 19 (y 2671–2704 ink) |
| Address, monospaced | **12** | 400 | `--text-3` | `IMG_4299`: ink 26 device px (y 2123–2148) |

Line height sits around 1.35 for body text (`IMG_4295` feature body: line 1 ink
y 1098–1131, line 2 begins y ≈ 1148 → ~50 device px baseline pitch on a 12px
font).

---

## Corrections to SPEC.md

1. **Field fill is `#DEDEDE`, not `#D5D5D5`** (`IMG_4302`, the Manage-tokens
   search input — 97% of the crop).
2. **The wash runs `#B5BAE7` → `#F4F4F4`**, not `#B7BDE7` → `#F3F2F4`.
3. **The frame is 440 × 956, not 402 × 874.** The PNGs are 1320 × 2868 @3x.
4. Everything else in the SPEC table verified exactly: `#4396F7`, `#1E1E1E`,
   `#EBEBEB`, `#F4F4F4`, `#FFFFFF`, `#E8E8E8`.

## Things a screen agent will trip on

- Gains are blue (`--price-up: #4396F7`), losses red. There is no green anywhere.
- The Receive sheet (`IMG_4299`) is **white**; the other sheets are `#F4F4F4`.
  Use `.sheet--plain` for it.
- The Home balance's cents are the **same colour**, only smaller.
- A coin's mark is greyscale in Manage tokens until it is in the portfolio.
- Header text on the wash uses `--text-wash-1/2`, not `--text-1/3`. On white,
  swap back.
- Buttons are true pills (46 tall, radius 23), not 14px-rounded rectangles.
- The toggle is 50 × 22, not the iOS 51 × 31.
