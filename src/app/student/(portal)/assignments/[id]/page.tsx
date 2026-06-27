import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth, currentUser } from '@clerk/nextjs/server'
import StudentAssignmentDetailClient from './StudentAssignmentDetailClient'

export default async function StudentAssignmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) notFound()

  // Get the student record for this user
  const student = await prisma.student.findUnique({
    where: { userId },
    include: { section: { include: { class: true } } }
  })
  if (!student) notFound()

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      subject: true,
      class: true,
      submissions: {
        where: { studentId: student.id },
        take: 1
      }
    }
  })

  if (!assignment) notFound()

  // Verify student belongs to this class
  if (assignment.classId && student.section?.classId !== assignment.classId) {
    notFound()
  }

  const now = new Date()
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < now
  const submission = assignment.submissions[0] || null

  return (
    <StudentAssignmentDetailClient
      assignment={{
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        fileUrl: assignment.fileUrl,
        dueDate: assignment.dueDate?.toISOString() || null,
        maxMarks: assignment.maxMarks,
        createdAt: assignment.createdAt.toISOString(),
        teacherName: assignment.teacher?.user?.name || 'Unknown',
        subjectName: assignment.subject?.name || null,
        className: assignment.class?.name || 'General',
        isOverdue,
      }}
      submission={submission ? {
        id: submission.id,
        content: submission.content,
        fileUrl: submission.fileUrl,
        submittedAt: submission.submittedAt.toISOString(),
        marks: submission.marks,
        status: submission.status,
        feedback: submission.feedback,
      } : null}
      studentId={student.id}
    />
  )
}