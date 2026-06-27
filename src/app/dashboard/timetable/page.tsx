'use client'
import React from 'react'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const SUBJECT_THEMES: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  Mathematics: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#6366f1', icon: '📐' },
  Science: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#10b981', icon: '🔬' },
  English: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#3b82f6', icon: '📖' },
  Physics: { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b', icon: '⚡' },
  Chemistry: { bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', text: '#10b981', icon: '🧪' },
  History: { bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', text: '#f97316', icon: '🏛' },
  Geography: { bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.2)', text: '#14b8a6', icon: '🌍' },
  Computer: { bg: 'rgba(59,130,246,0.08)', border: 'rgba(59,130,246,0.2)', text: '#3b82f6', icon: '💻' },
  Art: { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', text: '#f43f5e', icon: '🎨' },
  'Physical Edu.': { bg: 'rgba(244,63,94,0.08)', border: 'rgba(244,63,94,0.2)', text: '#f43f5e', icon: '🏃' },
  Library: { bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', text: '#8b5cf6', icon: '📚' },
  Mentorship: { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#6366f1', icon: '🤝' },
  'Club Activity': { bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', text: '#f59e0b', icon: '⭐' },
}
const DEFAULT_THEME = { bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.2)', text: '#6366f1', icon: '📋' }
function getTheme(name: string) { return SUBJECT_THEMES[name] || DEFAULT_THEME }

interface SectionLite { id: string; name: string }
interface ClassWithSections { id: string; name: string; sections: SectionLite[] }
interface Slot {
  id: string
  dayOfWeek: number
  period: number
  startTime: string
  endTime: string
  room: string | null
  subject: { name: string } | null
  teacher: { user: { name: string } } | null
}
interface PeriodRow {
  id: string
  periodNumber: number | null
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}

function TimetablePageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [classes, setClasses] = useState<ClassWithSections[]>([])
  const [loadingClasses, setLoadingClasses] = useState(true)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')

  const [periods, setPeriods] = useState<PeriodRow[]>([])
  const [loadingPeriods, setLoadingPeriods] = useState(false)

  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ day: number; periodNumber: number } | null>(null)
  const [form, setForm] = useState({ subjectName: '', teacherName: '', startTime: '08:00', endTime: '08:45', room: '' })
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : []
        setClasses(list)
        const fromUrl = searchParams.get('classId')
        if (fromUrl && list.some((c: ClassWithSections) => c.id === fromUrl)) {
          setSelectedClassId(fromUrl)
        }
      })
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false))
    // run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedClass = classes.find(c => c.id === selectedClassId)
  const sectionsForClass = selectedClass?.sections || []
  const selectedSection = sectionsForClass.find(s => s.id === selectedSectionId)

  function handleClassChange(classId: string) {
    setSelectedClassId(classId)
    setSelectedSectionId('')
    setSlots([])
  }

  // Periods belong to the CLASS, not the section -- reload whenever the class changes.
  const fetchPeriods = useCallback(async () => {
    if (!selectedClassId) { setPeriods([]); return }
    setLoadingPeriods(true)
    try {
      const res = await fetch(`/api/periods?classId=${selectedClassId}`)
      const data = await res.json()
      setPeriods(Array.isArray(data) ? data : [])
    } catch {
      setPeriods([])
    }
    setLoadingPeriods(false)
  }, [selectedClassId])

  useEffect(() => { fetchPeriods() }, [fetchPeriods])

  const fetchSlots = useCallback(async () => {
    if (!selectedSectionId) { setSlots([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/timetable?sectionId=${selectedSectionId}`)
      const data = await res.json()
      setSlots(Array.isArray(data) ? data : [])
    } catch {
      setSlots([])
    }
    setLoading(false)
  }, [selectedSectionId])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  function getSlot(day: number, periodNumber: number) {
    return slots.find(s => s.dayOfWeek === day && s.period === periodNumber)
  }

  function openModal(day: number, periodNumber: number) {
    if (!selectedSectionId) return
    const existing = getSlot(day, periodNumber)
    const p = periods.find(p => p.periodNumber === periodNumber)
    setSelected({ day, periodNumber })
    setSaveError('')
    setSaving(false)
    setForm({
      subjectName: existing?.subject?.name || '',
      teacherName: existing?.teacher?.user?.name || '',
      startTime: existing?.startTime || p?.startTime || '08:00',
      endTime: existing?.endTime || p?.endTime || '08:45',
      room: existing?.room || ''
    })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!selected || !form.subjectName.trim() || !selectedSectionId || saving) return
    setSaving(true)
    setSaveError('')
    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          sectionId: selectedSectionId,
          dayOfWeek: selected.day,
          period: selected.periodNumber
        })
      })
      const data = await res.json()
      if (!res.ok) {
        setSaveError(data.error || 'Failed to save slot')
        return
      }
      setOpen(false)
      fetchSlots()
    } catch {
      setSaveError('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await fetch('/api/timetable', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    fetchSlots()
  }

  const legends = [
    { label: 'Academic', color: '#6366f1' },
    { label: 'Science', color: '#10b981' },
    { label: 'Languages', color: '#3b82f6' },
    { label: 'Activity', color: '#f43f5e' },
    { label: 'Others', color: '#f59e0b' },
  ]

  const sectionChosen = !!selectedSectionId

  return (
    <div className="max-w-full space-y-6">

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(99,102,241,0.1)' }}>📅</div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Timetable</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Manage class schedules and period timings
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border p-4 flex flex-wrap items-end gap-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

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

        <div className="flex items-end gap-2 ml-auto">
          {selectedClassId && (
            <button
              onClick={() => router.push(`/dashboard/timetable/periods?classId=${selectedClassId}`)}
              className="px-4 py-2.5 rounded-xl border text-sm font-medium"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
              ⚙ Configure Periods
            </button>
          )}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
            style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
            <span className="text-sm">📅</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {!sectionChosen ? (
        <div className="rounded-2xl border py-20 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-5xl mb-4">🗓️</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Pick a class and section to view its timetable</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Timetable slots are scoped to one class section — choose both above
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          {loading || loadingPeriods ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading timetable...</div>
          ) : periods.length === 0 ? (
            <div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>
              No periods configured for {selectedClass?.name} yet.{' '}
              <button onClick={() => router.push(`/dashboard/timetable/periods?classId=${selectedClassId}`)}
                className="font-semibold underline" style={{ color: '#6366f1' }}>
                Configure periods
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" style={{ minWidth: '900px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-color)' }}>
                    <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wide w-32"
                      style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                      Period / Time
                    </th>
                    {DAYS.map(day => (
                      <th key={day} className="text-center px-3 py-4 text-sm font-bold"
                        style={{ color: 'var(--text-primary)', borderRight: '1px solid var(--border-color)' }}>
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {periods.map(period => (
                    period.isBreak ? (
                      <tr key={period.id} style={{ background: 'var(--bg-page)', borderBottom: '1px solid var(--border-color)', borderTop: '1px solid var(--border-color)' }}>
                        <td className="px-5 py-2.5 text-xs font-medium"
                          style={{ color: 'var(--text-muted)', borderRight: '1px solid var(--border-color)' }}>
                          ⏱ {period.startTime} – {period.endTime}
                        </td>
                        <td colSpan={6} className="px-4 py-2.5 text-center text-xs font-bold tracking-wide"
                          style={{ color: 'var(--text-muted)' }}>
                          ☕ {period.label || 'Break Time'}
                        </td>
                      </tr>
                    ) : (
                      <tr key={period.id} style={{ borderBottom: '1px solid var(--border-color)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>

                        <td className="px-5 py-3" style={{ borderRight: '1px solid var(--border-color)', verticalAlign: 'top' }}>
                          <p className="text-sm font-bold" style={{ color: '#6366f1' }}>{period.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{period.startTime} – {period.endTime}</p>
                        </td>

                        {DAYS.map((_, dayIdx) => {
                          const slot = period.periodNumber != null ? getSlot(dayIdx + 1, period.periodNumber) : undefined
                          const theme = slot?.subject?.name ? getTheme(slot.subject.name) : null

                          return (
                            <td key={dayIdx} className="px-2 py-2"
                              style={{ borderRight: dayIdx < 5 ? '1px solid var(--border-color)' : 'none', verticalAlign: 'top', minWidth: '130px' }}>
                              {slot && theme ? (
                                <div
                                  className="group relative rounded-xl border p-2.5 cursor-pointer transition-all hover:shadow-md"
                                  style={{ background: theme.bg, borderColor: theme.border }}
                                  onClick={() => period.periodNumber != null && openModal(dayIdx + 1, period.periodNumber)}>
                                  <div className="flex items-start gap-2">
                                    <span className="text-base flex-shrink-0">{theme.icon}</span>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold truncate" style={{ color: theme.text }}>
                                        {slot.subject?.name}
                                      </p>
                                      {slot.teacher && (
                                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                                          {slot.teacher.user.name}
                                        </p>
                                      )}
                                      {slot.room && (
                                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                          📍 {slot.room}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={e => handleDelete(slot.id, e)}
                                    className="absolute top-1 right-1 w-5 h-5 rounded-md flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    style={{ background: 'rgba(244,63,94,0.15)', color: '#f43f5e' }}>
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => period.periodNumber != null && openModal(dayIdx + 1, period.periodNumber)}
                                  className="w-full h-14 rounded-xl border-2 border-dashed flex items-center justify-center text-lg transition-all hover:border-indigo-300 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5"
                                  style={{ borderColor: 'var(--border-color)', color: 'var(--border-color)' }}>
                                  +
                                </button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="px-5 py-4 border-t flex items-center justify-between flex-wrap gap-3"
            style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing timetable for {selectedClass?.name}, Section {selectedSection?.name}
            </p>
            <div className="flex items-center gap-4">
              {legends.map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {selected && `${DAYS[selected.day - 1]} — Period ${selected.periodNumber}`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {saveError && (
              <div className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
                ⚠ {saveError}
              </div>
            )}
            <div>
              <Label>Subject Name</Label>
              <Input placeholder="e.g. Mathematics"
                value={form.subjectName}
                onChange={e => setForm({ ...form, subjectName: e.target.value })}
                className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Teacher Name</Label>
              <Input placeholder="e.g. Mr. Sharma"
                value={form.teacherName}
                onChange={e => setForm({ ...form, teacherName: e.target.value })}
                className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={form.startTime}
                  onChange={e => setForm({ ...form, startTime: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={form.endTime}
                  onChange={e => setForm({ ...form, endTime: e.target.value })}
                  className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Room (optional)</Label>
              <Input placeholder="e.g. Room 101"
                value={form.room}
                onChange={e => setForm({ ...form, room: e.target.value })}
                className="mt-1" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={!form.subjectName.trim() || saving}
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving ? 'Saving…' : 'Save Slot'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TimetablePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
      <TimetablePageInner />
    </Suspense>
  )
}