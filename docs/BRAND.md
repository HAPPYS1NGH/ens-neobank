# Brand assets

This kit ships with **no partner trademark**. The header is a letter mark from
`brand.shortName` until you drop a file in `public/brand/` and set
`brand.logo.src` in `src/config/brands.ts`.

When you fork this into a client's demo:

1. Put official artwork in `public/brand/`. Prefer SVG with `fill="currentColor"`
   so it follows `--icon-ink`. An `<img>` cannot inherit `currentColor` —
   `BrandMark` will render it as-is.
2. Record provenance here: where the file came from, the licence, and any
   geometry you are not allowed to change. The Tangem and Tokocrypto pitches
   in this series treated media-kit rules as load-bearing; do the same.
3. Do not invent a "powered by" lockup that asserts a partnership.

Colour does not live in this folder. Colour lives in `brand.colors`.
