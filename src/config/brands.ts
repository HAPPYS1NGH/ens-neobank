import type { BrandConfig } from './types'

/*
 * Brand presets.
 *
 * `neutral` is the starter default: letter mark, no product trademark, the
 * geometry and type this kit distilled from the Tangem demo. Fork it, rename
 * it, retune `colors`, and you have the next client.
 *
 * `example` exists so a reskin is one line in app.config.ts. It is a green
 * accent on the same geometry — flip to it, look at Home, flip back. Do not
 * ship a partner demo on `example`; copy `neutral` and name the copy after
 * the client.
 */

const neutralColors = {
  accent: '#4396f7',
  accentSoft: '#e8f4fe',
  text1: '#1e1e1e',
  iconInk: '#0f0f0f',
  trackOn: '#1e1e1e',
  priceUp: '#4396f7',
  priceDown: '#eb483f',
  washCore: '#b5bae7',
  washEdge: '#f4f4f4',
  themeColor: '#ffffff',
} as const

export const neutral: BrandConfig = {
  name: 'Wallet',
  shortName: 'Wallet',
  theme: 'neutral',
  logo: { src: '/brand/mark.svg', alt: 'Wallet' },
  demoTag: 'mobile-kit',
  storagePrefix: 'wallet.demo',
  reservedLabels: [],
  colors: { ...neutralColors },
  socials: [],
  copy: {
    title: 'Wallet × ENS',
    description:
      'A mobile wallet demo where naming your wallet issues a real ENS subname.',
    unnamedLabel: 'Wallet',
    onboardingTitle: 'Create Mobile Wallet',
    features: [
      {
        title: 'Private keys stay on your device',
        body: 'Your private keys are securely encrypted and stored on your phone',
      },
      {
        title: 'Seed phrase backup',
        body: 'Create or restore your wallet with a recovery phrase.',
      },
      {
        title: 'One name, every chain',
        body: 'Name the wallet once. Every network you turn on writes its address onto the same name.',
      },
    ],
    importWallet: 'Import existing wallet',
    createWallet: 'Create wallet',
    termsPrefix: 'By continuing, you agree to the',
    termsLabel: 'Terms of service',
    termsHref: 'https://docs.ens.domains/',
    nameOnboardingTitle: 'Name your wallet',
    nameOnboardingLede:
      'One name that receives on every network you turn on, instead of a different address for each.',
    nameAddWalletTitle: 'Name this wallet',
    nameAddWalletLede:
      'This is a separate wallet with its own addresses, so it gets its own name — the one you already claimed keeps pointing at the wallet you claimed it for.',
    nameRenameTitle: 'Name this wallet',
    continueWithoutName: 'Continue without a name',
    continueWithoutNameSub: 'You can add one later from Details → Wallets.',
    claimCta: 'Claim name',
    claimingCta: 'Claiming…',
    continueCta: 'Continue',
    claimedTitle: 'Name claimed',
    claimedLedeBare:
      'This name has no chains attached yet. Add a chain, and anything sent to the name reaches this wallet there.',
    claimedLedeNamed:
      'Anything sent to this name reaches this wallet, on every network you turn on.',
    claimedCta: 'Go to wallet',
    exampleLabel: 'happy',
    notInDemo: '{what} is outside this demo — names are the part that is real',
    resetTitle: 'Reset demo',
    resetArmed: 'Tap again to reset',
    resetSub:
      "Clears this app's local state — keys, wallets, settings. Minted ENS names are not deleted; they stay on the registry.",
    buyHardware: 'Buy a hardware wallet',
    addHardwareTitle: 'Add hardware wallet',
    addHardwareSub: 'Pair a card, then claim its name',
    addMobileTitle: 'Add mobile wallet',
    addMobileSub: 'Create a new wallet on this device, then claim its name',
    addMobileDisabled: 'You already have a mobile wallet on this device',
    walletsFoot:
      'You can only have one mobile wallet. Add a hardware wallet for a second identity. Each wallet claims — and keeps — its own name.',
    version: 'Wallet 1.0',
    proofPrefix: 'Wallet demo',
  },
}

/** Proof that colour lives in this file. Not a partner skin. */
export const example: BrandConfig = {
  ...neutral,
  name: 'Example',
  shortName: 'Example',
  theme: 'example',
  logo: { src: null, alt: 'Example' },
  demoTag: 'mobile-kit-example',
  storagePrefix: 'example.demo',
  reservedLabels: ['example'],
  colors: {
    ...neutralColors,
    accent: '#16bb7a',
    accentSoft: '#e7f8f0',
    priceUp: '#16bb7a',
    washCore: '#b5e7c9',
    trackOn: '#0f7a4d',
  },
  copy: {
    ...neutral.copy,
    title: 'Example × ENS',
    description: 'The green accent preset — a one-line swap in app.config.ts.',
    proofPrefix: 'Example demo',
    version: 'Example 1.0',
  },
}

/**
 * This checkout. Copied from `neutral` so the starter preset stays untouched
 * for the next fork. Names mint under ninza.eth.
 */
export const ninza: BrandConfig = {
  ...neutral,
  name: 'Ninza',
  shortName: 'Ninza',
  theme: 'ninza',
  logo: { src: '/brand/ninza.svg', alt: 'Ninza' },
  demoTag: 'ninza-kit',
  storagePrefix: 'ninza.demo',
  reservedLabels: ['ninza'],
  copy: {
    ...neutral.copy,
    title: 'Ninza × ENS',
    description:
      'A mobile wallet demo where naming your wallet issues a real ENS subname under ninza.eth.',
    onboardingTitle: 'Create Ninza Wallet',
    version: 'Ninza 1.0',
    proofPrefix: 'Ninza demo',
  },
}

export const brandPresets = { neutral, example, ninza }
