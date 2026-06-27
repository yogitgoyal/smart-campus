import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/student/notices?studentId=xxx
// Returns school-wide notices (classId null) plus notices targeted at this
// student's own class. No Clerk session required -- students authenticate
// via their own password-on-User.avatar flow, not Clerk, so this route must
// be reachable per middleware's isPublicRoute list.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')

    let classId: string | null = null
    if (studentId) {
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { section: { include: { class: true } } }
      })
      classId = student?.section?.classId ?? null
    }

    const notices = await prisma.notice.findMany({
      where: studentId
        ? { OR: [{ classId: null }, ...(classId ? [{ classId }] : [])] }
        : { classId: null }, // no studentId given: only school-wide notices
      include: { author: { select: { name: true } } },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(notices)
  } catch (error) {
    console.error('GET /api/student/notices error:', error)
    return NextResponse.json([])
  }
}