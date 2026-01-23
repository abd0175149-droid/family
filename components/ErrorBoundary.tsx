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
    
    // إذا كان ChunkLoadError، حاول إعادة تحميل الصفحة
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      // انتظر قليلاً ثم أعد تحميل الصفحة
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // إذا كان ChunkLoadError، عرض رسالة مع إعادة تحميل
      if (this.state.error?.name === 'ChunkLoadError' || this.state.error?.message?.includes('Loading chunk')) {
        return (
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-5xl">🔄</div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                جاري تحديث الصفحة...
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
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
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              حدث خطأ غير متوقع
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {this.state.error?.message || 'حدث خطأ أثناء تحميل الصفحة'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold rounded-lg elegant-shadow hover:shadow-lg transition-all"
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
