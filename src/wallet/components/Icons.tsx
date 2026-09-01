/**
 * Every icon this build draws, traced from `reference/screens/*.PNG`.
 *
 * Tangem's glyphs are a single-weight stroked set on a 24pt box — the scan mark
 * in `IMG_4306`, the chevrons in `IMG_4307`, the Copy / Share pills in
 * `IMG_4299` all measure the same ~1.8pt stroke with round caps. So everything
 * here goes through one wrapper with one stroke width, and sizes off a `size`
 * prop rather than a class, because these get dropped into circles of three
 * different diameters (46 action, 40 chip, 22 network row).
 *
 * Two exceptions, both deliberate:
 *
 *   - Brand marks (the Tangem TT, WalletConnect, and the social row from
 *     `IMG_4307`) are filled shapes, not strokes. A stroked Facebook glyph is
 *     not the Facebook glyph. They use `fill="currentColor"` with `evenodd`
 *     holes so a single path carries both the disc and the letter cut out of it.
 *   - `Cloud` is filled, because the cloud beside "Wallet" in `IMG_4306` is.
 *
 * Colour always comes from `currentColor`. Nothing here hardcodes a hex; the
 * caller sets `color` from a token in `globals.css`.
 */
import type { SVGProps } from 'react'
import type { ReactNode } from 'react'

export type IconProps = SVGProps<SVGSVGElement> & { size?: number }
export type IconComponent = (props: IconProps) => ReactNode

/** Stroked icons. One weight, round joins — matches every glyph in the shots. */
function S({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/** Filled icons: brand marks, where the shape *is* the logo. */
function F({ size = 24, children, ...rest }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  )
}

/* ------------------------------------------------------------------ brand */

/**
 * The Tangem mark: a wide bar over two blocks, top-left of Home (`IMG_4306`)
 * and again in blue on "Add hardware wallet" (`IMG_4308`). Proportions measured
 * off the Home header crop — bar 16/58 of the height, blocks 31/58, gutter
 * 14/52 of the width.
 */
export const TangemMark = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <rect x="2" y="2.6" width="20" height="5.3" rx="1.8" />
    <rect x="2" y="11.4" width="7.3" height="10.1" rx="1.9" />
    <rect x="14.7" y="11.4" width="7.3" height="10.1" rx="1.9" />
  </F>
)

/** WalletConnect's wave. Simplified to one stroke — at 20px the arcs read as one. */
export const WalletConnect = ({ size = 24, ...rest }: IconProps) => (
  <S size={size} strokeWidth={2.4} {...rest}>
    <path d="M4.4 11.4c2.1-2.1 5.5-2.1 7.6 0 2.1 2.1 5.5 2.1 7.6 0" />
  </S>
)

/* ------------------------------------------------------- header + actions */

/** The QR viewfinder in the Home header (`IMG_4306`): brackets around a code. */
export const Scan = ({ size = 24, ...rest }: IconProps) => (
  <S size={size} {...rest}>
    <path d="M3.5 8.5V6a2.5 2.5 0 0 1 2.5-2.5h2.5" />
    <path d="M20.5 8.5V6A2.5 2.5 0 0 0 18 3.5h-2.5" />
    <path d="M3.5 15.5V18A2.5 2.5 0 0 0 6 20.5h2.5" />
    <path d="M20.5 15.5V18a2.5 2.5 0 0 1-2.5 2.5h-2.5" />
    <rect x="7.5" y="7.5" width="4" height="4" rx="1" />
    <path d="M7.5 14.5h2.2v2.2H7.5zM14.2 7.5h2.2v2.2h-2.2zM13.6 13.4h1.4v1.4h-1.4zM16.2 16h1.4v1.4h-1.4zM13.6 16.6h1.2v1.2h-1.2zM16 13.4h1.2v1.2H16z" fill="currentColor" stroke="none" />
  </S>
)

export const Ellipsis = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <circle cx="5.6" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="18.4" cy="12" r="1.8" />
  </F>
)

/** Add funds. */
export const ArrowDown = (p: IconProps) => (
  <S {...p}><path d="M12 4.5v15" /><path d="m5.8 13.4 6.2 6.1 6.2-6.1" /></S>
)

/** Transfer. */
export const ArrowUp = (p: IconProps) => (
  <S {...p}><path d="M12 19.5v-15" /><path d="m5.8 10.6 6.2-6.1 6.2 6.1" /></S>
)

/** Swap: two arrows chasing each other, as in the Home action row. */
export const Swap = (p: IconProps) => (
  <S {...p}>
    <path d="M7.4 8.6h7.2a3.4 3.4 0 0 1 2.6 5.6" />
    <path d="m10 5.9-2.7 2.7 2.7 2.7" />
    <path d="M16.6 15.4H9.4a3.4 3.4 0 0 1-2.6-5.6" />
    <path d="m14 18.1 2.7-2.7-2.7-2.7" />
  </S>
)

