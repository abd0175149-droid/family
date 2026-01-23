import { prisma } from '@/lib/prisma'

export interface CreateAuditLogData {
  userId: string
  action: string
  resource?: string
  resourceId?: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export class AuditService {
  static async createLog(data: CreateAuditLogData) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        resource: data.resource,
        resourceId: data.resourceId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    })
  }

  static async getLogs(
    userId?: string,
    resource?: string,
    limit: number = 100
  ) {
    const where: any = {}
    if (userId) where.userId = userId
    if (resource) where.resource = resource

    return prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    })
  }
}
