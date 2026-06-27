'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Assignment {
  id: string
  title: string
  description?: string
  dueDate?: string
  maxMarks?: number
  fileUrl?: string
  teacher: { user: { name: string } }
  class: { name: string }
  subject?: { name: string }
  submissions: { id: string }[]
}

interface Class {
  id: string
  name: string
  _count?: { sections: number; subjects: number; assignments: number }
  sections?: { id: string; name: string; students: { id: string }[] }[]
  subjects?: { id: string; name: string }[]
}

const sparkUp = [{ v: 2 }, { v: 4 }, { v: 3 }, { v: 6 }, { v: 5 }, { v: 8 }, { v: 7 }, { v: 9 }]
const sparkGreen = [{ v: 1 }, { v: 3 }, { v: 2 }, { v: 5 }, { v: 4 }, { v: 7 }, { v: 6 }, { v: 9 }]
const sparkRed = [{ v: 9 }, { v: 8 }, { v: 6 }, { v: 7 }, { v: 5 }, { v: 4 }, { v: 2 }, { v: 1 }]
const sparkBlue = [{ v: 2 }, { v: 3 }, { v: 5 }, { v: 4 }, { v: 6 }, { v: 5 }, { v: 7 }, { v: 9 }]

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [classFilter, setClassFilter] = useState('All')
  const [open, setOpen] = useState(false)
  const [classesOpen, setClassesOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  // Classes form
  const [newClassName, setNewClassName] = useState('')
  const [createClassLoading, setCreateClassLoading] = useState(false)
  const [deleteClassId, setDeleteClassId] = useState<string | null>(null)
  const [deleteClassLoading, setDeleteClassLoading] = useState(false)

  const [form, setForm] = useState({
    title: '', description: '', dueDate: '',
    maxMarks: '', subject: '', classId: '', fileUrl: ''
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [aRes, cRes] = await Promise.all([
      fetch('/api/assignments'),
      fetch('/api/classes'),
    ])
    const aData = await aRes.json()
    const cData = cRes.ok ? await cRes.json() : []
    setAssignments(Array.isArray(aData) ? aData : [])
    setClasses(Array.isArray(cData) ? cData : [])
    setLoading(false)
  }

  async function handleSubmit() {
    if (!form.title.trim()) return
    setSubmitting(true)
    const fd = new FormData()
    fd.append('title', form.title)
    if (form.description) fd.append('description', form.description)
    if (form.dueDate) fd.append('dueDate', form.dueDate)
    if (form.maxMarks) fd.append('maxMarks', form.maxMarks)
    if (form.subject) fd.append('subject', form.subject)
    if (form.classId) fd.append('classId', form.classId)
    if (form.fileUrl && !form.fileUrl.startsWith('uploading:')) {
      fd.append('fileUrl', form.fileUrl)
    }

    const res = await fetch('/api/assignments', { method: 'POST', body: fd })
    if (res.ok) {
      setOpen(false)
      setForm({ title: '', description: '', dueDate: '', maxMarks: '', subject: '', classId: '', fileUrl: '' })
      fetchData()
    }
    setSubmitting(false)
  }

  // Bulk delete
  function toggleSelect(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map(a => a.id)))
    }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true)
    try {
      const res = await fetch('/api/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected) })
      })
      if (res.ok) {
        setSelected(new Set())
        setDeleteConfirmOpen(false)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
    setBulkDeleting(false)
  }

  // Create class
  async function handleCreateClass() {
    if (!newClassName.trim()) return
    setCreateClassLoading(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newClassName.trim() })
      })
      if (res.ok) {
        setNewClassName('')
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
    setCreateClassLoading(false)
  }

  // Delete class
  async function handleDeleteClass() {
    if (!deleteClassId) return
    setDeleteClassLoading(true)
    try {
      const res = await fetch('/api/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: deleteClassId })
      })
      if (res.ok) {
        setDeleteClassId(null)
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
    setDeleteClassLoading(false)
  }

  const now = new Date()
  const total = assignments.length
  const overdue = assignments.filter(a => a.dueDate && new Date(a.dueDate) < now).length
  const completed = assignments.filter(a => (a.submissions?.length || 0) > 0).length
  const todo = total - completed

  const filtered = assignments.filter(a => {
    const matchSearch = a.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Overdue' && a.dueDate && new Date(a.dueDate) < now) ||
      (statusFilter === 'Active' && (!a.dueDate || new Date(a.dueDate) >= now))
    const matchClass = classFilter === 'All' || a.class?.name === classFilter
    return matchSearch && matchStatus && matchClass
  })

  function getStatus(a: Assignment) {
    if (!a.dueDate) return { label: 'No Due Date', bg: 'rgba(100,116,139,0.1)', color: '#64748b' }
    const diff = Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / 86400000)
    if (diff < 0) return { label: 'Overdue', bg: 'rgba(244,63,94,0.1)', color: '#f43f5e' }
    if (diff === 0) return { label: 'Due Today', bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    if (diff <= 2) return { label: `Due in ${diff}d`, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
    return { label: 'Active', bg: 'rgba(16,185,129,0.1)', color: '#10b981' }
  }

  const stats = [
    { label: 'Total Assignments', value: total, icon: '📋', color: '#6366f1', spark: sparkUp },
    { label: 'Completed', value: completed, icon: '✅', color: '#10b981', spark: sparkGreen },
    { label: 'Overdue', value: overdue, icon: '🔔', color: '#f43f5e', spark: sparkRed },
    { label: 'To Do', value: todo, icon: '📁', color: '#3b82f6', spark: sparkBlue },
  ]

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assignments</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage and track all assignments</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setClassesOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all hover:opacity-80"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)', background: 'var(--bg-card)' }}>
            🏫 Classes ({classes.length})
          </button>
          <button onClick={() => setOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
            + New Assignment
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
              style={{ background: `${stat.color}18` }}>{stat.icon}</div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-black tabular-nums" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
              </div>
              <div className="w-20 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stat.spark}>
                    <Line type="monotone" dataKey="v" stroke={stat.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Bulk actions */}
      <div className="rounded-2xl border p-4 flex flex-wrap items-center gap-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

        <div className="flex items-center gap-2 flex-1 min-w-48 px-4 py-2.5 rounded-xl border"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search assignments..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)' }} />
        </div>

        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Overdue">Overdue</option>
        </select>

        <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.name}>{c.name}</option>
          ))}
        </select>

        {selected.size > 0 && (
          <button
            onClick={() => setDeleteConfirmOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
            style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
            🗑 Delete ({selected.size})
          </button>
        )}

        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} of {total} assignments
        </span>
      </div>

      {/* List */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>

        <div className="grid px-6 py-3 text-xs font-bold uppercase tracking-wide border-b"
          style={{
            gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 0.8fr 0.6fr',
            background: 'var(--bg-page)',
            borderColor: 'var(--border-color)',
            color: 'var(--text-muted)'
          }}>
          <span className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={filtered.length > 0 && selected.size === filtered.length}
              onChange={toggleSelectAll}
              className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
            />
          </span>
          <span>Assignment</span>
          <span>Class / Subject</span>
          <span>Due Date</span>
          <span>Teacher</span>
          <span>Status</span>
          <span>Submitted</span>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-page)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">📝</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No assignments found</p>
            <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
              {search || statusFilter !== 'All' ? 'Try changing filters' : 'Create your first assignment'}
            </p>
            {!search && statusFilter === 'All' && (
              <button onClick={() => setOpen(true)}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                + New Assignment
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
            {filtered.map(a => {
              const status = getStatus(a)
              const isOverdue = a.dueDate && new Date(a.dueDate) < now
              const isSelected = selected.has(a.id)
              return (
                <div key={a.id}
                  className="grid items-center px-6 py-4 transition-colors"
                  style={{
                    gridTemplateColumns: '40px 2fr 1fr 1fr 1fr 0.8fr 0.6fr',
                    background: isSelected ? 'rgba(99,102,241,0.06)' : 'transparent'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}>

                  {/* Checkbox */}
                  <div className="flex items-center justify-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(a.id)}
                      className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                    />
                  </div>

                  {/* Title */}
                  <Link href={`/dashboard/assignments/${a.id}`} className="min-w-0 pr-4 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
                        ✏️
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate hover:underline" style={{ color: 'var(--text-primary)' }}>
                          {a.title}
                        </p>
                        {a.description && (
                          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {a.description}
                          </p>
                        )}
                        {a.fileUrl && (
                          <span className="text-xs mt-0.5 inline-block" style={{ color: '#6366f1' }}>
                            📎 Has attachment
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                      {a.class?.name || '—'}
                    </p>
                    {a.subject?.name && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.subject.name}</p>
                    )}
                  </div>

                  <div>
                    {a.dueDate ? (
                      <>
                        <p className="text-sm font-medium" style={{ color: isOverdue ? '#f43f5e' : 'var(--text-primary)' }}>
                          {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          {isOverdue ? 'Past due' : `${Math.ceil((new Date(a.dueDate).getTime() - now.getTime()) / 86400000)} days left`}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No due date</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                      {a.teacher?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-xs font-medium truncate" style={{ color: 'var(--text-secondary)' }}>
                      {a.teacher?.user?.name}
                    </p>
                  </div>

                  <div>
                    <span className="text-xs font-semibold px-2.5 py-1.5 rounded-lg"
                      style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-xl font-black" style={{ color: 'var(--text-primary)' }}>
                      {a.submissions?.length || 0}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>submitted</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t text-xs text-center"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
            Showing {filtered.length} of {total} assignments
          </div>
        )}
      </div>

      {/* ───────── Add Assignment Modal ───────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Title <span style={{ color: '#f43f5e' }}>*</span></Label>
              <Input placeholder="e.g. Chapter 3 Exercise"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Assignment instructions..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={form.dueDate}
                  onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>Max Marks</Label>
                <Input type="number" placeholder="100"
                  value={form.maxMarks}
                  onChange={e => setForm({ ...form, maxMarks: e.target.value })}
                  className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject</Label>
                <Input placeholder="e.g. Mathematics"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="mt-1" />
              </div>
              <div>
                <Label>Class</Label>
                <select value={form.classId}
                  onChange={e => setForm({ ...form, classId: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="">Select class</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <Label>Attach File</Label>
              <div className="mt-1 relative">
                <input
                  type="file"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setForm({ ...form, fileUrl: `uploading:${file.name}` })
                    const reader = new FileReader()
                    reader.onload = () => {
                      setForm(prev => ({ ...prev, fileUrl: reader.result as string }))
                    }
                    reader.readAsDataURL(file)
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all"
                  style={{
                    borderColor: form.fileUrl && !form.fileUrl.startsWith('uploading:') ? '#10b981' : 'var(--border-color)',
                    background: form.fileUrl && !form.fileUrl.startsWith('uploading:') ? 'rgba(16,185,129,0.05)' : 'var(--bg-page)',
                  }}>
                  <span className="text-2xl">
                    {form.fileUrl && !form.fileUrl.startsWith('uploading:') ? '✅' : '📎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    {form.fileUrl && !form.fileUrl.startsWith('uploading:') ? (
                      <>
                        <p className="text-sm font-semibold" style={{ color: '#10b981' }}>File attached</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Click to change file</p>
                      </>
                    ) : form.fileUrl?.startsWith('uploading:') ? (
                      <>
                        <p className="text-sm font-semibold" style={{ color: '#6366f1' }}>Loading...</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{form.fileUrl.replace('uploading:', '')}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Click to upload file</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>PDF, DOC, PPT, Images, ZIP (max 5MB)</p>
                      </>
                    )}
                  </div>
                  {form.fileUrl && !form.fileUrl.startsWith('uploading:') && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setForm({ ...form, fileUrl: '' }) }}
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                      style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                      ✕
                    </button>
                  )}
                </label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || !form.title.trim()}
                className="flex-1 text-white"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {submitting ? 'Creating...' : 'Create Assignment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───────── Classes Modal ───────── */}
      <Dialog open={classesOpen} onOpenChange={setClassesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>All Classes</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-4">

            {/* Add class */}
            <div className="flex gap-2">
              <Input
                placeholder="Class name (e.g. Class 10-A)"
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateClass()}
              />
              <Button
                onClick={handleCreateClass}
                disabled={createClassLoading || !newClassName.trim()}
                className="text-white px-5 flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {createClassLoading ? '...' : '+ Add'}
              </Button>
            </div>

            {/* Classes list */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {classes.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-3xl mb-2">🏫</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No classes yet. Add one above.</p>
                </div>
              ) : (
                classes.map(cls => (
                  <div key={cls.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border transition-colors"
                    style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(244,63,94,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-color)')}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: 'rgba(99,102,241,0.1)' }}>
                        🏫
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{cls.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {cls._count?.sections || 0} sections
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {cls._count?.subjects || 0} subjects
                          </span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                            {cls._count?.assignments || 0} assignments
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteClassId(cls.id)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs transition-all hover:scale-110"
                      style={{ background: 'rgba(244,63,94,0.1)', color: '#f43f5e' }}>
                      🗑
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───────── Delete Class Confirm ───────── */}
      <Dialog open={deleteClassId !== null} onOpenChange={(open) => { if (!open) setDeleteClassId(null) }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Class?</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            This will permanently delete this class and <strong style={{ color: 'var(--text-primary)' }}>all its sections, subjects, assignments, and submissions</strong>. This cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteClassId(null)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleDeleteClass}
              disabled={deleteClassLoading}
              className="flex-1 text-white"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
              {deleteClassLoading ? 'Deleting...' : 'Delete Class'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ───────── Bulk Delete Confirm ───────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {selected.size} Assignment{selected.size > 1 ? 's' : ''}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            This will permanently delete <strong style={{ color: 'var(--text-primary)' }}>{selected.size} assignment{selected.size > 1 ? 's' : ''}</strong> and all associated submissions. This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="flex-1">Cancel</Button>
            <Button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="flex-1 text-white"
              style={{ background: 'linear-gradient(135deg,#f43f5e,#e11d48)' }}>
              {bulkDeleting ? 'Deleting...' : `Delete ${selected.size}`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}