import { prisma } from '@/lib/prisma'
import { UserRole, UserStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

export interface CreateUserData {
  fullName: string
  email: string
  phone?: string
  password: string
  role: UserRole
  personId?: string
}

export interface UpdateUserData {
  fullName?: string
  email?: string
  phone?: string
  role?: UserRole
  status?: UserStatus
  personId?: string
}

export class UserService {
  static async getUsers(role?: UserRole, status?: UserStatus) {
    const where: any = {}
    if (role) where.role = role
    if (status) where.status = status

    return prisma.user.findMany({
      where,
      include: {
        person: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  static async getUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        person: true,
      },
    })
  }

  static async getUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        person: true,
      },
    })
  }

  static async createUser(data: CreateUserData) {
    const passwordHash = await bcrypt.hash(data.password, 10)

    return prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash,
        role: data.role,
        personId: data.personId,
        status: 'active',
      },
      include: {
        person: true,
      },
    })
  }

  static async updateUser(id: string, data: UpdateUserData) {
    const updateData: any = { ...data }
    delete updateData.password

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        person: true,
      },
    })
  }

  static async suspendUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: 'suspended' },
    })
  }

  static async activateUser(id: string) {
    return prisma.user.update({
      where: { id },
      data: { status: 'active' },
    })
  }

  static async linkUserToPerson(userId: string, personId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { personId },
    })
  }

  static async verifyPassword(email: string, password: string) {
    const user = await this.getUserByEmail(email)
    if (!user) {
      return null
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return null
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return user
  }

  static async changePassword(userId: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    return prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
  }
}
