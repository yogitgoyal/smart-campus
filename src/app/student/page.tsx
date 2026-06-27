import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function StudentHome() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      section: { include: { class: true } },
    }
  })
  if (!student) redirect('/dashboard')

  const sectionId = student.sectionId
  const classId = student.section?.classId

  const now = new Date()

  const [assignments, attendanceSessions, notices, notes] = await Promise.all([
    prisma.assignment.findMany({
      where: classId ? { classId } : undefined,
      orderBy: { dueDate: 'asc' },
      include: { subject: true, class: true },
      take: 20,
    }),
    prisma.attendanceSession.findMany({
      where: sectionId ? { sectionId } : undefined,
      include: { records: { where: { studentId: student.id } } },
      orderBy: { date: 'desc' },
      take: 50,
    }),
    prisma.notice.findMany({
      where: {
        schoolId: user.schoolId || undefined,
        OR: [
          { classId: null },
          { classId },
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      take: 5,
      include: { author: { select: { name: true } } },
    }),
    prisma.note.findMany({
      where: {
        schoolId: user.schoolId || undefined,
        OR: [
          { sectionId: null, classId: null },
          { sectionId },
          { classId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
    }),
  ])

  // Attendance calc
  const totalSessions = attendanceSessions.length
  const presentCount = attendanceSessions.filter(s => s.records[0]?.status === 'PRESENT').length
  const attendancePct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0
  const pctColor = attendancePct >= 85 ? '#10b981' : attendancePct >= 75 ? '#f59e0b' : '#f43f5e'

  // Assignment stats
  const upcoming = assignments.filter(a => !a.dueDate || new Date(a.dueDate) >= now)
  const overdue = assignments.filter(a => a.dueDate && new Date(a.dueDate) < now)

  const hour = now.getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = student.user.name.split(' ')[0]

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg,#064e3b,#065f46,#047857)', minHeight: '130px' }}>
        <div className="absolute right-6 bottom-0 text-6xl hidden md:block opacity-40">🎓</div>
        <div className="relative z-10">
          <h2 className="text-xl md:text-2xl font-bold text-white">{greeting}, {firstName}! 👋</h2>
          <p className="text-emerald-200 text-sm mt-1">
            {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          {student.section && (
            <p className="text-emerald-300 text-sm mt-1">
              Class {student.section.class.name} · Section {student.section.name}
              {student.rollNumber && ` · Roll No: ${student.rollNumber}`}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Attendance', value: `${attendancePct}%`, icon: '✅', color: pctColor, href: '/student/attendance' },
          { label: 'Upcoming Tasks', value: upcoming.length, icon: '📝', color: '#6366f1', href: '/student/assignments' },
          { label: 'Overdue', value: overdue.length, icon: '⚠️', color: '#f43f5e', href: '/student/assignments' },
          { label: 'Study Notes', value: notes.length, icon: '📚', color: '#3b82f6', href: '/student/notes' },
        ].map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-md cursor-pointer h-full"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: `${stat.color}18` }}>{stat.icon}</div>
              <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Attendance progress */}
      {totalSessions > 0 && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Attendance Progress</span>
            <span className="text-sm font-bold" style={{ color: pctColor }}>{presentCount}/{totalSessions} ({attendancePct}%)</span>
          </div>
          <div className="w-full h-3 rounded-full" style={{ background: 'var(--bg-page)' }}>
            <div className="h-3 rounded-full transition-all" style={{ width: `${attendancePct}%`, background: pctColor }} />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>0%</span>
            <span className="text-xs font-semibold" style={{ color: attendancePct < 75 ? '#f43f5e' : '#10b981' }}>
              {attendancePct < 75 ? '⚠️ Below 75% — needs improvement' : '✅ Good standing'}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>100%</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Upcoming Assignments */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>📝 Upcoming Assignments</h2>
            <Link href="/student/assignments" className="text-xs font-semibold" style={{ color: '#6366f1' }}>View all →</Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No upcoming assignments</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.slice(0, 4).map(a => {
                const daysLeft = a.dueDate ? Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / 86400000) : null
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'rgba(99,102,241,0.1)' }}>📝</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {a.subject?.name || ''} {a.class?.name || ''}
                      </p>
                    </div>
                    {daysLeft !== null && (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg flex-shrink-0"
                        style={{
                          background: daysLeft <= 1 ? 'rgba(244,63,94,0.1)' : daysLeft <= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: daysLeft <= 1 ? '#f43f5e' : daysLeft <= 3 ? '#f59e0b' : '#10b981'
                        }}>
                        {daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Notices */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>📢 Recent Notices</h2>
            <Link href="/student/notices" className="text-xs font-semibold" style={{ color: '#6366f1' }}>View all →</Link>
          </div>
          {notices.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">📢</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notices.slice(0, 4).map(n => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: n.isPinned ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)' }}>
                    {n.isPinned ? '📌' : '📢'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{n.content}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}