import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/middleware/rbac'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { join } from 'path'

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(request, async () => {
    try {
      const file = await prisma.file.findUnique({
        where: { id: params.id },
      })

      if (!file) {
        return NextResponse.json(
          { error: 'الملف غير موجود' },
          { status: 404 }
        )
      }

      const filePath = join(process.cwd(), UPLOAD_DIR, file.filePath.replace('/uploads/', ''))

      try {
        const fileBuffer = await readFile(filePath)
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': file.mimeType,
            'Content-Disposition': `inline; filename="${file.fileName}"`,
          },
        })
      } catch (error) {
        return NextResponse.json(
          { error: 'الملف غير موجود على الخادم' },
          { status: 404 }
        )
      }
    } catch (error) {
      console.error('Error fetching file:', error)
      return NextResponse.json(
        { error: 'حدث خطأ أثناء جلب الملف' },
        { status: 500 }
      )
    }
  })
}
