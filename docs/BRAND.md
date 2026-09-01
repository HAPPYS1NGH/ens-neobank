# Tangem brand assets

Everything in `public/brand/` is an **official Tangem file**, pulled from Tangem's own public
media kit. Nothing here is redrawn or invented. Where this document records a value that we
measured ourselves rather than took from Tangem, it says so in the same sentence.

This demo is an unofficial clone built for a pitch. It is not endorsed by Tangem AG, and the
README must say so wherever the logo appears.

---

## Source: the official media kit

Tangem links a **Media Kit** from the footer of <https://tangem.com/en/>. It is a public
Google Drive folder:

```
https://drive.google.com/drive/folders/1B65x9ZCfyVrT0uW1O8C2vGIMUMY6wXUA
  README_marketing-kit_2026.pdf     ← brand rules: logo, colour, typography
  Tangem Logo/
    tangem-logo/                    ← the mark and the mark+wordmark lockups
      RGB-SVG/  RGB-PNG/  CMYK-EPS/  PANTONE-EPS/  *.ai
    powered-by-tangem/              ← deliberately NOT used here, see below
  Banners and Rollup/  Images/  Marketing Materials/  Videos/
```

Direct folder id for the SVGs we took: `1LFM4xe3cH3NLsBVjFDXk3WjktvKPoayk`.
Pulled 2026-09-01.

### Licence / usage terms

The media kit is published for press and partner use and carries **no explicit licence text**
— the README PDF states rules of *use* (logo rules, clear space, colour, typography) rather
than granting a licence. So treat it as: the marks may be used to identify Tangem, unmodified,
and may not be used to imply endorsement. The files are Tangem AG's trademarks.

Two consequences we honoured:

- **We changed no geometry.** The only edit made to any official path data was swapping the
  `fill` to `currentColor` (and dropping two invisible bounding `<rect>`s from the lockup).
- **We did not ship `powered-by-tangem`.** That lockup exists in the kit and would have been
  convenient, but it asserts a partnership that does not exist. Left out on purpose.

### What we did *not* take from `github.com/tangem/tangem-app-ios`

That repository is public but its `LICENSE` opens with *"Tangem Proprietary and Confidential …
THIS IS NOT AN OPEN SOURCE LICENSE."* We read it for facts (the design-token JSON quoted
below) but **copied no files out of it** — including its in-app logo SVGs
(`ds-core/icons/Logo Tangem/ic_logo_tangem_{16,20,24}_regular.svg`), which are the icons
actually visible in the screenshots. The media-kit mark is the same drawing, so nothing is
lost by using the file that is cleared for outside use.

---

## The files

All eight are official geometry, viewBox-only, no width/height, so they scale from a 16 px
header icon up to a splash screen.

| File | Origin | Use |
|---|---|---|
| `tangem-mark.svg` | media kit `mark-black-RGB.svg`, fill → `currentColor` | **The one to reach for.** The two-bar glyph. Colour it from CSS. |
| `tangem-mark-black.svg` | media kit `mark-black-RGB.svg`, unmodified | Reference copy, `#000000` |
| `tangem-mark-white.svg` | media kit `mark-white-RGB.svg`, unmodified | Reference copy, `#FFFFFF` |
| `tangem-logo.svg` | media kit `logo-black-RGB.svg`, fill → `currentColor`, empty rects dropped | Horizontal lockup, mark + `tangem` wordmark |
| `tangem-logo-black.svg` | media kit `logo-black-RGB.svg`, unmodified | Reference copy |
| `tangem-logo-white.svg` | media kit `logo-white-RGB.svg`, unmodified | Reference copy |
| `tangem-logo-vertical-black.svg` | media kit `logo-black-vertical_RGB.svg`, unmodified | Stacked lockup, `504 × 336` |
| `tangem-logo-vertical-white.svg` | media kit `logo-white-vertical_RGB.svg`, unmodified | Stacked lockup |

Geometry, for anyone laying these out:

- **Mark** — `viewBox="0 0 104 130"`, aspect `0.8`. Three shapes: a top bar `104 × 33.35`
  rounded on its top corners only, then a `28.65` gap, then two legs `34.67` wide running to
  the baseline, rounded on their bottom corners. Optically it is a `Π`, not a `T`.
