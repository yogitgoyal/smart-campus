import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [recentNotices, recentAssignments, recentStudents] = await Promise.all([
    prisma.notice.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { author: true }
    }),
    prisma.assignment.findMany({
      take: 5, orderBy: { createdAt: 'desc' },
      include: { teacher: { include: { user: true } } }
    }),
    prisma.student.findMany({
      take: 3, orderBy: { user: { createdAt: 'desc' } },
      include: { user: true }
    }),
  ])

  return NextResponse.json({ recentNotices, recentAssignments, recentStudents })
}