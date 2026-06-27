'use client'
import { useState, useEffect, useCallback } from 'react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface SectionLite {
  id: string
  name: string
}
interface ClassWithSections {
  id: string
  name: string
  sections: SectionLite[]
}
interface Student {
  id: string
  rollNumber: string | null
  gender: string | null
  user: { name: string; email: string }
  section: { id: string; name: string; class: { name: string } } | null
}
interface AttendanceRecordFull {
  studentId: string
  status: string
  remarks: string | null
  student: { user: { name: string } }
}
interface AttendanceSessionFull {
  id: string
  date: string
  section: { name: string; class: { name: string } }
  records: AttendanceRecordFull[]
}

const AVATAR_COLORS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#f43f5e,#ec4899)',
  'linear-gradient(135deg,#f59e0b,#f43f5e)',
  'linear-gradient(135deg,#8b5cf6,#ec4899)',
]

const STATUS_OPTIONS = [
  { key: 'PRESENT', label: '✓ Present', activeBg: 'rgba(16,185,129,0.12)', activeBorder: 'rgba(16,185,129,0.4)', activeText: '#10b981' },
  { key: 'ABSENT',  label: '✕ Absent',  activeBg: 'rgba(244,63,94,0.12)',  activeBorder: 'rgba(244,63,94,0.4)',  activeText: '#f43f5e' },
  { key: 'LATE',    label: '⏰ Late',    activeBg: 'rgba(245,158,11,0.12)', activeBorder: 'rgba(245,158,11,0.4)', activeText: '#f59e0b' },
]

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassWithSections[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)

  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')

  const [students, setStudents] = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)

  const [attendance, setAttendance] = useState<Record<string, string>>({})
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [date, setDate] = useState(todayISO())
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [tab, setTab] = useState<'mark' | 'history'>('mark')

  const [sessions, setSessions] = useState<AttendanceSessionFull[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)

  // ---- load classes + sections for the dropdowns ----
  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false))
  }, [])

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const sectionsForClass = selectedClass?.sections || []

  // reset section choice whenever class changes
  function handleClassChange(classId: string) {
    setSelectedClassId(classId)
    setSelectedSectionId('')
    setStudents([])
    setAttendance({})
    setRemarks({})
  }

  // ---- load students for the selected section, and any existing attendance for the chosen date ----
  const fetchStudentsAndExisting = useCallback(async () => {
    if (!selectedSectionId) return
    setLoadingStudents(true)
    setSaveError('')
    try {
      const res = await fetch(`/api/students?sectionId=${selectedSectionId}`)
      const data: Student[] = await res.json()
      setStudents(Array.isArray(data) ? data : [])

      // default everyone to PRESENT, then overlay any existing session for this date
      const init: Record<string, string> = {}
      data.forEach(s => { init[s.id] = 'PRESENT' })

      const existingRes = await fetch(`/api/attendance?sectionId=${selectedSectionId}&date=${date}`)
      const existing: AttendanceSessionFull[] = await existingRes.json()
      const existingSession = Array.isArray(existing) ? existing[0] : null
      const existingRemarks: Record<string, string> = {}
      if (existingSession) {
        existingSession.records.forEach(r => {
          init[r.studentId] = r.status
          if (r.remarks) existingRemarks[r.studentId] = r.remarks
        })
      }

      setAttendance(init)
      setRemarks(existingRemarks)
    } catch {
      setStudents([])
    }
    setLoadingStudents(false)
  }, [selectedSectionId, date])

  useEffect(() => { fetchStudentsAndExisting() }, [fetchStudentsAndExisting])

  // ---- load history for the selected section ----
  const fetchSessions = useCallback(async () => {
    if (!selectedSectionId) { setSessions([]); return }
    setLoadingSessions(true)
    try {
      const res = await fetch(`/api/attendance?sectionId=${selectedSectionId}`)
      const data = await res.json()
      setSessions(Array.isArray(data) ? data : [])
    } catch {
      setSessions([])
    }
    setLoadingSessions(false)
  }, [selectedSectionId])

  useEffect(() => { if (tab === 'history') fetchSessions() }, [tab, fetchSessions])

  function toggleStatus(id: string, status: string) {
    setAttendance(prev => ({ ...prev, [id]: status }))
  }

  function markAllPresent() {
    const all: Record<string, string> = {}
    students.forEach(s => { all[s.id] = 'PRESENT' })
    setAttendance(all)
  }

  async function handleSave() {
    if (!selectedSectionId) return
    setSaving(true)
    setSaveError('')
    try {
      const records = students.map(s => ({
        studentId: s.id,
        status: attendance[s.id] || 'PRESENT',
        remarks: remarks[s.id] || undefined,
      }))
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selectedSectionId, date, records })
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save attendance')
        setSaving(false)
        return
      }
      setSaving(false)
      setSaved(true)
      if (tab === 'history') fetchSessions()
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setSaveError('Network error. Please try again.')
      setSaving(false)
    }
  }

  const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length
  const absentCount  = Object.values(attendance).filter(s => s === 'ABSENT').length
  const lateCount    = Object.values(attendance).filter(s => s === 'LATE').length
  const total        = students.length

  const filtered = students.filter(s =>
    s.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    (s.rollNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  const sectionChosen = !!selectedSectionId

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(99,102,241,0.1)' }}>📅</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Attendance</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Mark and track student attendance with ease
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTab('history')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all"
            style={{
              background: tab === 'history' ? 'rgba(99,102,241,0.08)' : 'var(--bg-card)',
              borderColor: tab === 'history' ? 'rgba(99,102,241,0.3)' : 'var(--border-color)',
              color: tab === 'history' ? '#6366f1' : 'var(--text-secondary)'
            }}>
            🕐 Attendance History
          </button>
          <button
            onClick={() => setTab('mark')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            📋 Mark Attendance
          </button>
        </div>
      </div>

      {/* Stat Cards — only meaningful once a section is chosen */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: total, sub: sectionChosen ? 'In selected section' : 'Pick a class & section', icon: '👥', color: '#6366f1' },
          { label: 'Present', value: presentCount, sub: `${total > 0 ? Math.round((presentCount/total)*100) : 0}% of total`, icon: '✅', color: '#10b981' },
          { label: 'Absent', value: absentCount, sub: `${total > 0 ? Math.round((absentCount/total)*100) : 0}% of total`, icon: '❌', color: '#f43f5e' },
          { label: 'Late', value: lateCount, sub: `${total > 0 ? Math.round((lateCount/total)*100) : 0}% of total`, icon: '⏰', color: '#f59e0b' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${stat.color}18` }}>
                {stat.icon}
              </div>
            </div>
            <div>
              <p className="text-3xl font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Class / Section / Date selectors — always visible, drive everything below */}
      <div className="rounded-2xl border p-4" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col min-w-52">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
              style={{ color: 'var(--text-muted)' }}>Select Date</label>
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
              <span className="text-sm">📅</span>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="flex-1 text-sm font-medium bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }} />
            </div>
          </div>

          <div className="flex flex-col min-w-44">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
              style={{ color: 'var(--text-muted)' }}>Class *</label>
            <select value={selectedClassId} onChange={e => handleClassChange(e.target.value)}
              className="px-3 py-2.5 rounded-xl border text-sm font-medium outline-none"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{loadingClasses ? 'Loading…' : 'Select class'}</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="flex flex-col min-w-44">
            <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 px-1"
              style={{ color: 'var(--text-muted)' }}>Section *</label>
            <select value={selectedSectionId} onChange={e => setSelectedSectionId(e.target.value)}
              disabled={!selectedClassId}
              className="px-3 py-2.5 rounded-xl border text-sm font-medium outline-none disabled:opacity-50"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              <option value="">{!selectedClassId ? 'Pick a class first' : sectionsForClass.length === 0 ? 'No sections yet' : 'Select section'}</option>
              {sectionsForClass.map(s => <option key={s.id} value={s.id}>Section {s.name}</option>)}
            </select>
          </div>

          {sectionChosen && (
            <div className="flex items-center gap-2 flex-1 min-w-48 px-4 py-2.5 rounded-xl border self-end"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
              <input placeholder="Search students by name or roll no..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }} />
            </div>
          )}
        </div>
      </div>

      {!sectionChosen ? (
        <div className="rounded-2xl border py-20 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-5xl mb-4">🎯</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pick a class and section to begin</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Attendance is tracked per class section — choose both above
          </p>
        </div>
      ) : tab === 'mark' ? (
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

          <div className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border-color)' }}>
            <div>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                Mark Attendance — {selectedClass?.name} · Section {sectionsForClass.find(s => s.id === selectedSectionId)?.name}
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                {total} Students
              </span>
              <button onClick={markAllPresent}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>
                ✓ Mark All Present
              </button>
            </div>
          </div>

          {saveError && (
            <div className="px-5 py-3 text-sm font-medium" style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.06)' }}>
              ⚠ {saveError}
            </div>
          )}

          {loadingStudents ? (
            <div className="p-8 space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-page)' }} />
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-5xl mb-4">📋</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No students in this section</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Add students to this class & section first</p>
            </div>
          ) : (
            <>
              <div className="hidden md:grid px-5 py-3 text-xs font-bold uppercase tracking-wide border-b"
                style={{
                  gridTemplateColumns: '2.5fr 1fr 2fr 1.5fr',
                  background: 'var(--bg-page)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-muted)'
                }}>
                <span>Student</span>
                <span>Roll No.</span>
                <span>Status</span>
                <span>Remarks (Optional)</span>
              </div>

              <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                {filtered.map((student, i) => {
                  const initials = (student.user?.name || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                  const grad = AVATAR_COLORS[i % AVATAR_COLORS.length]
                  const status = attendance[student.id] || 'PRESENT'

                  return (
                    <div key={student.id}
                      className="grid items-center px-5 py-3.5 transition-colors gap-2"
                      style={{ gridTemplateColumns: '2.5fr 1fr 2fr 1.5fr' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                          style={{ background: grad }}>{initials}</div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {student.user?.name}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {student.user?.email}
                          </p>
                        </div>
                      </div>

                      <p className="text-sm font-mono font-medium" style={{ color: student.rollNumber ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                        {student.rollNumber || '—'}
                      </p>

                      <div className="flex items-center gap-2">
                        {STATUS_OPTIONS.map(btn => {
                          const isActive = status === btn.key
                          return (
                            <button key={btn.key}
                              onClick={() => toggleStatus(student.id, btn.key)}
                              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                              style={isActive ? {
                                background: btn.activeBg,
                                borderColor: btn.activeBorder,
                                color: btn.activeText,
                              } : {
                                background: 'var(--bg-page)',
                                borderColor: 'var(--border-color)',
                                color: 'var(--text-muted)'
                              }}>
                              {btn.label}
                            </button>
                          )
                        })}
                      </div>

                      <input
                        placeholder="Add remark (optional)"
                        value={remarks[student.id] || ''}
                        onChange={e => setRemarks(prev => ({ ...prev, [student.id]: e.target.value }))}
                        className="px-3 py-1.5 rounded-xl border text-xs bg-transparent outline-none w-full"
                        style={{
                          borderColor: 'var(--border-color)',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-page)'
                        }} />
                    </div>
                  )
                })}
              </div>

              <div className="px-5 py-4 border-t flex items-center justify-between"
                style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Showing {filtered.length} of {students.length} students
                </p>
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
                  {saved ? '✓ Saved!' : saving ? 'Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        /* History Tab — scoped to selected section only */
        <div className="space-y-4">
          {loadingSessions ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'var(--bg-page)' }} />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-2xl border py-20 text-center"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <p className="text-5xl mb-4">📋</p>
              <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No records yet</p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                Mark attendance for this section to see history here
              </p>
            </div>
          ) : sessions.map(session => {
            const present = session.records.filter(r => r.status === 'PRESENT').length
            const tot = session.records.length
            const pct = tot > 0 ? Math.round((present / tot) * 100) : 0
            const pctColor = pct >= 85 ? '#10b981' : pct >= 75 ? '#f59e0b' : '#f43f5e'

            return (
              <div key={session.id} className="rounded-2xl border p-5"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
                      {new Date(session.date).toLocaleDateString('en-IN', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {session.section?.class?.name} — Section {session.section?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black" style={{ color: pctColor }}>{pct}%</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{present}/{tot} present</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {session.records.map(r => (
                    <span key={r.studentId} className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{
                        background: r.status === 'PRESENT' ? 'rgba(16,185,129,0.1)' :
                          r.status === 'ABSENT' ? 'rgba(244,63,94,0.1)' : 'rgba(245,158,11,0.1)',
                        color: r.status === 'PRESENT' ? '#10b981' :
                          r.status === 'ABSENT' ? '#f43f5e' : '#f59e0b'
                      }}>
                      {r.student?.user?.name}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}