import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { currentUser } from '@clerk/nextjs/server'
import DashboardClient from './dashboard-client'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()

  const [studentCount, noticeCount, assignmentCount, noteCount] = await Promise.all([
    prisma.student.count(),
    prisma.notice.count(),
    prisma.assignment.count(),
    prisma.note.count(),
  ])

  const recentNotices = await prisma.notice.findMany({
    take: 3, orderBy: { createdAt: 'desc' }, include: { author: true }
  })

  const recentAssignments = await prisma.assignment.findMany({
    take: 3, orderBy: { createdAt: 'desc' },
    include: { teacher: { include: { user: true } } }
  })

  return (
    <DashboardClient
      firstName={user?.firstName || 'Admin'}
      studentCount={studentCount}
      noticeCount={noticeCount}
      assignmentCount={assignmentCount}
      noteCount={noteCount}
      recentNotices={recentNotices.map(n => ({
        id: n.id, title: n.title, content: n.content,
        createdAt: n.createdAt.toISOString(),
        author: { name: n.author.name }
      }))}
      recentAssignments={recentAssignments.map(a => ({
        id: a.id, title: a.title,
        dueDate: a.dueDate?.toISOString() || null,
        teacher: { user: { name: a.teacher.user.name } }
      }))}
    />
  )
}