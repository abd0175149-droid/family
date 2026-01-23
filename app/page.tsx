'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    // إعادة التوجيه إلى صفحة تسجيل الدخول
    router.push('/login')
  }, [router])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">منصة عائلية</h1>
      <p className="text-lg">جاري التوجيه...</p>
    </main>
  )
}
