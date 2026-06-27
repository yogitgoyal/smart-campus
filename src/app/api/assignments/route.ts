import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

async function getOrCreateSchool() {
  let school = await prisma.school.findFirst()
  if (!school) school = await prisma.school.create({ data: { name: 'Smart Campus School' } })
  return school
}

async function getOrCreateUser(clerkId: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    const school = await getOrCreateSchool()
    user = await prisma.user.create({
      data: { clerkId, email: `${clerkId}@temp.com`, name: 'Admin', role: 'ADMIN', schoolId: school.id }
    })
  }
  return user
}

async function getOrCreateTeacher(userId: string) {
  let teacher = await prisma.teacher.findUnique({ where: { userId } })
  if (!teacher) teacher = await prisma.teacher.create({ data: { userId } })
  return teacher
}

async function getOrCreateClass(classId?: string | null) {
  if (classId) {
    const cls = await prisma.class.findUnique({ where: { id: classId } })
    if (cls) return cls
  }
  // Instead of creating "General", find the first existing class
  let cls = await prisma.class.findFirst({ orderBy: { name : 'asc' } })
  if (!cls) {
    const school = await getOrCreateSchool()
    cls = await prisma.class.create({ data: { name: 'Class 1', schoolId: school.id } })
  }
  return cls
}

async function getOrCreateSubject(name: string, classId: string) {
  if (!name?.trim()) return null
  let subject = await prisma.subject.findFirst({
    where: { name: name.trim(), classId }
  })
  if (!subject) {
    subject = await prisma.subject.create({
      data: { name: name.trim(), classId }
    })
  }
  return subject
}

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany({
      include: {
        teacher: { include: { user: true } },
        subject: true,
        class: true,
        submissions: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    return NextResponse.json(assignments)
  } catch (error) {
    console.error(error)
    return NextResponse.json([])
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const title       = formData.get('title') as string
    const description = formData.get('description') as string
    const dueDate     = formData.get('dueDate') as string
    const maxMarks    = formData.get('maxMarks') as string
    const subjectName = formData.get('subject') as string
    const classId     = formData.get('classId') as string
    const fileUrl     = formData.get('fileUrl') as string

    if (!title?.trim()) return NextResponse.json({ error: 'Title required' }, { status: 400 })

    const user    = await getOrCreateUser(userId)
    const teacher = await getOrCreateTeacher(user.id)
    const school  = await getOrCreateSchool()
    const cls     = await getOrCreateClass(classId || null)
    const subject = subjectName ? await getOrCreateSubject(subjectName, cls.id) : null

    const assignment = await prisma.assignment.create({
      data: {
        title: title.trim(),
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        maxMarks: maxMarks ? parseFloat(maxMarks) : null,
        fileUrl: fileUrl || null,
        teacherId: teacher.id,
        classId: cls.id,
        schoolId: school.id,
        ...(subject && { subjectId: subject.id }),
      }
    })

    return NextResponse.json(assignment, { status: 201 })
  } catch (error) {
    console.error('POST Error:', error)
    return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ids } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array required' }, { status: 400 })
    }

    await prisma.submission.deleteMany({ where: { assignmentId: { in: ids } } })
    const result = await prisma.assignment.deleteMany({ where: { id: { in: ids } } })

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error('BULK DELETE error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}