import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function StudentAttendancePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { section: { include: { class: true } } }
  })
  if (!student) redirect('/dashboard')

  const sessions = await prisma.attendanceSession.findMany({
    where: { sectionId: student.sectionId },
    orderBy: { date: 'desc' },
    include: {
      records: { where: { studentId: student.id } },
      section: { include: { class: true } },
    }
  })

  const total = sessions.length
  const present = sessions.filter(s => s.records[0]?.status === 'PRESENT').length
  const absent = sessions.filter(s => s.records[0]?.status === 'ABSENT').length
  const late = sessions.filter(s => s.records[0]?.status === 'LATE').length
  const pct = total > 0 ? Math.round((present / total) * 100) : 0
  const pctColor = pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e'

  const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
    PRESENT: { bg: 'rgba(16,185,129,0.1)', color: '#10b981', label: '✓ Present' },
    ABSENT:  { bg: 'rgba(244,63,94,0.1)',  color: '#f43f5e', label: '✕ Absent' },
    LATE:    { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', label: '⏰ Late' },
    EXCUSED: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6', label: ' excused' },
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Attendance</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {student.section?.class.name} · Section {student.section?.name}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Sessions', value: total, color: '#6366f1', icon: '📋' },
          { label: 'Present', value: present, color: '#10b981', icon: '✅' },
          { label: 'Absent', value: absent, color: '#f43f5e', icon: '❌' },
          { label: 'Late', value: late, color: '#f59e0b', icon: '⏰' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mx-auto mb-2"
              style={{ background: `${s.color}18` }}>{s.icon}</div>
            <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Big percentage */}
      <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <p className="text-6xl font-black" style={{ color: pctColor }}>{pct}%</p>
        <p className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>Overall Attendance</p>
        <div className="w-full h-3 rounded-full mt-4 mx-auto max-w-md" style={{ background: 'var(--bg-page)' }}>
          <div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: pctColor }} />
        </div>
        {pct < 75 && (
          <div className="mt-4 p-3 rounded-xl inline-block" style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)' }}>
            <p className="text-xs font-semibold" style={{ color: '#f43f5e' }}>⚠️ Below 75% — please improve your attendance</p>
          </div>
        )}
      </div>

      {/* Session list */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Session History</h2>
        {sessions.length === 0 ? (
          <div className="rounded-2xl border py-12 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No attendance records yet</p>
          </div>
        ) : sessions.map(session => {
          const record = session.records[0]
          const status = record?.status || 'ABSENT'
          const style = STATUS_STYLE[status] || STATUS_STYLE.ABSENT
          return (
            <div key={session.id} className="rounded-2xl border p-4 flex items-center justify-between"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {new Date(session.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {record?.remarks && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>💡 {record.remarks}</p>}
              </div>
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{ background: style.bg, color: style.color }}>
                {style.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}