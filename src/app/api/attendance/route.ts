import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// GET /api/attendance?sectionId=xxx&date=2026-06-26
// Returns attendance sessions, optionally filtered to one section and/or one date.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId')
    const date = searchParams.get('date')

    const where: any = {}
    if (sectionId) where.sectionId = sectionId
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    const sessions = await prisma.attendanceSession.findMany({
      where,
      include: {
        records: { include: { student: { include: { user: true } } } },
        section: { include: { class: true } },
        teacher: { include: { user: true } }
      },
      orderBy: { date: 'desc' },
      take: sectionId ? undefined : 20, // unfiltered history: cap it; per-section: show all
    })
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('GET /api/attendance error:', error)
    return NextResponse.json([])
  }
}

// POST /api/attendance
// body: { sectionId: string, date: string, records: { studentId, status, remarks? }[] }
// Resolves the real logged-in user -> their Teacher row (creating one only if this
// admin/teacher genuinely has none yet) and upserts ONE session per (sectionId, date),
// so re-marking the same day updates existing records instead of duplicating sessions.
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { sectionId, date, records } = body

    if (!sectionId) return NextResponse.json({ error: 'sectionId is required' }, { status: 400 })
    if (!date) return NextResponse.json({ error: 'date is required' }, { status: 400 })

    const section = await prisma.section.findUnique({ where: { id: sectionId } })
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })

    // Resolve the real logged-in user.
    const user = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ error: 'User not found. Please contact an administrator.' }, { status: 400 })

    // A Teacher row is required by the schema's AttendanceSession.teacherId relation.
    // Admins marking attendance need a Teacher row too -- create one tied to their
    // real User if missing, but never fabricate a separate fake admin/user/school.
    let teacher = await prisma.teacher.findUnique({ where: { userId: user.id } })
    if (!teacher) {
      teacher = await prisma.teacher.create({ data: { userId: user.id } })
    }

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    // Look for an existing session for this exact section + day.
    let session = await prisma.attendanceSession.findFirst({
      where: { sectionId, date: { gte: dayStart, lte: dayEnd } }
    })

    if (session) {
      // Re-marking the same day: clear old records, write the new ones.
      await prisma.attendanceRecord.deleteMany({ where: { sessionId: session.id } })
    } else {
      session = await prisma.attendanceSession.create({
        data: {
          date: new Date(date),
          sectionId,
          teacherId: teacher.id,
        }
      })
    }

    if (Array.isArray(records) && records.length > 0) {
      await prisma.attendanceRecord.createMany({
        data: records.map((r: { studentId: string; status: string; remarks?: string }) => ({
          sessionId: session!.id,
          studentId: r.studentId,
          status: r.status,
          remarks: r.remarks || null,
        }))
      })
    }

    const full = await prisma.attendanceSession.findUnique({
      where: { id: session.id },
      include: {
        records: { include: { student: { include: { user: true } } } },
        section: { include: { class: true } },
        teacher: { include: { user: true } }
      }
    })

    return NextResponse.json(full)
  } catch (error) {
    console.error('POST /api/attendance error:', error)
    return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 })
  }
}