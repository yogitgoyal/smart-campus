import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { name: true, email: true } },
        section: { include: { class: true } }
      }
    })
    if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

    const classId = student.section?.classId
    const sectionId = student.sectionId

    // Everything below is scoped to THIS student's own section/class --
    // a student should never see another class's assignments, attendance,
    // or notices just because the query forgot to filter.
    const [attendanceSessions, assignments, notices, notes] = await Promise.all([
      sectionId
        ? prisma.attendanceSession.findMany({
            where: { sectionId },
            include: {
              records: { where: { studentId } },
              section: { include: { class: true } }
            },
            orderBy: { date: 'desc' },
            take: 30
          })
        : Promise.resolve([]),
      classId
        ? prisma.assignment.findMany({
            where: { classId },
            include: { teacher: { include: { user: true } }, subject: true, class: true },
            orderBy: { createdAt: 'desc' },
            take: 10
          })
        : Promise.resolve([]),
      prisma.notice.findMany({
        // school-wide notices (classId null) plus ones aimed at this student's class
        where: classId ? { OR: [{ classId: null }, { classId }] } : { classId: null },
        include: { author: true },
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: 5
      }),
      prisma.note.findMany({
        where: sectionId ? { OR: [{ sectionId: null }, { sectionId }] } : { sectionId: null },
        include: { teacher: { include: { user: true } }, subject: true },
        orderBy: { createdAt: 'desc' },
        take: 6
      })
    ])

    return NextResponse.json({ student, attendanceSessions, assignments, notices, notes })
  } catch (error) {
    console.error('Student dashboard error:', error)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}