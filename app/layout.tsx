import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'منصة عائلية',
  description: 'منصة عائلية متكاملة لإدارة الشجرة العائلية والمالية والاجتماعات',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body>{children}</body>
    </html>
  )
}
