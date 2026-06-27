import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    if (!studentId) return NextResponse.json({ error: 'Student ID required' }, { status: 400 })

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    // No section assigned yet -- return empty, never "all sections" (that would
    // leak every other class's attendance history to this student).
    if (!student || !student.sectionId) return NextResponse.json([], { status: 200 })

    const sessions = await prisma.attendanceSession.findMany({
      where: { sectionId: student.sectionId },
      include: {
        records: { where: { studentId } },
        section: { include: { class: true } }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Student attendance error:', error)
    return NextResponse.json([], { status: 200 })
  }
}