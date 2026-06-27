'use client'
import { useState, useEffect } from 'react'

const DAYS    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const PERIODS = [
  { num: 1, time: '08:00–08:45' },
  { num: 2, time: '08:45–09:30' },
  { num: 3, time: '09:45–10:30' },
  { num: 4, time: '10:30–11:15' },
  { num: 5, time: '11:30–12:15' },
  { num: 6, time: '12:15–01:00' },
  { num: 7, time: '01:45–02:30' },
  { num: 8, time: '02:30–03:15' },
]

const SUBJECT_COLORS: Record<string, { bg: string; color: string }> = {
  Mathematics: { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
  Science:     { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  English:     { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  Physics:     { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b' },
  Chemistry:   { bg: 'rgba(16,185,129,0.12)',  color: '#10b981' },
  History:     { bg: 'rgba(249,115,22,0.12)',  color: '#f97316' },
  default:     { bg: 'rgba(99,102,241,0.12)',  color: '#6366f1' },
}

export default function StudentTimetable() {
  const [slots,   setSlots]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const todayIdx = new Date().getDay() // 0=Sun,1=Mon...

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      fetch(`/api/student/timetable?studentId=${parsed.id}`)
        .then(r => r.json())
        .then(d => { setSlots(Array.isArray(d) ? d : []); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  function getSlot(day: number, period: number) {
    return slots.find(s => s.dayOfWeek === day && s.period === period)
  }

  const todaySlots = PERIODS.map(p => ({
    period: p,
    slot: getSlot(todayIdx === 0 ? 7 : todayIdx, p.num)
  })).filter(s => s.slot)

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Timetable</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your weekly class schedule</p>
      </div>

      {todaySlots.length > 0 && (
        <div className="rounded-2xl border p-5"
          style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.04))', borderColor: 'rgba(99,102,241,0.15)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: '#6366f1' }}>📅 Today's Classes</h3>
          <div className="space-y-2">
            {todaySlots.map(({ period, slot }) => {
              const sc = SUBJECT_COLORS[slot.subject?.name || ''] || SUBJECT_COLORS.default
              return (
                <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: sc.bg }}>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.5)' }}>
                    {period.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate" style={{ color: sc.color }}>{slot.subject?.name || 'Free'}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {slot.teacher?.user?.name || ''} {slot.room ? `· ${slot.room}` : ''}
                    </p>
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{period.time}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Weekly Schedule</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center"><p style={{ color: 'var(--text-muted)' }}>Loading timetable…</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse" style={{ minWidth: 700 }}>
              <thead>
                <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-color)' }}>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide w-24"
                    style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                    Period
                  </th>
                  {DAYS.map((day, di) => (
                    <th key={day} className="px-3 py-3 text-center text-sm font-bold"
                      style={{
                        color: di + 1 === todayIdx ? '#6366f1' : 'var(--text-primary)',
                        borderRight: di < 5 ? '1px solid var(--border-color)' : 'none',
                        background: di + 1 === todayIdx ? 'rgba(99,102,241,0.04)' : 'transparent'
                      }}>
                      {day.slice(0,3)}
                      {di + 1 === todayIdx && (
                        <span className="block text-[10px] font-medium" style={{ color: '#6366f1' }}>Today</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period, pi) => (
                  <tr key={period.num} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td className="px-4 py-3" style={{ borderRight: '1px solid var(--border-color)' }}>
                      <p className="text-sm font-bold" style={{ color: '#6366f1' }}>P{period.num}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{period.time}</p>
                    </td>
                    {DAYS.map((_, di) => {
                      const slot = getSlot(di + 1, period.num)
                      const sc   = slot ? (SUBJECT_COLORS[slot.subject?.name || ''] || SUBJECT_COLORS.default) : null
                      return (
                        <td key={di} className="px-2 py-2"
                          style={{ borderRight: di < 5 ? '1px solid var(--border-color)' : 'none', minWidth: 100, verticalAlign: 'top' }}>
                          {slot && sc ? (
                            <div className="rounded-xl p-2.5" style={{ background: sc.bg }}>
                              <p className="text-xs font-bold" style={{ color: sc.color }}>{slot.subject?.name}</p>
                              {slot.teacher && (
                                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                  {slot.teacher.user?.name}
                                </p>
                              )}
                              {slot.room && (
                                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>📍 {slot.room}</p>
                              )}
                            </div>
                          ) : (
                            <div className="h-12 rounded-xl flex items-center justify-center"
                              style={{ background: 'var(--bg-page)', color: 'var(--border-color)', fontSize: 18 }}>
                              —
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}