import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/student/timetable?studentId=xxx
// Returns ONLY this student's own section's slots. Without studentId (or if
// the student has no section yet) returns [] -- never falls back to showing
// every section's timetable mixed together.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json([])

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { sectionId: true }
    })
    if (!student?.sectionId) return NextResponse.json([])

    const slots = await prisma.timetableSlot.findMany({
      where: { sectionId: student.sectionId },
      include: {
        subject: true,
        teacher: { include: { user: { select: { name: true } } } },
        section: { include: { class: true } }
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }]
    })

    return NextResponse.json(slots)
  } catch (error) {
    console.error('GET /api/student/timetable error:', error)
    return NextResponse.json([])
  }
}