/** Add & Manage / Organize tokens — two tracks with knobs (`IMG_4300`). */
export const Sliders = (p: IconProps) => (
  <S {...p}>
    <path d="M3.5 8.5h3.2M11.3 8.5h9.2" />
    <path d="M3.5 15.5h9.2M17.3 15.5h3.2" />
    <circle cx="9" cy="8.5" r="2.3" />
    <circle cx="15" cy="15.5" r="2.3" />
  </S>
)

/* ------------------------------------------------------------ navigation */

export const Plus = (p: IconProps) => <S {...p}><path d="M12 5v14M5 12h14" /></S>
export const ChevronRight = (p: IconProps) => <S {...p}><path d="m9.5 5.5 6.5 6.5-6.5 6.5" /></S>
export const ChevronDown = (p: IconProps) => <S {...p}><path d="m5.5 9.5 6.5 6.5 6.5-6.5" /></S>
export const ChevronUp = (p: IconProps) => <S {...p}><path d="m5.5 14.5 6.5-6.5 6.5 6.5" /></S>
export const Back = (p: IconProps) => <S {...p}><path d="m14.5 5.5-6.5 6.5 6.5 6.5" /></S>
export const Close = (p: IconProps) => <S {...p}><path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" /></S>
export const Check = (p: IconProps) => <S {...p} strokeWidth={2.2}><path d="m5 12.6 4.8 4.6L19 6.8" /></S>
export const Search = (p: IconProps) => (
  <S {...p}><circle cx="11" cy="11" r="6.6" /><path d="m15.9 15.9 4.1 4.1" /></S>
)

/* ------------------------------------------------------ receive + sharing */

/** The Copy pill glyph in `IMG_4299`: two stacked rounded squares. */
export const Copy = (p: IconProps) => (
  <S {...p}>
    <rect x="8.6" y="8.6" width="11.4" height="11.4" rx="3" />
    <path d="M15.4 5.9A2.9 2.9 0 0 0 12.5 4h-5.6A2.9 2.9 0 0 0 4 6.9v5.6a2.9 2.9 0 0 0 1.9 2.7" />
  </S>
)

/** Share: the iOS box-with-an-arrow, exactly as the pill next to Copy. */
export const Share = (p: IconProps) => (
  <S {...p}>
    <path d="M12 15.2V3.8" />
    <path d="m8.2 7.4 3.8-3.6 3.8 3.6" />
    <path d="M6.6 10.4H5.8A1.8 1.8 0 0 0 4 12.2v6.2a1.8 1.8 0 0 0 1.8 1.8h12.4a1.8 1.8 0 0 0 1.8-1.8v-6.2a1.8 1.8 0 0 0-1.8-1.8h-.8" />
  </S>
)

/** "Show QR code" — the little code glyph, not the viewfinder. */
export const QrCode = ({ size = 24, ...rest }: IconProps) => (
  <S size={size} {...rest} strokeWidth={1.6}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.6" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.6" />
    <path d="M13.5 13.5h3v3h-3zM18 18h2.5v2.5H18zM13.5 19.5h1.6v1.6h-1.6zM19 13.5h1.6v1.6H19z" fill="currentColor" stroke="none" />
  </S>
)

/* ------------------------------------------------------ wallet + security */

export const Lock = (p: IconProps) => (
  <S {...p}>
    <rect x="4.5" y="10.2" width="15" height="10.3" rx="3" />
    <path d="M8 10.2V7.6a4 4 0 0 1 8 0v2.6" />
  </S>
)

/** Seed phrase: a numbered word list. */
export const SeedPhrase = (p: IconProps) => (
  <S {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <path d="M7.4 9.2h1.2M7.4 14.4h1.2" />
    <path d="M11.4 9.2h5.2M11.4 14.4h5.2" />
  </S>
)

/** A Tangem card: rounded plastic with the TT mark embossed on it. */
export const HardwareCard = (p: IconProps) => (
  <S {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="3" />
    <rect x="7.2" y="9" width="9.6" height="2.1" rx="1" fill="currentColor" stroke="none" />
    <rect x="7.2" y="12.4" width="3.6" height="4.2" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.2" y="12.4" width="3.6" height="4.2" rx="1" fill="currentColor" stroke="none" />
  </S>
)

/** "Add mobile wallet" (`IMG_4308`): a grid of squares with a plus. */
export const MobileWallet = (p: IconProps) => (
  <S {...p}>
    <rect x="3.5" y="3.5" width="7.6" height="7.6" rx="2" />
    <rect x="13.4" y="3.5" width="7.6" height="7.6" rx="2" />
    <rect x="3.5" y="13.4" width="7.6" height="7.6" rx="2" />
    <path d="M17.2 13.4v7.6M13.4 17.2h7.6" />
  </S>
)

/** The wallets row in Details (`IMG_4307`): a wallet body with a card in it. */
export const Wallet = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="5.8" width="18" height="13" rx="3.4" />
    <path d="M3 10.2h9.6v4.2H3" />
  </S>
)

/** Address book: a contact card with the page tabs down the spine. */
export const AddressBook = (p: IconProps) => (
  <S {...p}>
    <rect x="5.5" y="3.5" width="14" height="17" rx="3" />
    <circle cx="12.5" cy="10.2" r="2.3" />
    <path d="M8.9 16.6a3.9 3.9 0 0 1 7.2 0" />
    <path d="M4.5 8.2h2M4.5 12h2M4.5 15.8h2" />
  </S>
)

/**
 * The cloud beside the wallet name (`IMG_4306`). Filled — in the shot it is a
 * solid grey shape, not an outline.
 */
export const Cloud = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <path d="M7 19.5a4.6 4.6 0 0 1-.5-9.2 5.6 5.6 0 0 1 10.7-1.1 4.4 4.4 0 0 1 4.3 4.5 4.5 4.5 0 0 1-4.4 5.8H7Z" />
  </F>
)

