import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/student/assignments?studentId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json([])

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: { section: { include: { class: true } } }
    })
    const classId = student?.section?.classId
    if (!classId) return NextResponse.json([])

    const assignments = await prisma.assignment.findMany({
      where: { classId },
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        subject: true,
        class: true,
        submissions: { where: { studentId } } // so the page can tell if THIS student already submitted
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(assignments)
  } catch (error) {
    console.error('GET /api/student/assignments error:', error)
    return NextResponse.json([])
  }
}