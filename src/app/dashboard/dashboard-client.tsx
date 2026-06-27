'use client'
import Link from 'next/link'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const sparkData = [
  { v: 2 }, { v: 5 }, { v: 3 }, { v: 7 }, { v: 4 }, { v: 8 }, { v: 6 }, { v: 9 }, { v: 7 }, { v: 11 }
]

interface Props {
  firstName: string
  studentCount: number
  noticeCount: number
  assignmentCount: number
  noteCount: number
  recentNotices: { id: string; title: string; content: string; createdAt: string; author: { name: string } }[]
  recentAssignments: { id: string; title: string; dueDate: string | null; teacher: { user: { name: string } } }[]
}

export default function DashboardClient({ firstName, studentCount, noticeCount, assignmentCount, noteCount, recentNotices, recentAssignments }: Props) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const stats = [
    { label: 'Total Students', value: studentCount, sub: '+0 this week', icon: '👥', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', href: '/dashboard/students' },
    { label: 'Assignments', value: assignmentCount, sub: 'Active tasks', icon: '📋', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', href: '/dashboard/assignments' },
    { label: 'Study Notes', value: noteCount, sub: 'Materials shared', icon: '📚', color: '#10b981', bg: 'rgba(16,185,129,0.1)', href: '/dashboard/notes' },
    { label: 'Notices', value: noticeCount, sub: 'Announcements', icon: '📢', color: '#f43f5e', bg: 'rgba(244,63,94,0.1)', href: '/dashboard/notices' },
  ]

  const quickActions = [
    { href: '/dashboard/students', icon: '👤', label: 'Add Student', sub: 'Enroll new student', color: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.15)', iconBg: 'rgba(99,102,241,0.12)' },
    { href: '/dashboard/attendance', icon: '✅', label: 'Attendance', sub: "Mark today's roll", color: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.15)', iconBg: 'rgba(16,185,129,0.12)' },
    { href: '/dashboard/notices', icon: '📢', label: 'Post Notice', sub: 'Send announcement', color: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.15)', iconBg: 'rgba(244,63,94,0.12)' },
    { href: '/dashboard/assignments', icon: '📝', label: 'Assignment', sub: 'Create new task', color: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.15)', iconBg: 'rgba(139,92,246,0.12)' },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden p-8"
        style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #5b21b6 100%)', minHeight: '160px' }}>
        {/* Stars - fixed positions to avoid hydration mismatch */}
        {[
          [8, 15, false], [15, 45, false], [22, 25, true], [35, 60, false], [48, 20, false],
          [12, 70, false], [28, 80, true], [5, 55, false], [42, 35, false], [18, 88, false],
          [55, 12, true], [63, 48, false], [71, 28, false], [38, 90, false], [25, 38, false],
          [50, 72, false], [68, 18, false], [32, 52, false], [60, 65, true], [44, 8, false],
        ].map(([t, l, big], i) => (
          <div key={i} className="absolute rounded-full bg-white"
            style={{
              width: big ? '3px' : '2px',
              height: big ? '3px' : '2px',
              top: `${t}%`,
              left: `${l}%`,
              opacity: 0.3
            }} />
        ))}
        {/* School illustration placeholder */}
        <div className="absolute right-8 bottom-0 text-8xl opacity-80 hidden md:block">🏫</div>
        <div className="absolute right-32 bottom-4 text-4xl opacity-60 hidden md:block">🌳</div>
        <div className="absolute right-24 bottom-2 text-3xl opacity-50 hidden md:block">🌳</div>
        <div className="relative z-10">
          <h2 className="text-2xl font-bold text-white mb-1">
            {greeting}, {firstName} 👋
          </h2>
          <p className="text-indigo-200 text-sm">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <p className="text-indigo-300 text-sm mt-1">Have a productive day ahead.</p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="rounded-2xl border p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: stat.bg }}>
                  {stat.icon}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>→</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
                </div>
                <div className="w-20 h-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sparkData}>
                      <Line type="monotone" dataKey="v" stroke={stat.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <Link key={action.label} href={action.href}>
              <div className="flex items-center gap-3 p-4 rounded-xl border transition-all hover:-translate-y-0.5 cursor-pointer"
                style={{ background: action.color, borderColor: action.border }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: action.iconBg }}>
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{action.sub}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Notices */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Recent Notices</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest announcements</p>
            </div>
            <Link href="/dashboard/notices" className="text-xs font-semibold text-indigo-500 hover:text-indigo-400">View all →</Link>
          </div>
          {recentNotices.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">📢</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentNotices.map(notice => (
                <div key={notice.id} className="flex items-start gap-3 p-3.5 rounded-xl transition-colors"
                  style={{ background: 'var(--bg-hover)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                    style={{ background: 'rgba(244,63,94,0.1)' }}>📢</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{notice.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{notice.content}</p>
                    <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Assignments</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Active tasks</p>
            </div>
            <Link href="/dashboard/assignments" className="text-xs font-semibold text-indigo-500 hover:text-indigo-400">View all →</Link>
          </div>
          {recentAssignments.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAssignments.map(a => {
                const isOverdue = a.dueDate && new Date(a.dueDate) < new Date()
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3.5 rounded-xl transition-colors"
                    style={{ background: 'var(--bg-hover)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: 'rgba(139,92,246,0.1)' }}>📝</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>By {a.teacher?.user?.name}</p>
                      {a.dueDate && (
                        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                          Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      )}
                    </div>
                    {isOverdue && (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>Overdue</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}