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
      <body>{children}</body>
    </html>
  )
}
