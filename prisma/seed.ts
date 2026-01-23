import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('بدء seeding...')

  // إنشاء مستخدم مدير عام
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@family.com' },
    update: {},
    create: {
      email: 'admin@family.com',
      fullName: 'مدير النظام',
      passwordHash: adminPassword,
      role: 'super_admin',
      status: 'active',
    },
  })

  console.log('تم إنشاء المستخدم:', admin.email)

  // إنشاء أمين صندوق
  const treasurerPassword = await bcrypt.hash('treasurer123', 10)
  const treasurer = await prisma.user.upsert({
    where: { email: 'treasurer@family.com' },
    update: {},
    create: {
      email: 'treasurer@family.com',
      fullName: 'أمين الصندوق',
      passwordHash: treasurerPassword,
      role: 'treasurer',
      status: 'active',
    },
  })

  console.log('تم إنشاء أمين الصندوق:', treasurer.email)

  // إنشاء أمين سر
  const secretaryPassword = await bcrypt.hash('secretary123', 10)
  const secretary = await prisma.user.upsert({
    where: { email: 'secretary@family.com' },
    update: {},
    create: {
      email: 'secretary@family.com',
      fullName: 'أمين السر',
      passwordHash: secretaryPassword,
      role: 'secretary',
      status: 'active',
    },
  })

  console.log('تم إنشاء أمين السر:', secretary.email)

  // إنشاء عضو
  const memberPassword = await bcrypt.hash('member123', 10)
  const member = await prisma.user.upsert({
    where: { email: 'member@family.com' },
    update: {},
    create: {
      email: 'member@family.com',
      fullName: 'عضو تجريبي',
      passwordHash: memberPassword,
      role: 'member',
      status: 'active',
    },
  })

  console.log('تم إنشاء العضو:', member.email)

  console.log('اكتمل seeding!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
