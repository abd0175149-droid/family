import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/middleware/auth'

export async function POST() {
  const response = NextResponse.json({ message: 'تم تسجيل الخروج بنجاح' })
  clearAuthCookie(response)
  return response
}
