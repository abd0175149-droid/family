import type { Metadata } from 'next'
import './globals.css'
import { ErrorBoundary } from '@/components/ErrorBoundary'

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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // معالجة ChunkLoadError تلقائياً
              if (typeof window !== 'undefined') {
                window.addEventListener('error', function(event) {
                  if (event.error?.name === 'ChunkLoadError' || 
                      event.message?.includes('Loading chunk') ||
                      event.message?.includes('Failed to fetch dynamically imported module')) {
                    console.warn('ChunkLoadError detected, reloading page...');
                    setTimeout(function() {
                      window.location.reload();
                    }, 1000);
                  }
                });
                
                window.addEventListener('unhandledrejection', function(event) {
                  if (event.reason?.name === 'ChunkLoadError' || 
                      event.reason?.message?.includes('Loading chunk')) {
                    console.warn('ChunkLoadError in promise, reloading page...');
                    setTimeout(function() {
                      window.location.reload();
                    }, 1000);
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}
