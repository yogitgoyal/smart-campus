'use client'
import React from 'react'
import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ClassLite { id: string; name: string }
interface PeriodRow {
  id?: string
  periodNumber: number | null
  label: string
  startTime: string
  endTime: string
  isBreak: boolean
}

function ConfigurePeriodsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialClassId = searchParams.get('classId') || ''

  const [classes, setClasses] = useState<ClassLite[]>([])
  const [classId, setClassId] = useState(initialClassId)
  const [rows, setRows] = useState<PeriodRow[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/classes')
      .then(res => res.json())
      .then(data => setClasses(Array.isArray(data) ? data.map((c: ClassLite) => ({ id: c.id, name: c.name })) : []))
      .catch(() => setClasses([]))
  }, [])

  const loadPeriods = useCallback(async (id: string) => {
    if (!id) { setRows([]); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/periods?classId=${id}`)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load periods'); setRows([]); return }
      setRows(Array.isArray(data) ? data : [])
    } catch {
      setError('Network error loading periods')
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadPeriods(classId) }, [classId, loadPeriods])

  function updateRow(index: number, patch: Partial<PeriodRow>) {
    setSaved(false)
    setRows(prev => prev.map((r, i) => i === index ? { ...r, ...patch } : r))
  }

  function addRow(isBreak: boolean) {
    setSaved(false)
    setRows(prev => [
      ...prev,
      {
        periodNumber: null,
        label: isBreak ? 'Break' : `P${prev.filter(r => !r.isBreak).length + 1}`,
        startTime: '08:00',
        endTime: '08:45',
        isBreak,
      }
    ])
  }

  function removeRow(index: number) {
    setSaved(false)
    setRows(prev => prev.filter((_, i) => i !== index))
  }

  function moveRow(index: number, dir: -1 | 1) {
    setSaved(false)
    setRows(prev => {
      const next = [...prev]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleSave() {
    if (!classId || rows.length === 0) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          periods: rows.map(r => ({
            label: r.label,
            startTime: r.startTime,
            endTime: r.endTime,
            isBreak: r.isBreak,
          }))
        })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save periods'); return }
      setRows(data)
      setSaved(true)
    } catch {
      setError('Network error saving periods')
    }
    setSaving(false)
  }

  return (
    <div className="max-w-3xl space-y-6">
      <button
        onClick={() => router.push(classId ? `/dashboard/timetable?classId=${classId}` : '/dashboard/timetable')}
        className="text-sm font-medium"
        style={{ color: 'var(--text-muted)' }}>
        ← Back to Timetable
      </button>

      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
          style={{ background: 'rgba(99,102,241,0.1)' }}>⏱️</div>
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Configure Periods</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Set how many periods this class has, their timings, and where breaks fall
          </p>
        </div>
      </div>

      <div className="rounded-2xl border p-4"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <Label>Class</Label>
        <select value={classId} onChange={e => setClassId(e.target.value)}
          className="mt-1.5 w-full max-w-xs px-3 py-2.5 rounded-xl border text-sm font-medium outline-none"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="">Select class</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {!classId ? (
        <div className="rounded-2xl border py-16 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Pick a class to configure its periods</p>
        </div>
      ) : loading ? (
        <div className="rounded-2xl border py-16 text-center"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading periods…</p>
        </div>
      ) : (
        <div className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

          {error && (
            <div className="px-5 py-3 text-sm font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
              ⚠ {error}
            </div>
          )}

          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {rows.map((row, i) => (
              <div key={row.id || `new-${i}`}
                className="flex items-center gap-3 px-5 py-3 flex-wrap"
                style={{ background: row.isBreak ? 'var(--bg-page)' : 'transparent' }}>

                <div className="flex flex-col gap-0.5">
                  <button onClick={() => moveRow(i, -1)} disabled={i === 0}
                    className="text-xs disabled:opacity-30" style={{ color: 'var(--text-muted)' }}>▲</button>
                  <button onClick={() => moveRow(i, 1)} disabled={i === rows.length - 1}
                    className="text-xs disabled:opacity-30" style={{ color: 'var(--text-muted)' }}>▼</button>
                </div>

                <span className="text-xs font-mono w-7 text-center" style={{ color: 'var(--text-muted)' }}>
                  {row.isBreak ? '☕' : `P${row.periodNumber ?? '?'}`}
                </span>

                <Input value={row.label} onChange={e => updateRow(i, { label: e.target.value })}
                  className="w-32" placeholder="Label" />

                <Input type="time" value={row.startTime} onChange={e => updateRow(i, { startTime: e.target.value })}
                  className="w-28" />
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <Input type="time" value={row.endTime} onChange={e => updateRow(i, { endTime: e.target.value })}
                  className="w-28" />

                <button
                  onClick={() => updateRow(i, { isBreak: !row.isBreak })}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                  style={{
                    background: row.isBreak ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)',
                    color: row.isBreak ? '#6366f1' : '#10b981'
                  }}>
                  {row.isBreak ? 'Mark as period' : 'Mark as break'}
                </button>

                <button onClick={() => removeRow(i)}
                  className="ml-auto text-xs font-semibold px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
                  Remove
                </button>
              </div>
            ))}

            {rows.length === 0 && (
              <div className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                No periods yet — add one below
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t flex items-center gap-3 flex-wrap"
            style={{ borderColor: 'var(--border-color)' }}>
            <Button variant="outline" onClick={() => addRow(false)}>+ Add Period</Button>
            <Button variant="outline" onClick={() => addRow(true)}>+ Add Break</Button>
            <Button onClick={handleSave} disabled={saving || rows.length === 0}
              className="ml-auto text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {saving ? 'Saving…' : 'Save Periods'}
            </Button>
          </div>

          {saved && (
            <div className="px-5 py-2 text-xs font-medium" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
              ✓ Saved — period numbers renumbered automatically based on the order above
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ConfigurePeriodsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center" style={{ color: 'var(--text-muted)' }}>Loading…</div>}>
      <ConfigurePeriodsInner />
    </Suspense>
  )
}