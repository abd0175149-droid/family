import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
]

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const formData = await request.formData()
      const file = formData.get('file') as File

      if (!file) {
        return NextResponse.json(
          { error: 'لم يتم رفع ملف' },
          { status: 400 }
        )
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'حجم الملف كبير جداً (الحد الأقصى 10MB)' },
          { status: 400 }
        )
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: 'نوع الملف غير مدعوم' },
          { status: 400 }
        )
      }

      // Create upload directory if it doesn't exist
      const uploadPath = join(process.cwd(), UPLOAD_DIR)
      if (!existsSync(uploadPath)) {
        await mkdir(uploadPath, { recursive: true })
      }

      // Generate unique filename
      const timestamp = Date.now()
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const fileName = `${timestamp}_${sanitizedFileName}`
      const filePath = join(uploadPath, fileName)

      // Save file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // Save file record to database
      const fileRecord = await prisma.file.create({
        data: {
          fileName: file.name,
          filePath: `/uploads/${fileName}`,
          mimeType: file.type,
          fileSize: file.size,
          uploadedBy: user.id,
        },
      })

      return NextResponse.json({
        id: fileRecord.id,
        fileName: fileRecord.fileName,
        filePath: fileRecord.filePath,
        mimeType: fileRecord.mimeType,
        fileSize: fileRecord.fileSize,
      })
    } catch (error) {
      console.error('Error uploading file:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء رفع الملف' },
        { status: 500 }
      )
    }
  })
}