- **Horizontal lockup** — `viewBox="0 0 648 140"`, aspect `4.63`.
- **Vertical lockup** — `viewBox="0 0 504 336"`, aspect `1.5`.

### How to use them in this build

```tsx
// Home header (IMG_4296) — the mark sits at ~15.7 × 19.6 pt, near-black.
<img src="/brand/tangem-mark.svg" alt="Tangem" style={{ width: 15.7, color: '#0F0F0F' }} />
```

`currentColor` only reaches an SVG loaded inline, not through `<img>`. For the two places the
mark changes colour — near-black in the home header, brand blue on the *Add hardware wallet*
row of IMG_4308 — inline the file's three `<path>`s in a React component and let `fill`
inherit, or ship two `<img>` tags. The screen agents own that call; this doc only supplies
the artwork.

Clear space: the media kit's logo rules page is a diagram, not text, so it did not survive
text extraction. Read page 18 of `README_marketing-kit_2026.pdf` before putting the lockup on
a marketing surface. For a 16–24 px UI icon it does not apply.

---

## Verifying the mark against the screenshots

The mark in `public/brand/` was checked against the pixels of `IMG_4296.PNG` before being
committed, rather than trusted on the strength of its filename.

Thresholding pixels darker than `#646464` in the home-screen header gives a mark spanning
**x 66–112, y 222–281** (3× device pixels), i.e. `47 × 60` px = `15.7 × 20.0` pt. Broken down,
and set beside the official file scaled to the same 47 px width:

| Measure | IMG_4296 (3× px) | Official mark, scaled | |
|---|---|---|---|
| Overall | 47 × 60 | 47.0 × 58.75 | |
| Top bar height | 15 | 15.07 | ✓ |
| Bar → legs gap | 14 | 12.95 | within antialiasing |
| Leg height | 31 | 30.73 | ✓ |
| Leg width | 15 | 15.67 | ✓ |
| Gap between legs | 17 | 15.67 | threshold eats ~1 px per edge |

Same drawing. The small gap differences are the dark-pixel threshold trimming antialiased
edges, and they cancel: total width matches to the pixel.

The header mark samples **`#0F0F0F`** at its centre, not pure black — see the colour section.

---

## Colour

### What Tangem publishes (`README_marketing-kit_2026.pdf`, p. 19)

> The combination of black, white, and blue colors creates a balanced impression of strength,
> invincibility, purity, order, reliability, and technological innovation.

| Name | HEX | RGB | Pantone | CMYK |
|---|---|---|---|---|
| Black | `#000000` | 0 0 0 | Black 6 C | 60 40 40 100 |
| White | `#FFFFFF` | 255 255 255 | White | 0 0 0 0 |
| Vibrant Blue | `#0099FF` | 0 153 255 | 2382 C | 82 36 0 0 |
| Cerulean Blue | `#66CCFF` | 102 204 255 | 297 C | 43 0 0 0 |

### What the product actually ships

Tangem's design-system tokens are published in the iOS repo at
`ds-core/tokens/core/palette.json` (read, not copied). The product palette is a tuned
neighbour of the brand palette, not a copy of it:

| Token | Value | Note |
|---|---|---|
| `palette.neutral.95` | `#0F0F0F` | `color.text.primary`, `color.icon.primary` in the light theme |
| `palette.neutral.5` | `#F4F4F4` | `color.bg.primary` |
| `palette.neutral.10` | `#EAEAEA` | |
| `palette.blue.50` | `#0090F9` | `color.text.brand`, `color.icon.brand`, `color.bg.brand` |
| `palette.red.50` | `#FE4142` | `color.text.status.error` — the falling-price red |
| `palette.violet.50` | `#A967FD` | |

### How that lines up with the pixels in SPEC.md

Three findings, all measured, none guessed:

