import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  fullName: string
  status: string
}

const AUTH_SECRET = process.env.AUTH_SECRET || 'default-secret-change-in-production'

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    },
    AUTH_SECRET,
    { expiresIn: '7d' }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, AUTH_SECRET) as AuthUser
    return decoded
  } catch (error) {
    return null
  }
}

export async function getAuthUser(request: NextRequest): Promise<AuthUser | null> {
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  const user = verifyToken(token)
  if (!user) {
    return null
  }

  // Verify user still exists and is active
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true, fullName: true, status: true },
  })

  if (!dbUser || dbUser.status !== 'active') {
    return null
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    role: dbUser.role,
    fullName: dbUser.fullName,
    status: dbUser.status,
  }
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set('auth-token', '', {
    maxAge: 0,
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  })
}
