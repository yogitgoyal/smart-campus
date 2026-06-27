import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function StudentAssignmentsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { section: { include: { class: true } } }
  })
  if (!student) redirect('/dashboard')

  const classId = student.section?.classId
  const now = new Date()

  const assignments = await prisma.assignment.findMany({
    where: classId ? { classId } : undefined,
    orderBy: { dueDate: 'asc' },
    include: {
      teacher: { include: { user: { select: { name: true } } } },
      subject: true,
      class: true,
      submissions: { where: { studentId: student.id } },
    }
  })

  const upcoming = assignments.filter(a => !a.dueDate || new Date(a.dueDate) >= now)
  const overdue = assignments.filter(a => a.dueDate && new Date(a.dueDate) < now)
  const submittedIds = new Set(assignments.filter(a => a.submissions.length > 0).map(a => a.id))

  function DaysChip({ dueDate }: { dueDate: Date | null }) {
    if (!dueDate) return <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No due date</span>
    const diff = Math.ceil((new Date(dueDate).getTime() - now.getTime()) / 86400000)
    const isOver = diff < 0
    return (
      <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
        style={{
          background: isOver ? 'rgba(244,63,94,0.1)' : diff <= 2 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
          color: isOver ? '#f43f5e' : diff <= 2 ? '#f59e0b' : '#10b981'
        }}>
        {isOver ? `${Math.abs(diff)}d overdue` : diff === 0 ? 'Due today' : `${diff}d left`}
      </span>
    )
  }

  function Card({ a }: { a: typeof assignments[0] }) {
    const isSubmitted = submittedIds.has(a.id)
    const submission = a.submissions[0]
    return (
      <div className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.1)' }}>📝</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isSubmitted && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                    {submission?.status === 'GRADED' ? `✓ Graded${submission.marks != null ? ` · ${submission.marks}/${a.maxMarks || ''}` : ''}` : '✓ Submitted'}
                  </span>
                )}
                <DaysChip dueDate={a.dueDate} />
              </div>
            </div>
            {a.description && <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{a.description}</p>}
            <div className="flex flex-wrap gap-3 mt-2">
              {a.subject?.name && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📖 {a.subject.name}</span>}
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>👤 {a.teacher.user.name}</span>
              {a.maxMarks && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>⭐ {a.maxMarks} marks</span>}
              {a.dueDate && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  📅 {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
            {a.fileUrl && (
              <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                📎 Download Attachment
              </a>
            )}
            {submission?.feedback && (
              <div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <p className="text-xs font-semibold" style={{ color: '#6366f1' }}>💬 Teacher Feedback</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{submission.feedback}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Assignments</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {upcoming.length} upcoming · {overdue.length} overdue · {submittedIds.size} submitted
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: assignments.length, color: '#6366f1' },
          { label: 'Upcoming', value: upcoming.length, color: '#10b981' },
          { label: 'Overdue', value: overdue.length, color: '#f43f5e' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-3xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-bold mb-3" style={{ color: '#f43f5e' }}>⚠️ Overdue ({overdue.length})</h2>
          <div className="space-y-3">{overdue.map(a => <Card key={a.id} a={a} />)}</div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📋 Upcoming ({upcoming.length})</h2>
        {upcoming.length === 0 ? (
          <div className="rounded-2xl border py-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-4xl mb-3">✅</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">{upcoming.map(a => <Card key={a.id} a={a} />)}</div>
        )}
      </div>
    </div>
  )
}