/* ---------------------------------------------------------- status + info */

/** The Regional Restriction triangle (`IMG_4297`). */
export const Warning = (p: IconProps) => (
  <S {...p}>
    <path d="M10.4 4.3 2.9 17.4a1.9 1.9 0 0 0 1.6 2.8h15a1.9 1.9 0 0 0 1.6-2.8L13.6 4.3a1.9 1.9 0 0 0-3.2 0Z" />
    <path d="M12 9.4v4.2" />
    <path d="M12 16.9h.01" strokeWidth={2.2} />
  </S>
)

/** The circled ⓘ on the wrong-network strip (`IMG_4299`). */
export const Info = (p: IconProps) => (
  <S {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11.2v5" />
    <path d="M12 7.8h.01" strokeWidth={2.2} />
  </S>
)

/** "Quick top up" (`IMG_4299`). */
export const Bolt = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <path d="M13.6 2.5 4.9 13.2a.7.7 0 0 0 .6 1.2h4.3l-1 7.1 8.7-10.7a.7.7 0 0 0-.6-1.2h-4.3l1-7.1Z" />
  </F>
)

/** The Buy row's card glyph (`IMG_4299`). */
export const CreditCard = (p: IconProps) => (
  <S {...p}>
    <rect x="3" y="5.8" width="18" height="12.4" rx="3" />
    <path d="M3 10h18" />
  </S>
)

export const Pencil = (p: IconProps) => (
  <S {...p}>
    <path d="M16.2 3.9a2.3 2.3 0 0 1 3.3 3.3L8.4 18.2 4 19.5l1.3-4.4L16.2 3.9Z" />
  </S>
)

export const Trash = (p: IconProps) => (
  <S {...p}>
    <path d="M4.5 6.6h15" />
    <path d="M9.2 6.6V4.9a1.4 1.4 0 0 1 1.4-1.4h2.8a1.4 1.4 0 0 1 1.4 1.4v1.7" />
    <path d="M6.5 6.6 7.4 19a1.6 1.6 0 0 0 1.6 1.5h6a1.6 1.6 0 0 0 1.6-1.5l.9-12.4" />
  </S>
)

export const ExternalLink = (p: IconProps) => (
  <S {...p}>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4.5A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10" />
  </S>
)

export const Refresh = (p: IconProps) => (
  <S {...p}><path d="M20 12a8 8 0 1 1-2.6-5.9" /><path d="M20 4v4h-4" /></S>
)

/* --------------------------------------------------------- the social row */
/* IMG_4307, bottom: X, Telegram, Instagram, Facebook, LinkedIn, YouTube on
 * the first line; Discord, Reddit, GitHub on the second. All filled, all one
 * grey. Instagram is the one outline mark in the row — that is how the app
 * draws it, not an oversight. */

export const XLogo = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <path d="M3 3h4.6l4.6 6.1L17.7 3h2.1l-6.6 7.6L21 21h-4.6l-4.9-6.5L4.9 21H2.8l7-8L3 3Zm2.9 1.6 10.3 14.8h1.9L7.8 4.6H5.9Z" />
  </F>
)

export const Telegram = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <path d="M21.6 4.1 2.9 11.3c-1 .4-1 1.7.1 2l4.6 1.4 1.7 5.4c.3.9 1.4 1.1 2 .4l2.5-2.6 4.6 3.4c.7.5 1.7.1 1.9-.7l2.9-14.4c.2-1-.8-1.7-1.6-1.1ZM9.4 14.6l8.9-6.4-7.5 7.8-.3 3.2-1.1-4.6Z" />
  </F>
)

