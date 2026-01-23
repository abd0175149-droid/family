import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser, AuthUser } from './auth'
import { PERMISSIONS, ROLE_PERMISSIONS, Permission, Role } from '@/lib/constants/permissions'

export function checkPermission(user: AuthUser, permission: Permission): boolean {
  const userPermissions = ROLE_PERMISSIONS[user.role as Role] || []
  return userPermissions.includes(permission)
}

export function requireRole(roles: Role[]): (user: AuthUser) => boolean {
  return (user: AuthUser) => roles.includes(user.role as Role)
}

export function requirePermission(permission: Permission): (user: AuthUser) => boolean {
  return (user: AuthUser) => checkPermission(user, permission)
}

export async function withAuth(
  request: NextRequest,
  handler: (user: AuthUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  return handler(user, request)
}

export async function withPermission(
  request: NextRequest,
  permission: Permission,
  handler: (user: AuthUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  if (!checkPermission(user, permission)) {
    return NextResponse.json({ error: 'ليس لديك الصلاحية' }, { status: 403 })
  }

  return handler(user, request)
}

export async function withRole(
  request: NextRequest,
  roles: Role[],
  handler: (user: AuthUser, request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const user = await getAuthUser(request)

  if (!user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  if (!roles.includes(user.role as Role)) {
    return NextResponse.json({ error: 'ليس لديك الصلاحية' }, { status: 403 })
  }

  return handler(user, request)
}
