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

export async function GET() {
  const notices = await prisma.notice.findMany({
    include: { author: true },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }]
  })
  return NextResponse.json(notices)
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, content, isPinned, category, priority } = body

  const user = await getOrCreateUser(userId)
  const school = await getOrCreateSchool()

  const notice = await prisma.notice.create({
    data: {
      title, content,
      isPinned: isPinned || false,
      category: category || 'General',
      priority: priority || 'Normal',
      authorId: user.id,
      schoolId: school.id,
    }
  })
  return NextResponse.json(notice)
}

export async function DELETE(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const ids = searchParams.get('ids')

  if (id) {
    await prisma.notice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  }

  if (ids) {
    await prisma.notice.deleteMany({ where: { id: { in: ids.split(',') } } })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'No id or ids provided' }, { status: 400 })
}