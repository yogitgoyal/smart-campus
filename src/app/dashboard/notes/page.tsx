'use client'
import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Note {
  id: string
  title: string
  description: string
  fileUrl: string
  createdAt: string
  teacher: { user: { name: string } }
  subject: { name: string } | null
}

const SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'History', 'Geography', 'Computer']
const TYPES = ['PDF', 'Document', 'Slides', 'Video', 'Other']

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([])
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('All Subjects')
  const [typeFilter, setTypeFilter] = useState('All Types')
  const [sortOrder, setSortOrder] = useState('newest')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState<File | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'single' | 'bulk'; id?: string }>({ open: false, type: 'single' })
  
  const [form, setForm] = useState({
    title: '', description: '', subject: 'General', type: 'PDF',
  })

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notes')
      if (res.ok) setNotes(await res.json())
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  async function handleSubmit() {
    if (!form.title.trim()) return
    const formData = new FormData()
    formData.append('title', form.title)
    formData.append('description', form.description)
    formData.append('subject', form.subject)
    formData.append('type', form.type)
    if (file) formData.append('file', file)

    try {
      await fetch('/api/notes', { method: 'POST', body: formData })
      setOpen(false)
      setForm({ title: '', description: '', subject: 'General', type: 'PDF' })
      setFile(null)
      fetchNotes()
    } catch (e) { console.error(e) }
  }

  /* ── Delete Logic ────────────────────────────── */
  function openDeleteDialog(type: 'single' | 'bulk', id?: string) {
    setDeleteDialog({ open: true, type, id })
  }

  async function executeDelete() {
    try {
      if (deleteDialog.type === 'single' && deleteDialog.id) {
        await fetch(`/api/notes?id=${deleteDialog.id}`, { method: 'DELETE' })
      } else if (deleteDialog.type === 'bulk' && selectedIds.size > 0) {
        await fetch(`/api/notes?ids=${Array.from(selectedIds).join(',')}`, { method: 'DELETE' })
        setSelectedIds(new Set())
      }
      fetchNotes()
    } catch (e) { console.error(e) }
    setDeleteDialog({ open: false, type: 'single' })
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length && filtered.length > 0) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(n => n.id)))
  }

  /* ── Filtering & Sorting ────────────────────── */
  const filtered = notes
    .filter(n => {
      const q = search.toLowerCase()
      const matchSearch = !q || n.title.toLowerCase().includes(q) || n.description?.toLowerCase().includes(q)
      const matchSub = subjectFilter === 'All Subjects' || n.subject?.name === subjectFilter
      const matchType = typeFilter === 'All Types' || n.fileUrl?.toLowerCase().endsWith(typeFilter.toLowerCase() === 'document' ? '.docx' : typeFilter.toLowerCase() === 'slides' ? '.pptx' : `.${typeFilter.toLowerCase()}`)
      return matchSearch && matchSub && matchType
    })
    .sort((a, b) => {
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortOrder === 'title') return a.title.localeCompare(b.title)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  /* ── Real Stats ─────────────────────────────── */
  const total = notes.length
  const subjects = new Set(notes.map(n => n.subject?.name).filter(Boolean)).size || (total > 0 ? 1 : 0)
  const withFile = notes.filter(n => n.fileUrl).length
  const recent = notes.filter(n => (Date.now() - new Date(n.createdAt).getTime()) / (1000 * 60 * 60 * 24) <= 7).length

  const stats = [
    { label: 'Total Notes', value: total, sub: 'All materials', color: '#6366f1', icon: '📄' },
    { label: 'Subjects', value: subjects, sub: 'Different topics', color: '#10b981', icon: '📋' },
    { label: 'Files Uploaded', value: withFile, sub: 'Ready to download', color: '#f43f5e', icon: '📁' },
    { label: 'Added Recently', value: recent, sub: 'Last 7 days', color: '#3b82f6', icon: '🕐' },
  ]

  function getSubjectColor(subject: string | null) {
    const map: Record<string, { bg: string; color: string }> = {
      Mathematics: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
      Science: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
      English: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
      Physics: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
      Chemistry: { bg: 'rgba(168,85,247,0.1)', color: '#a855f7' },
      History: { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
      Geography: { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
      Computer: { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    }
    return map[subject || ''] || { bg: 'rgba(100,116,139,0.1)', color: '#64748b' }
  }

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected
  const hasActiveFilters = search || subjectFilter !== 'All Subjects' || typeFilter !== 'All Types'
  function clearFilters() { setSearch(''); setSubjectFilter('All Subjects'); setTypeFilter('All Types'); setSelectedIds(new Set()) }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Study Materials</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Upload notes and files for students to download</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          + Upload Material
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4" style={{ background: `${s.color}18` }}>{s.icon}</div>
            <p className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
            <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-4 flex flex-wrap items-center gap-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-48 px-4 py-2.5 rounded-xl border"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search notes..." value={search} onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()) }}
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
          {search && <button onClick={() => setSearch('')} className="text-xs px-1.5 py-0.5 rounded-md hover:opacity-70"
            style={{ color: 'var(--text-muted)', background: 'var(--border-color)' }}>✕</button>}
        </div>

        <select value={subjectFilter} onChange={e => { setSubjectFilter(e.target.value); setSelectedIds(new Set()) }}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All Subjects">All Subjects</option>
          {SUBJECTS.map(s => <option key={s}>{s}</option>)}
        </select>

        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setSelectedIds(new Set()) }}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All Types">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>

        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="newest">↕ Newest First</option>
          <option value="oldest">↕ Oldest First</option>
          <option value="title">↕ Title A-Z</option>
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:opacity-80"
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.06)' }}>✕ Clear</button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="rounded-2xl border px-5 py-3 flex items-center justify-between"
          style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <span className="text-sm font-semibold" style={{ color: '#6366f1' }}>✓ {selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setSelectedIds(new Set())} className="px-4 py-2 rounded-xl text-sm font-medium border"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>Deselect</button>
            <button onClick={() => openDeleteDialog('bulk')} className="px-4 py-2 rounded-xl text-sm font-medium text-white hover:opacity-80"
              style={{ background: '#ef4444' }}>🗑 Delete</button>
          </div>
        </div>
      )}

      {/* List */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {loading ? (
          <div className="p-8 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'var(--bg-page)' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">📚</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{notes.length === 0 ? 'No materials yet' : 'No matches'}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{notes.length === 0 ? 'Upload your first study material' : 'Adjust filters'}</p>
          </div>
        ) : (
          <div>
            <div className="px-6 py-3 flex items-center gap-4 border-b text-xs font-semibold uppercase tracking-wider"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <div className="w-5 flex justify-center">
                <input type="checkbox" checked={isAllSelected} ref={el => { if (el) el.indeterminate = isSomeSelected }}
                  onChange={toggleSelectAll} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
              </div>
              <span className="flex-1">Material</span>
              <span className="w-24 text-center hidden md:block">Subject</span>
              <span className="w-28 text-center hidden sm:block">File</span>
              <span className="w-10 text-center">Del</span>
            </div>

            {filtered.map(note => {
              const subColor = getSubjectColor(note.subject?.name || null)
              const sel = selectedIds.has(note.id)
              return (
                <div key={note.id} className="border-b transition-colors"
                  style={{ borderColor: 'var(--border-color)', background: sel ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>
                  
                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className="w-5 flex justify-center">
                      <input type="checkbox" checked={sel} onChange={() => toggleSelect(note.id)}
                        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: subColor.bg }}>
                        📄
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{note.title}</h3>
                        {note.description && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{note.description}</p>}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>👤 {note.teacher?.user?.name || 'Admin'}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📅 {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-24 text-center hidden md:block">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: subColor.bg, color: subColor.color }}>
                        {note.subject?.name || 'General'}
                      </span>
                    </div>

                    <div className="w-28 flex justify-center hidden sm:block">
                      {note.fileUrl ? (
                        <a href={note.fileUrl} download target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          ⬇ Download
                        </a>
                      ) : (
                        <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(100,116,139,0.1)', color: '#64748b' }}>No File</span>
                      )}
                    </div>

                    <div className="w-10 flex justify-center">
                      <button onClick={() => openDeleteDialog('single', note.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:scale-110 hover:text-red-500"
                        style={{ color: 'var(--text-muted)' }} title="Delete">
                        🗑
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
            <div className="px-6 py-4 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Showing <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{filtered.length}</span> of{' '}
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{notes.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Upload Study Material</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Title</Label>
              <Input placeholder="e.g. Chapter 5 — Algebra Notes" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" autoFocus />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea placeholder="Brief description..." value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Subject</Label>
                <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  <option value="General">General</option>
                  {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none"
                  style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>

            {/* Actual File Input */}
            <div>
              <Label>Attach File</Label>
              <div
                className="mt-1 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors"
                style={{ borderColor: file ? '#10b981' : 'var(--border-color)', background: file ? 'rgba(16,185,129,0.05)' : 'transparent' }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
                {file ? (
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-2xl">✅</span>
                    <p className="text-sm font-semibold" style={{ color: '#10b981' }}>{file.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-2xl mb-2"> cloud-upload</p>
                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Click to upload file</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>PDF, DOC, PPT, Images up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                Upload & Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteDialog.open} onOpenChange={o => setDeleteDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><span className="text-xl">⚠️</span> Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {deleteDialog.type === 'single' ? 'Delete this material and its file permanently?' : `Delete ${selectedIds.size} selected materials?`}
          </p>
          <div className="flex gap-3 pt-3">
            <Button variant="outline" onClick={() => setDeleteDialog(p => ({ ...p, open: false }))} className="flex-1">Cancel</Button>
            <Button onClick={executeDelete} className="flex-1 text-white hover:opacity-90" style={{ background: '#ef4444' }}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}