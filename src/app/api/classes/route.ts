import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      orderBy: { name: 'asc' },
      include: {
        sections: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    })

    const counts = await Promise.all(
      classes.map(async (cls) => {
        const [subjects, assignments] = await Promise.all([
          prisma.subject.count({ where: { classId: cls.id } }),
          prisma.assignment.count({ where: { classId: cls.id } }),
        ])
        return { id: cls.id, sections: cls.sections.length, subjects, assignments }
      })
    )

    const result = classes.map((cls, i) => ({
      id: cls.id,
      name: cls.name,
      schoolId: cls.schoolId,
      createdAt: cls.createdAt,
      sections: cls.sections,
      _count: counts[i],
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('GET classes error:', error)
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

    const existing = await prisma.class.findFirst({ where: { name: name.trim() } })
    if (existing) return NextResponse.json({ error: 'Class with this name already exists' }, { status: 409 })

    let school = await prisma.school.findFirst()
    if (!school) school = await prisma.school.create({ data: { name: 'Smart Campus School' } })

    const cls = await prisma.class.create({
      data: { name: name.trim(), schoolId: school.id }
    })
    return NextResponse.json(cls, { status: 201 })
  } catch (error) {
    console.error('POST class error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const cls = await prisma.class.findUnique({ where: { id } })
    if (!cls) return NextResponse.json({ error: 'Class not found' }, { status: 404 })

    await prisma.submission.deleteMany({ where: { assignment: { classId: id } } })
    await prisma.assignment.deleteMany({ where: { classId: id } })
    await prisma.note.deleteMany({ where: { classId: id } })
    await prisma.attendanceRecord.deleteMany({ where: { session: { section: { classId: id } } } })
    await prisma.attendanceSession.deleteMany({ where: { section: { classId: id } } })
    await prisma.timetableSlot.deleteMany({ where: { section: { classId: id } } })
    await prisma.subject.deleteMany({ where: { classId: id } })
    await prisma.student.deleteMany({ where: { section: { classId: id } } })
    await prisma.section.deleteMany({ where: { classId: id } })
    await prisma.period.deleteMany({ where: { classId: id } })
    await prisma.notice.deleteMany({ where: { classId: id } })
    await prisma.class.delete({ where: { id } })

    return NextResponse.json({ success: true, deleted: cls.name })
  } catch (error) {
    console.error('DELETE class error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}