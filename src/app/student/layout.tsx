import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import StudentLayoutClient from './StudentLayoutClient'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId }, select: { role: true } })
  if (!user) redirect('/sign-in')
  if (user.role !== 'STUDENT') redirect('/dashboard')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { user: { select: { name: true } }, section: { include: { class: true } } }
  })

  return <StudentLayoutClient studentName={student?.user.name || 'Student'} sectionName={student?.section?.name || ''} className={student?.section?.class?.name || ''}>{children}</StudentLayoutClient>
}