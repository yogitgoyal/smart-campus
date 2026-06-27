'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'

interface StudentSession {
  id: string; name: string; email: string
}

interface DashboardData {
  student: any
  attendanceSessions: any[]
  assignments: any[]
  notices: any[]
  notes: any[]
}

export default function StudentDashboard() {
  const [session,  setSession]  = useState<StudentSession | null>(null)
  const [data,     setData]     = useState<DashboardData | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      fetchDashboard(parsed.id)
    }
  }, [])

  async function fetchDashboard(studentId: string) {
    try {
      const res  = await fetch(`/api/student/dashboard?studentId=${studentId}`)
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading dashboard…</p>
      </div>
    </div>
  )

  const hour       = new Date().getHours()
  const greeting   = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name       = session?.name || 'Student'

  const totalSessions  = data?.attendanceSessions?.length || 0
  const presentSessions = data?.attendanceSessions?.filter((s: any) =>
    s.records?.some((r: any) => r.status === 'PRESENT')
  ).length || 0
  const attendancePct  = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0
  const attendanceColor = attendancePct >= 85 ? '#10b981' : attendancePct >= 75 ? '#f59e0b' : '#f43f5e'

  const pendingAssignments = data?.assignments?.filter((a: any) => {
    const due = a.dueDate ? new Date(a.dueDate) : null
    return due && due >= new Date()
  }).length || 0

  const overdueAssignments = data?.assignments?.filter((a: any) => {
    const due = a.dueDate ? new Date(a.dueDate) : null
    return due && due < new Date()
  }).length || 0

  // Attendance chart data (last 7 sessions) -- oldest first so the bars read
  // left-to-right as a timeline.
  const attendanceChart = (data?.attendanceSessions || [])
    .slice(0, 7)
    .slice()
    .reverse()
    .map((s: any) => ({
      day: new Date(s.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      present: s.records?.some((r: any) => r.status === 'PRESENT') ? 1 : 0,
    }))

  // A single bar can render as an invisible sliver in Recharts, and a single
  // dot reads as "broken", not as a trend. Require at least 2 points before
  // attempting either chart; otherwise show a clear "needs more data" state.
  const hasEnoughForBarChart = attendanceChart.length >= 2

  const pieData = [
    { name: 'Present', value: presentSessions,            color: '#10b981' },
    { name: 'Absent',  value: totalSessions - presentSessions, color: '#f43f5e' },
  ]

  const quickStats = [
    { label: 'Attendance',  value: `${attendancePct}%`, sub: `${presentSessions}/${totalSessions} classes`, color: attendanceColor, icon: '✅', href: '/student/attendance' },
    { label: 'Assignments', value: pendingAssignments,   sub: 'pending tasks',                              color: '#6366f1',       icon: '📋', href: '/student/assignments' },
    { label: 'Overdue',     value: overdueAssignments,   sub: 'need attention',                             color: '#f43f5e',       icon: '⏰', href: '/student/assignments' },
    { label: 'Notices',     value: data?.notices?.length || 0, sub: 'announcements',                        color: '#f59e0b',       icon: '🔔', href: '/student/notices' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-5">

      {/* Hero banner */}
      <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, #a78bfa, transparent 60%)' }} />
        <div className="relative">
          <p className="text-indigo-300 text-sm font-medium mb-1">
            {new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
            {greeting}, {name.split(' ')[0]} 👋
          </h2>
          <p className="text-indigo-200 text-sm">
            {attendancePct >= 85
              ? 'Your attendance is excellent! Keep it up 🎉'
              : attendancePct >= 75
              ? '⚠ Your attendance needs attention'
              : '🚨 Critical: Your attendance is below 75%'}
          </p>
          {attendancePct < 75 && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(244,63,94,0.2)', color: '#fca5a5' }}>
              🚨 Attend more classes to avoid shortage
            </div>
          )}
        </div>
        <div className="absolute right-6 bottom-0 text-6xl opacity-20 hidden md:block">🎓</div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map(stat => (
          <Link key={stat.label} href={stat.href}>
            <div className="rounded-2xl border p-5 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
                style={{ background: `${stat.color}18` }}>{stat.icon}</div>
              <p className="text-3xl font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Attendance pie */}
        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Attendance Overview</h3>
          {totalSessions === 0 ? (
            <div className="py-10 text-center">
              <p className="text-4xl mb-2">📊</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No attendance records yet</p>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <div style={{ width: 140, height: 140 }}>
                <PieChart width={140} height={140}>
                  <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-3xl font-black" style={{ color: attendanceColor }}>{attendancePct}%</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Overall attendance</p>
                </div>
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
                <div className="text-xs px-2 py-1 rounded-lg font-medium"
                  style={{ background: attendancePct >= 75 ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)', color: attendancePct >= 75 ? '#10b981' : '#f43f5e' }}>
                  {attendancePct >= 75 ? '✓ Above 75% threshold' : '✗ Below 75% threshold'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Weekly attendance bar */}
        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Recent Attendance (Last 7)</h3>
          {!hasEnoughForBarChart ? (
            <div className="py-10 text-center">
              <p className="text-4xl mb-2">📅</p>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {attendanceChart.length === 0 ? 'No recent sessions' : 'Not enough sessions yet'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {attendanceChart.length === 0
                  ? 'This chart fills in once attendance is marked'
                  : `${attendanceChart.length} session recorded so far — check back after a few more classes`}
              </p>
            </div>
          ) : (
            <div style={{ height: 120 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceChart} barSize={20}>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 1]} />
                  <Tooltip
                    formatter={(v: any) => [v === 1 ? 'Present' : 'Absent', 'Status']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="present" radius={4} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent notices */}
        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Recent Notices</h3>
            <Link href="/student/notices" className="text-xs font-semibold" style={{ color: '#6366f1' }}>View all →</Link>
          </div>
          {(data?.notices || []).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">📢</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notices yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.notices || []).slice(0,3).map((n: any) => (
                <div key={n.id} className="flex items-start gap-3 p-3 rounded-xl"
                  style={{ background: 'var(--bg-page)' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                    style={{ background: 'rgba(245,158,11,0.1)' }}>📢</div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{n.title}</p>
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{n.content}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      {new Date(n.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                    </p>
                  </div>
                  {n.isPinned && <span className="text-amber-400 flex-shrink-0">📌</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming assignments */}
        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Upcoming Assignments</h3>
            <Link href="/student/assignments" className="text-xs font-semibold" style={{ color: '#6366f1' }}>View all →</Link>
          </div>
          {(data?.assignments || []).length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-3xl mb-2">📝</p>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No assignments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(data?.assignments || []).slice(0,3).map((a: any) => {
                const due      = a.dueDate ? new Date(a.dueDate) : null
                const isOverdue = due && due < new Date()
                const daysLeft  = due ? Math.ceil((due.getTime() - Date.now()) / 86400000) : null
                return (
                  <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--bg-page)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                      style={{ background: isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>📝</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{a.title}</p>
                      {a.description && <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>{a.description}</p>}
                    </div>
                    {due && (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
                        style={{
                          background: isOverdue ? 'rgba(244,63,94,0.1)' : daysLeft! <= 2 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                          color: isOverdue ? '#f43f5e' : daysLeft! <= 2 ? '#f59e0b' : '#10b981'
                        }}>
                        {isOverdue ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                      </span>
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