1. **Ink is `#0F0F0F`, not `#1E1E1E`.** SPEC lists `#1E1E1E` for primary ink and buttons.
   The logo mark samples `(15, 15, 15)` = `#0F0F0F` dead-on, which is exactly
   `palette.neutral.95` / `color.text.primary`. SPEC's `#1E1E1E` was almost certainly read off
   an antialiased glyph edge or a button under the home screen's lavender wash. **Use
   `#0F0F0F`** — it is confirmed twice over, by Tangem's own token file and by our pixels.
   Flagging this for whoever owns `docs/DESIGN.md`; this doc does not edit it.

2. **The accent blue in the 6.2 build is `#4396F7`, and SPEC is right about it.** Sampled from
   the `+` circle and the `+0.09 %` figure in IMG_4296, the dominant colour is `(67, 150, 247)`
   = `#4396F7`, over thousands of pixels — solid fill, not an edge. That is *not*
   `palette.blue.50` `#0090F9` and not brand `#0099FF`. The shipped iOS accent is a lighter,
   more violet blue than either published value. Keep `#4396F7`: the demo has to match the
   screenshots, and a viewer comparing side by side will see the difference.

3. **`#0090F9` does appear — in dark mode.** The blue mark on the *Add hardware wallet* row of
   IMG_4308 peaks at `(0, 144, 249)` ≈ `#0090F9`, matching `palette.blue.50` under the night
   shift. So both blues are genuinely in the app; the light-theme surfaces we are cloning use
   `#4396F7`.

Ordering for anyone picking a colour: **pixel-sampled from the screenshot** beats the token
file beats the media kit. We are cloning one specific build, not rebuilding the design system.

---

## Typography

Three different typefaces are in play, and conflating them is the easy mistake here.

### The brand typeface: Graphik LC

`README_marketing-kit_2026.pdf`, p. 20, verbatim:

> The Graphik font is a variation inspired by European grotesque typefaces and Swiss lettering
> from the early to mid-20th century. Additional font **Arial** is used when it is not possible
> to use Graphik LC.

Graphik is Christian Schwartz's family for **Commercial Type**, sold under a per-use
commercial licence. It cannot be embedded in this demo, and we did not try. Tangem's own
stated fallback is Arial.

### The product UI typeface: SF Pro on iOS, Inter on Android

From `ds-core/tokens/core/font.json` in the iOS repo — authoritative, and it settles the
question outright:

```json
"font": { "family": {
  "ios":     { "$value": "SF Pro" },
  "android": { "$value": "Inter"  }
} }
```

Weights defined: `medium 500`, `semibold 600`, `bold 700`.

This corrects an assumption worth stating plainly: the type in the screenshots is **not** a
geometric grotesque and is not Graphik. It is SF Pro, the iOS system face — a neo-grotesque.
Checking the glyphs bears that out rather than contradicting it:

- `a` in "wallet" (IMG_4296, ~y 1300) is **double-storey with a small outward foot spur** —
  SF Pro and Inter both; a true geometric (Poppins, Futura) has a single-storey `a`.
- `t` in "wallet" has a **curved foot**, not the flat slab a geometric would give.
- The digits in `$0.00` are a **narrow oval `0`** with the `$` stroke passing clean through,
  and the cents render at a smaller optical size — SF Pro Display's behaviour.
- The `G` of "Get your first crypto" carries a **horizontal bar with a short downward spur**.

Graphik would have looked different in all four places — most obviously the `a`, which in
Graphik has a straighter, more closed bowl.

### What to use on the web

```css
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display",
             Inter, "Helvetica Neue", Arial, sans-serif;
```

The first two entries render **real SF Pro** on macOS and iOS, so screenshots taken on a Mac
match the reference pixel for pixel. Inter is the cross-platform fallback and is a
particularly defensible one: it is Tangem's *own* Android choice, straight out of the token
file above, so nothing off-brand can reach a Windows or Linux viewer. If Inter is loaded from
Google Fonts, load only 500/600/700 — the three weights Tangem defines — and give it a real
fallback stack. No font file is committed to this repo.

If some future surface needs display type in Tangem's marketing voice rather than its product
voice, the closest free stand-ins for Graphik are **Figtree** or **Hanken Grotesk** (both
Google Fonts, both geometric grotesques with Graphik's single-storey `g`). Neither is Graphik;
label it as a substitute if used. Tangem's own documented fallback, Arial, is also correct and
requires no licence argument.
