import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DeleteAssignmentButton from './DeleteAssignmentButton'
import DownloadButton from './DownloadButton'
import SubmissionRow from './SubmissionRow'

export default async function AssignmentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const assignment = await prisma.assignment.findUnique({
    where: { id },
    include: {
      teacher: { include: { user: true } },
      subject: true,
      class: true,
      submissions: {
        include: { student: { include: { user: true } } },
        orderBy: { submittedAt: 'desc' }
      }
    }
  })

  if (!assignment) notFound()

  const now = new Date()
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < now
  const totalSubmissions = assignment.submissions.length
  const graded = assignment.submissions.filter(s => s.status === 'GRADED').length
  const avgMarks = graded > 0
    ? (assignment.submissions.filter(s => s.marks).reduce((a, s) => a + (s.marks || 0), 0) / graded).toFixed(1)
    : '—'

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      <div className="flex items-center justify-between">
        <Link href="/dashboard/assignments"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}>
          ← Back to Assignments
        </Link>
        <DeleteAssignmentButton assignmentId={assignment.id} assignmentTitle={assignment.title} />
      </div>

      {/* Header card */}
      <div className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
              ✏️
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {assignment.title}
              </h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  📚 {assignment.class?.name || 'General'}
                </span>
                {assignment.subject && (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    · {assignment.subject.name}
                  </span>
                )}
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  · By {assignment.teacher?.user?.name}
                </span>
              </div>
            </div>
          </div>

          <span className="text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0"
            style={{
              background: isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
              color: isOverdue ? '#f43f5e' : '#10b981'
            }}>
            {isOverdue ? '⚠ Overdue' : '✓ Active'}
          </span>
        </div>

        {assignment.description && (
          <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-page)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Instructions
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {assignment.description}
            </p>
          </div>
        )}

        {assignment.fileUrl && (
          <div className="mt-4">
            <DownloadButton fileUrl={assignment.fileUrl} />
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            {
              label: 'Due Date',
              value: assignment.dueDate
                ? new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                : 'No due date',
              icon: '📅',
              color: isOverdue ? '#f43f5e' : 'var(--text-primary)'
            },
            {
              label: 'Max Marks',
              value: assignment.maxMarks ? `${assignment.maxMarks} marks` : 'Not set',
              icon: '⭐',
              color: 'var(--text-primary)'
            },
            {
              label: 'Created',
              value: new Date(assignment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
              icon: '🗓',
              color: 'var(--text-primary)'
            },
            {
              label: 'Teacher',
              value: assignment.teacher?.user?.name || 'Unknown',
              icon: '👨‍🏫',
              color: 'var(--text-primary)'
            },
          ].map(item => (
            <div key={item.label} className="p-3.5 rounded-xl" style={{ background: 'var(--bg-page)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                {item.icon} {item.label}
              </p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Submissions', value: totalSubmissions, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '📋' },
          { label: 'Graded', value: graded, color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
          { label: 'Average Marks', value: avgMarks, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⭐' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border p-5 text-center"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center text-xl"
              style={{ background: stat.bg }}>
              {stat.icon}
            </div>
            <p className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</p>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Submissions table */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
            Submissions ({totalSubmissions})
          </h2>
          {assignment.maxMarks && (
            <span className="text-xs px-3 py-1 rounded-full font-medium"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              Max: {assignment.maxMarks} marks
            </span>
          )}
        </div>

        <div className="grid px-6 py-3 text-xs font-bold uppercase tracking-wide border-b"
          style={{
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr',
            background: 'var(--bg-page)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)'
          }}>
          <span>Student</span>
          <span>Submitted</span>
          <span>File</span>
          <span>Marks</span>
          <span>Status</span>
          <span>Feedback</span>
        </div>

        {totalSubmissions === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No submissions yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Students haven&apos;t submitted this assignment
            </p>
          </div>
        ) : (
          <div>
            {assignment.submissions.map(sub => (
              <SubmissionRow
                key={sub.id}
                submission={{
                  id: sub.id,
                  content: sub.content,
                  fileUrl: sub.fileUrl,
                  submittedAt: sub.submittedAt.toISOString(),
                  marks: sub.marks,
                  status: sub.status,
                  feedback: sub.feedback,
                  studentName: sub.student?.user?.name || 'Unknown',
                }}
                maxMarks={assignment.maxMarks}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}