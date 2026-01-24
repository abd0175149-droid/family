'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      try {
        const key = 'chunk_reload_cnt'
        const n = parseInt(sessionStorage.getItem(key) || '0', 10)
        if (n < 1) {
          sessionStorage.setItem(key, '1')
          const u = new URL(window.location.href)
          u.searchParams.set('_nc', String(Date.now()))
          setTimeout(() => window.location.replace(u.toString()), 800)
          return
        }
      } catch (_) {}
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      if (this.state.error?.name === 'ChunkLoadError' || this.state.error?.message?.includes('Loading chunk')) {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-5xl">🔄</div>
              <h2 className="text-xl font-bold text-olive-900 dark:text-olive-100">
                جاري تحديث الصفحة...
              </h2>
              <p className="text-olive-600 dark:text-olive-400">
                يرجى الانتظار قليلاً بينما نقوم بإعادة تحميل الصفحة
              </p>
            </div>
          </div>
        )
      }

      return (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-olive-900 dark:text-olive-100">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-olive-600 dark:text-olive-400">
              {this.state.error?.message || 'حدث خطأ أثناء تحميل الصفحة'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 gradient-primary text-white font-semibold rounded-xl elegant-shadow hover:shadow-glow transition-all"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
