import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/student/notes?studentId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    let sectionId: string | null = null
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        select: { sectionId: true }
      })
      sectionId = student?.sectionId ?? null
    }

    const notes = await prisma.note.findMany({
      where: studentId
        ? { OR: [{ sectionId: null }, ...(sectionId ? [{ sectionId }] : [])] }
        : { sectionId: null },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        subject: true,
        section: { include: { class: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notes)
  } catch (error) {
    console.error('GET /api/student/notes error:', error)
    return NextResponse.json([])
  }
}