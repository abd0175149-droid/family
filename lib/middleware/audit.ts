import { NextRequest } from 'next/server'
import { AuditService } from '@/lib/services/AuditService'
import { AuthUser } from './auth'

export async function logAction(
  user: AuthUser,
  action: string,
  request: NextRequest,
  options?: {
    resource?: string
    resourceId?: string
    details?: string
  }
) {
  try {
    const ipAddress = request.ip || request.headers.get('x-forwarded-for') || undefined
    const userAgent = request.headers.get('user-agent') || undefined

    await AuditService.createLog({
      userId: user.id,
      action,
      resource: options?.resource,
      resourceId: options?.resourceId,
      details: options?.details,
      ipAddress: ipAddress || undefined,
      userAgent,
    })
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Error creating audit log:', error)
  }
}
