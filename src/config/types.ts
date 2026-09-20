/*
 * Shape of app.config.ts.
 *
 * Everything here is static and non-secret, so the same object is safe to
 * import from server code, client screens, and the layout that paints tokens.
 * Secrets (NAMESPACE_API_KEY) and the per-deploy parent (NAMESPACE_PARENT_NAME)
 * stay in the environment and are read only by src/server/config.ts.
 *
 * When you fork this kit into a new app's subname demo, you copy a preset in
 * src/config/brands.ts, point app.config.ts at it, and stop. Screens read
 * `brand` — they must not grow a new hardcoded product name.
 */

export interface BrandColors {
  /** Links, + icons, network tags, focus ring. */
  accent: string
  /** Tinted chip behind an accent glyph. */
  accentSoft: string
  /** Primary ink and the primary button fill. */
  text1: string
  /** Glyphs — a shade darker than text1 in the reference skin. */
  iconInk: string
  /** Toggle track when on. Often the same as text1. */
  trackOn: string
  /** Price-up / positive delta. The reference skin uses accent, not green. */
  priceUp: string
  priceDown: string
  /** Home balance bloom, centre. */
  washCore: string
  /** Home balance bloom, edge — usually the page background. */
  washEdge: string
  /** <meta name="theme-color"> / viewport. */
  themeColor: string
}

export interface BrandLogo {
  /**
   * Path under public/, e.g. '/brand/mark.svg'. `null` renders a letter mark
   * from `shortName`, which is the right default until a real asset lands.
   */
  src: string | null
  alt: string
}

export interface BrandFeature {
  title: string
  body: string
}

export interface BrandSocial {
  name: string
  href: string
}

export interface BrandCopy {
  /** Default <title> and the base of the '%s — …' template. */
  title: string
  description: string
  /** Local label for an unnamed wallet, e.g. 'Wallet'. */
  unnamedLabel: string
  onboardingTitle: string
  features: [BrandFeature, BrandFeature, BrandFeature]
  importWallet: string
  createWallet: string
  termsPrefix: string
  termsLabel: string
  termsHref: string
  nameOnboardingTitle: string
  nameOnboardingLede: string
  nameAddWalletTitle: string
  nameAddWalletLede: string
  nameRenameTitle: string
  continueWithoutName: string
  continueWithoutNameSub: string
  claimCta: string
  claimingCta: string
  continueCta: string
  claimedTitle: string
  claimedLedeBare: string
  claimedLedeNamed: string
  claimedCta: string
  /**
   * Sample label used in empty name fields and send hints, e.g. 'happy'.
   * Not a product name — the demo identity people type first.
   */
  exampleLabel: string
  /** `{what}` is replaced by the control the user tapped. */
  notInDemo: string
  resetTitle: string
  resetArmed: string
  resetSub: string
  buyHardware: string
  addHardwareTitle: string
  addHardwareSub: string
  addMobileTitle: string
  addMobileSub: string
  addMobileDisabled: string
  walletsFoot: string
  version: string
  /**
   * First line of every signed message. Must match on the client (`src/wallet/api.ts`)
   * and the server (`src/server/proof.ts`) — they both read this field. Changing it
   * invalidates in-flight signatures, which is harmless: the next write re-signs.
   */
  proofPrefix: string
}

export interface BrandConfig {
  name: string
  shortName: string
  /** Selects nothing on its own; carried so a fork can add a `[data-theme]` later. */
  theme: string
  logo: BrandLogo
  /**
   * Metadata tag written onto every name this app mints (`{ demo: demoTag }`).
   * `npm run cleanup` filters on it. Change it when you fork so you do not
   * list or delete another demo's names in a shared parent.
   */
  demoTag: string
  /** Prefix for localStorage keys (`<prefix>.seed.v1`, `<prefix>.state.v1`). */
  storagePrefix: string
  /** Extra reserved labels on top of the structural set in src/server/validation.ts. */
  reservedLabels: string[]
  colors: BrandColors
  copy: BrandCopy
  socials: BrandSocial[]
}

export interface RegistryConfig {
  /**
   * The server refuses to start unless NAMESPACE_PARENT_NAME is in this list.
   * `null` accepts any valid ENS name — fine in local dev, risky with a live
   * API key.
   */
  allowedParents: string[] | null
  /**
   * Fallback the UI uses for `label.<parent>` when NEXT_PUBLIC_DISPLAY_PARENT
   * is unset. Set it to the same string as the env parent.
   */
  productionParent: string
}

export interface AppConfig {
  registry: RegistryConfig
  brand: BrandConfig
}
