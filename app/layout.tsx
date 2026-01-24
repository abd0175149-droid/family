import type { Metadata } from 'next'
import './globals.css'
import ErrorBoundaryWrapper from '@/components/ErrorBoundaryWrapper'

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
(function() {
  var key = 'chunk_reload_cnt';
  var versionKey = 'app_version';
  if (typeof window !== 'undefined' && window.location.search.indexOf('_nc=') >= 0) {
    try { sessionStorage.removeItem(key); } catch (_) {}
  }
  (function checkVersion() {
    try {
      var stored = localStorage.getItem(versionKey);
      fetch('/api/version', { cache: 'no-store' }).then(function(r) { return r.json(); }).then(function(d) {
        var v = d && d.version;
        if (!v) return;
        if (stored !== null && stored !== v) {
          localStorage.setItem(versionKey, v);
          fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(function(){}).then(function() {
            var u = new URL(window.location.href);
            u.searchParams.set('_v', Date.now());
            window.location.replace(u.toString());
          });
          return;
        }
        if (stored === null) {
          localStorage.setItem(versionKey, v);
        }
      }).catch(function() {});
    } catch (_) {}
  })();
  function isChunkError(e) {
    if (!e) return false;
    var msg = (e.message || (e.reason && e.reason.message) || '') + '';
    var name = (e.name || (e.reason && e.reason.name) || '') + '';
    return name === 'ChunkLoadError' || msg.indexOf('Loading chunk') >= 0 || msg.indexOf('Failed to fetch dynamically imported module') >= 0;
  }
  function reloadWithoutCache() {
    var n = parseInt(sessionStorage.getItem(key) || '0', 10);
    if (n >= 1) return false;
    sessionStorage.setItem(key, String(n + 1));
    var u = new URL(window.location.href);
    u.searchParams.set('_nc', Date.now());
    window.location.replace(u.toString());
    return true;
  }
  window.addEventListener('error', function(ev) {
    if (isChunkError(ev.error) || (ev.message && ev.message.indexOf('Loading chunk') >= 0)) {
      if (ev.preventDefault) ev.preventDefault();
      reloadWithoutCache();
    }
  }, true);
  window.addEventListener('unhandledrejection', function(ev) {
    if (isChunkError(ev.reason)) {
      if (ev.preventDefault) ev.preventDefault();
      reloadWithoutCache();
    }
  }, true);
})();
            `,
          }}
        />
      </head>
      <body>
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
      </body>
    </html>
  )
}