export const Instagram = (p: IconProps) => (
  <S {...p} strokeWidth={1.9}>
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.2" />
    <circle cx="12" cy="12" r="4.1" />
    <path d="M16.9 7.1h.01" strokeWidth={2.4} />
  </S>
)

export const Facebook = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest} fillRule="evenodd" clipRule="evenodd">
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm1.2 19.9v-7.2h2.4l.5-2.8h-2.9v-1.8c0-.8.2-1.4 1.5-1.4h1.5V6.2c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.6v2.8H10v7.2h3.2Z" />
  </F>
)

export const LinkedIn = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest} fillRule="evenodd" clipRule="evenodd">
    <path d="M4.5 2h15A2.5 2.5 0 0 1 22 4.5v15a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 19.5v-15A2.5 2.5 0 0 1 4.5 2ZM8 7.4a1.6 1.6 0 1 0-3.2 0 1.6 1.6 0 0 0 3.2 0ZM5.1 10h2.6v8H5.1v-8Zm4.3 0H12v1.1c.4-.7 1.2-1.3 2.4-1.3 2 0 3.2 1.2 3.2 3.5V18H15v-4.2c0-1.1-.4-1.7-1.3-1.7s-1.5.6-1.5 1.8V18H9.4v-8Z" />
  </F>
)

export const YouTube = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest} fillRule="evenodd" clipRule="evenodd">
    <path d="M12 4.5c3.1 0 5.8.2 7 .3 1.2.1 2.2 1 2.4 2.2.2 1.2.3 2.5.3 3.9v2.2c0 1.4-.1 2.7-.3 3.9a2.9 2.9 0 0 1-2.4 2.2c-1.2.1-3.9.3-7 .3s-5.8-.2-7-.3a2.9 2.9 0 0 1-2.4-2.2c-.2-1.2-.3-2.5-.3-3.9v-2.2c0-1.4.1-2.7.3-3.9A2.9 2.9 0 0 1 5 4.8c1.2-.1 3.9-.3 7-.3Zm-1.8 4.6v5.8l5-2.9-5-2.9Z" />
  </F>
)

export const Discord = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest} fillRule="evenodd" clipRule="evenodd">
    <path d="M19.3 5.4A16.5 16.5 0 0 0 15.2 4l-.3.5c1.4.35 2.6.9 3.7 1.6a13.6 13.6 0 0 0-13.2 0c1.1-.7 2.3-1.25 3.7-1.6L8.8 4a16.5 16.5 0 0 0-4.1 1.4C2.4 9.2 1.7 12.9 2 16.6a16.6 16.6 0 0 0 5 2.5l.6-1.5c-.6-.2-1.2-.5-1.7-.8l.4-.3a11.9 11.9 0 0 0 11.4 0l.4.3c-.5.3-1.1.6-1.7.8l.6 1.5a16.6 16.6 0 0 0 5-2.5c.4-4.3-.6-7.9-2.7-11.2ZM8.7 14.4c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Zm6.6 0c-1 0-1.8-.9-1.8-2s.8-2 1.8-2 1.8.9 1.8 2-.8 2-1.8 2Z" />
  </F>
)

export const Reddit = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest} fillRule="evenodd" clipRule="evenodd">
    <path d="M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19ZM9 11.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm6 0a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Zm-6.8 4.2c1 1 2.3 1.5 3.8 1.5s2.8-.5 3.8-1.5l.9.9c-1.3 1.3-2.9 1.9-4.7 1.9s-3.4-.6-4.7-1.9l.9-.9Z" />
  </F>
)

export const GitHub = ({ size = 24, ...rest }: IconProps) => (
  <F size={size} {...rest}>
    <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49l-.01-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9l-.01 2.82c0 .27.18.59.69.49A10.07 10.07 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
  </F>
)

/**
 * The social row in the order `IMG_4307` prints it. Links point at Tangem's
 * real accounts; nothing here is fetched.
 */
export const SOCIALS: readonly { name: string; Icon: IconComponent; href: string }[] = [
  { name: 'X', Icon: XLogo, href: 'https://x.com/tangem' },
  { name: 'Telegram', Icon: Telegram, href: 'https://t.me/tangem_chat' },
  { name: 'Instagram', Icon: Instagram, href: 'https://instagram.com/tangemwallet' },
  { name: 'Facebook', Icon: Facebook, href: 'https://facebook.com/tangemwallet' },
  { name: 'LinkedIn', Icon: LinkedIn, href: 'https://linkedin.com/company/tangem' },
  { name: 'YouTube', Icon: YouTube, href: 'https://youtube.com/@tangem_official' },
  { name: 'Discord', Icon: Discord, href: 'https://discord.gg/tangem' },
  { name: 'Reddit', Icon: Reddit, href: 'https://reddit.com/r/Tangem' },
  { name: 'GitHub', Icon: GitHub, href: 'https://github.com/tangem' },
] as const
