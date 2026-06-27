import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'

// GET /api/timetable?sectionId=xxx
// Without sectionId, returns nothing -- the page always has a section selected
// before it asks for slots, so slots from different sections never mix in one grid.
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sectionId = searchParams.get('sectionId')
    if (!sectionId) return NextResponse.json([])

    const slots = await prisma.timetableSlot.findMany({
      where: { sectionId },
      include: {
        subject: true,
        teacher: { include: { user: true } },
        section: { include: { class: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }]
    })
    return NextResponse.json(slots)
  } catch (error) {
    console.error('GET /api/timetable error:', error)
    return NextResponse.json([])
  }
}

async function resolveSubject(classId: string, name: string) {
  const existing = await prisma.subject.findFirst({ where: { name, classId } })
  if (existing) return existing
  return prisma.subject.create({ data: { name, classId } })
}

async function resolveTeacherId(schoolId: string, name: string | undefined) {
  const cleanName = name?.trim()
  if (!cleanName) return null

  let teacherUser = await prisma.user.findFirst({
    where: { name: { equals: cleanName, mode: 'insensitive' }, role: 'TEACHER' }
  })
  if (!teacherUser) {
    teacherUser = await prisma.user.create({
      data: {
        clerkId: `teacher_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        email: `${cleanName.toLowerCase().replace(/\s+/g, '.')}.${Date.now()}@temp.local`,
        name: cleanName,
        role: 'TEACHER',
        schoolId,
      }
    })
  }

  let teacher = await prisma.teacher.findUnique({ where: { userId: teacherUser.id } })
  if (!teacher) {
    teacher = await prisma.teacher.create({ data: { userId: teacherUser.id } })
  }
  return teacher.id
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { sectionId, subjectName, teacherName, dayOfWeek, period, startTime, endTime, room } = body

    if (!sectionId) return NextResponse.json({ error: 'sectionId is required' }, { status: 400 })
    if (!subjectName?.trim()) return NextResponse.json({ error: 'Subject name required' }, { status: 400 })

    const section = await prisma.section.findUnique({ where: { id: sectionId }, include: { class: true } })
    if (!section) return NextResponse.json({ error: 'Section not found' }, { status: 404 })

    const dayInt = parseInt(dayOfWeek)
    const periodInt = parseInt(period)

    // Subject resolution, teacher resolution, and the existing-slot check are
    // all independent of each other -- running them together (instead of one
    // after another, as the old getOrCreate-style code did) is the actual fix
    // for the "saves but slowly" report. It collapses up to ~6 sequential DB
    // round trips down to about 2.
    const [subject, teacherId, existingSlot] = await Promise.all([
      resolveSubject(section.classId, subjectName.trim()),
      resolveTeacherId(section.class.schoolId, teacherName),
      prisma.timetableSlot.findUnique({
        where: { sectionId_dayOfWeek_period: { sectionId, dayOfWeek: dayInt, period: periodInt } }
      })
    ])

    const slotData = { subjectId: subject.id, teacherId, startTime, endTime, room: room || null }
    const slotInclude = { subject: true, teacher: { include: { user: true } }, section: { include: { class: true } } }

    let slot
    if (existingSlot) {
      slot = await prisma.timetableSlot.update({ where: { id: existingSlot.id }, data: slotData, include: slotInclude })
    } else {
      try {
        slot = await prisma.timetableSlot.create({
          data: { sectionId, dayOfWeek: dayInt, period: periodInt, ...slotData },
          include: slotInclude
        })
      } catch (err) {
        // Race-condition guard: if a second request for this exact slot (e.g. a
        // double-click on Save before the button disables, or a slow first save
        // that creates a brand-new teacher) lands between our existence check
        // above and this insert, Prisma throws P2002 here instead of one of the
        // two requests winning cleanly. Don't crash the request for that --
        // whichever row actually exists now is the one to update.
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
          const winner = await prisma.timetableSlot.findUnique({
            where: { sectionId_dayOfWeek_period: { sectionId, dayOfWeek: dayInt, period: periodInt } }
          })
          if (!winner) throw err
          slot = await prisma.timetableSlot.update({ where: { id: winner.id }, data: slotData, include: slotInclude })
        } else {
          throw err
        }
      }
    }

    return NextResponse.json(slot, { status: existingSlot ? 200 : 201 })
  } catch (error) {
    console.error('POST /api/timetable error:', error)
    return NextResponse.json({ error: 'Failed to save timetable slot' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    await prisma.timetableSlot.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/timetable error:', error)
    return NextResponse.json({ error: 'Failed to delete slot' }, { status: 500 })
  }
}