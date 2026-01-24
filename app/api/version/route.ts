import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

let cached: string | null = null

function getBuildId(): string {
  if (cached) return cached
  try {
    const p = join(process.cwd(), '.next', 'BUILD_ID')
    cached = readFileSync(p, 'utf8').trim()
    return cached
  } catch {
    cached = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'dev'
    return cached
  }
}

export async function GET() {
  return NextResponse.json(
    { version: getBuildId() },
    { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
  )
}
