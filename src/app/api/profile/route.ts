import { prisma } from '@/lib/prisma'
import { auth, currentUser } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

async function getOrCreateUser(clerkId: string, email: string, name: string) {
  let user = await prisma.user.findUnique({ where: { clerkId } })
  if (!user) {
    let school = await prisma.school.findFirst()
    if (!school) school = await prisma.school.create({ data: { name: 'Smart Campus School' } })
    user = await prisma.user.create({
      data: { clerkId, email: email || `${clerkId}@temp.com`, name: name || 'Admin', role: 'ADMIN', schoolId: school.id }
    })
  }
  return user
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clerkUser = await currentUser()
  const dbUser = await getOrCreateUser(userId, clerkUser?.emailAddresses?.[0]?.emailAddress || '', clerkUser?.firstName || 'Admin')

  const [studentCount, teacherCount, classCount, noticeCount, noteCount, assignmentCount] = await Promise.all([
    prisma.student.count(),
    prisma.teacher.count(),
    prisma.class.count(),
    prisma.notice.count(),
    prisma.note.count(),
    prisma.assignment.count(),
  ])

  return NextResponse.json({
    user: dbUser,
    clerk: {
      email: clerkUser?.emailAddresses?.[0]?.emailAddress || '',
      accountId: clerkUser?.id || '',
      joined: clerkUser?.createdAt || null,
      lastSignIn: clerkUser?.lastSignInAt || null,
      imageUrl: clerkUser?.imageUrl || null
    },
    stats: { studentCount, teacherCount, classCount, noticeCount, noteCount, assignmentCount }
  })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { name, phone } = body

    const dataToUpdate: any = {}
    if (name && name.trim() !== '') dataToUpdate.name = name.trim()
    if (phone !== undefined) dataToUpdate.phone = phone

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: dataToUpdate
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Profile update failed:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}