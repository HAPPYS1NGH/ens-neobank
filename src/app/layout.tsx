import type { Metadata, Viewport } from 'next'
import { brand } from '@config'
import { brandColorCss } from '@/config/tokens'
import './globals.css'

export const metadata: Metadata = {
  title: brand.copy.title,
  description: brand.copy.description,
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: brand.colors.themeColor,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme={brand.theme}>
      <body>
        <style dangerouslySetInnerHTML={{ __html: brandColorCss(brand.colors) }} />
        {children}
      </body>
    </html>
  )
}
