'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      if (!response.ok) {
        let errorData: any = { error: 'خطأ غير معروف' }
        try {
          const text = await response.text()
          if (text) {
            errorData = JSON.parse(text)
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorData = { error: `خطأ ${response.status}: ${response.statusText}` }
        }
        
        const errorMessage = errorData.error || errorData.message || 'حدث خطأ أثناء تسجيل الدخول'
        const errorDetails = errorData.details ? `\n${errorData.details}` : ''
        
        setError(errorMessage + errorDetails)
        console.error('Login error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        setLoading(false)
        return
      }

      const data = await response.json()
      console.log('Login success:', data)
      window.location.replace('/tree')
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'حدث خطأ أثناء تسجيل الدخول. تحقق من اتصال الإنترنت.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-olive-50 via-gold-50/60 to-olive-100 dark:from-olive-950 dark:via-olive-900 dark:to-olive-950 p-4 sm:p-6">
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-white/90 dark:bg-olive-950/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-olive-200/50 dark:border-olive-800/50 overflow-hidden">
          <div className="gradient-primary p-6 sm:p-8 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-glow">
              <span className="text-3xl sm:text-4xl">🌳</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">مرحباً بك</h2>
            <p className="text-gold-100 text-sm opacity-90">منصة عائلية متكاملة</p>
          </div>

          {/* Form */}
          <form className="p-6 sm:p-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl animate-slide-down flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-olive-800 dark:text-olive-200 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-olive-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-olive-200 dark:border-olive-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent bg-white dark:bg-olive-900/50 text-olive-900 dark:text-olive-50 transition-all"
                    placeholder="example@family.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-olive-800 dark:text-olive-200 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-olive-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-olive-200 dark:border-olive-700 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-olive-500 focus:border-transparent bg-white dark:bg-olive-900/50 text-olive-900 dark:text-olive-50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-white font-semibold py-3.5 px-4 rounded-xl shadow-lg hover:shadow-glow transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري تسجيل الدخول...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>
          <p className="text-center text-olive-600 dark:text-olive-400 text-xs px-6 sm:px-8 pb-6">
            إذا واجهتك مشكلة في التوجيه أو التصميم، جرّب التحديث القسري (Ctrl+Shift+R) أو مسح كاش الموقع.
          </p>
        </div>

        <div className="absolute top-10 left-10 w-72 h-72 bg-olive-300/20 rounded-full blur-3xl -z-10 animate-pulse" aria-hidden />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold-400/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" aria-hidden />
      </div>
    </div>
  )
}
