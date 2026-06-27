'use client'
import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function StudentAttendance() {
  const [sessions,  setSessions]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [studentId, setStudentId] = useState('')

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      setStudentId(parsed.id)
      fetchAttendance(parsed.id)
    }
  }, [])

  async function fetchAttendance(id: string) {
    try {
      const res  = await fetch(`/api/student/attendance?studentId=${id}`)
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  const total    = sessions.length
  const present  = sessions.filter(s => s.records?.[0]?.status === 'PRESENT').length
  const absent   = sessions.filter(s => s.records?.[0]?.status === 'ABSENT').length
  const late     = sessions.filter(s => s.records?.[0]?.status === 'LATE').length
  const pct      = total > 0 ? Math.round((present / total) * 100) : 0
  const pctColor = pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e'

  const pieData  = [
    { name: 'Present', value: present, color: '#10b981' },
    { name: 'Absent',  value: absent,  color: '#f43f5e' },
    { name: 'Late',    value: late,    color: '#f59e0b' },
  ].filter(d => d.value > 0)

  const monthlyData = sessions.reduce((acc: any[], s) => {
    const month = new Date(s.date).toLocaleDateString('en-IN', { month: 'short' })
    const existing = acc.find(a => a.month === month)
    const isPresent = s.records?.[0]?.status === 'PRESENT'
    if (existing) {
      existing.total++
      if (isPresent) existing.present++
    } else {
      acc.push({ month, total: 1, present: isPresent ? 1 : 0 })
    }
    return acc
  }, []).map(d => ({ ...d, pct: Math.round((d.present / d.total) * 100) }))

  // A line needs at least 2 points to draw an actual trend -- a single point
  // just renders as a floating dot, which reads as a broken chart rather
  // than "not enough data yet". Gate on that explicitly.
  const hasEnoughForTrend = monthlyData.length >= 2

  const stats = [
    { label: 'Total Classes', value: total,   color: '#6366f1', icon: '📅' },
    { label: 'Present',       value: present, color: '#10b981', icon: '✅' },
    { label: 'Absent',        value: absent,  color: '#f43f5e', icon: '❌' },
    { label: 'Late',          value: late,    color: '#f59e0b', icon: '⏰' },
  ]

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Attendance</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Track your class attendance record</p>
      </div>

      {!loading && pct < 75 && total > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.2)' }}>
          <span className="text-xl">🚨</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#f43f5e' }}>Critical Attendance Warning</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Your attendance is {pct}% which is below the required 75%. You need to attend more classes to avoid shortage.
            </p>
          </div>
        </div>
      )}
      {!loading && pct >= 75 && pct < 85 && total > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-2xl border"
          style={{ background: 'rgba(245,158,11,0.06)', borderColor: 'rgba(245,158,11,0.2)' }}>
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-semibold text-sm" style={{ color: '#f59e0b' }}>Attendance Needs Attention</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Your attendance is {pct}%. Try to maintain above 85% for best academic standing.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3"
              style={{ background: `${s.color}18` }}>{s.icon}</div>
            <p className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Attendance Breakdown</h3>
          {total === 0 ? (
            <div className="py-10 text-center"><p className="text-sm" style={{ color: 'var(--text-muted)' }}>No records yet</p></div>
          ) : (
            <div className="flex items-center gap-6">
              <PieChart width={140} height={140}>
                <Pie data={pieData} cx={65} cy={65} innerRadius={40} outerRadius={60} dataKey="value" strokeWidth={0}>
                  {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
              </PieChart>
              <div>
                <p className="text-4xl font-black" style={{ color: pctColor }}>{pct}%</p>
                <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Attendance rate</p>
                {pieData.map(d => (
                  <div key={d.name} className="flex items-center gap-2 mb-1.5">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{d.name}: <strong>{d.value}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Monthly Trend</h3>
          {!hasEnoughForTrend ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                {monthlyData.length === 0 ? 'No data yet' : 'Not enough months yet'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                {monthlyData.length === 0
                  ? 'A trend line will appear once attendance is recorded'
                  : `Only ${monthlyData.length} month of data so far — a trend needs at least 2`}
              </p>
              {monthlyData.length === 1 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                  {monthlyData[0].month}: {monthlyData[0].pct}% so far
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0,100]} hide />
                  <Tooltip
                    formatter={(v: any) => [`${v}%`, 'Attendance']}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Line type="monotone" dataKey="pct" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Session History</h3>
        </div>
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl animate-pulse" style={{ background: 'var(--bg-page)' }} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No attendance records yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your attendance will appear here once marked</p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {sessions.map(session => {
              const record = session.records?.[0]
              const status = record?.status || 'NOT MARKED'
              const statusConfig = {
                PRESENT: { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  label: '✓ Present' },
                ABSENT:  { color: '#f43f5e', bg: 'rgba(244,63,94,0.1)',   label: '✗ Absent'  },
                LATE:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  label: '⏰ Late'    },
              }[status] || { color: 'var(--text-muted)', bg: 'var(--bg-page)', label: '— Not Marked' }

              return (
                <div key={session.id} className="flex items-center justify-between px-5 py-4"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: statusConfig.bg }}>
                      {status === 'PRESENT' ? '✅' : status === 'ABSENT' ? '❌' : '⏰'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {new Date(session.date).toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {session.section?.class?.name} · Section {session.section?.name}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                    style={{ background: statusConfig.bg, color: statusConfig.color }}>
                    {statusConfig.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}