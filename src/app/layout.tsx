import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: "Tangem × ENS",
  description:
    "A Tangem wallet UI demo where naming your wallet issues a real ENS subname.",
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#FFFFFF',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
