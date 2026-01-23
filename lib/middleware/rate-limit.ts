import { NextRequest, NextResponse } from 'next/server'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

export function rateLimit(
  maxRequests: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  return (request: NextRequest): NextResponse | null => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const key = `rate-limit:${ip}`

    const record = store[key]

    if (!record || now > record.resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      }
      return null
    }

    if (record.count >= maxRequests) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً' },
        { status: 429 }
      )
    }

    record.count++
    return null
  }
}

// Cleanup old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Object.keys(store).forEach((key) => {
      if (store[key].resetTime < now) {
        delete store[key]
      }
    })
  }, 60 * 1000) // Every minute
}
