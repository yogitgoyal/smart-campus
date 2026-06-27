import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Starter periods created the first time a class has none configured yet —
// matches your old hardcoded 8-period layout with one break after P4, so
// nothing changes visually until someone actually edits it on the Configure
// Periods screen.
const DEFAULT_PERIODS = [
  { order: 1, periodNumber: 1, label: 'P1', startTime: '08:00', endTime: '08:45', isBreak: false },
  { order: 2, periodNumber: 2, label: 'P2', startTime: '08:45', endTime: '09:30', isBreak: false },
  { order: 3, periodNumber: 3, label: 'P3', startTime: '09:45', endTime: '10:30', isBreak: false },
  { order: 4, periodNumber: 4, label: 'P4', startTime: '10:30', endTime: '11:15', isBreak: false },
  { order: 5, periodNumber: null, label: 'Break', startTime: '11:15', endTime: '11:30', isBreak: true },
  { order: 6, periodNumber: 5, label: 'P5', startTime: '11:30', endTime: '12:15', isBreak: false },
  { order: 7, periodNumber: 6, label: 'P6', startTime: '12:15', endTime: '13:00', isBreak: false },
  { order: 8, periodNumber: 7, label: 'P7', startTime: '13:45', endTime: '14:30', isBreak: false },
  { order: 9, periodNumber: 8, label: 'P8', startTime: '14:30', endTime: '15:15', isBreak: false },
]

// GET /api/periods?classId=xxx
// Returns a class's real period structure. Auto-creates the default set the
// first time a class is requested with none, per your decision — so the
// Configure Periods screen and the Timetable grid are never empty on first use.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const classId = searchParams.get('classId')
    if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 })

    let periods = await prisma.period.findMany({
      where: { classId },
      orderBy: { order: 'asc' }
    })

    if (periods.length === 0) {
      const cls = await prisma.class.findUnique({ where: { id: classId } })
      if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

      await prisma.period.createMany({
        data: DEFAULT_PERIODS.map(p => ({ ...p, classId }))
      })
      periods = await prisma.period.findMany({
        where: { classId },
        orderBy: { order: 'asc' }
      })
    }

    return NextResponse.json(periods)
  } catch (error) {
    console.error('GET /api/periods error:', error)
    return NextResponse.json({ error: 'Failed to load periods' }, { status: 500 })
  }
}

// POST /api/periods
// Bulk save — the Configure Periods screen always sends the FULL ordered list
// for one class. Adds, edits, removes, and reorders all collapse into a single
// save, so there's no separate add/delete/reorder endpoint to keep in sync.
//
// order and periodNumber are re-derived here from array position, never trusted
// from the client — a client-side reorder or delete must not be able to produce
// duplicate/skip values that violate @@unique([classId, order]), and only this
// route's logic should decide which rows count toward TimetableSlot.period.
export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { classId, periods } = body as {
      classId: string
      periods: Array<{ label: string; startTime: string; endTime: string; isBreak: boolean }>
    }

    if (!classId) return NextResponse.json({ error: 'classId is required' }, { status: 400 })
    if (!Array.isArray(periods) || periods.length === 0) {
      return NextResponse.json({ error: 'At least one period is required' }, { status: 400 })
    }

    let teachingCount = 0
    const normalized = periods.map((p, i) => {
      const isBreak = !!p.isBreak
      if (!isBreak) teachingCount += 1
      return {
        classId,
        order: i + 1,
        periodNumber: isBreak ? null : teachingCount,
        label: p.label?.trim() || (isBreak ? 'Break' : `P${teachingCount}`),
        startTime: p.startTime,
        endTime: p.endTime,
        isBreak,
      }
    })

    // Replace the whole set in one transaction so a half-applied save can
    // never leave a stale row from a deleted/reordered entry behind.
    await prisma.$transaction([
      prisma.period.deleteMany({ where: { classId } }),
      prisma.period.createMany({ data: normalized }),
    ])

    const saved = await prisma.period.findMany({ where: { classId }, orderBy: { order: 'asc' } })
    return NextResponse.json(saved)
  } catch (error) {
    console.error('POST /api/periods error:', error)
    return NextResponse.json({ error: 'Failed to save periods' }, { status: 500 })
  }
}