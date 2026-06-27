'use client'
import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Notice {
  id: string; title: string; content: string; isPinned: boolean
  category?: string; priority?: string; createdAt: string
  author: { name: string }
}

const CATEGORIES = ['General', 'Academic', 'Event', 'Holiday', 'Exam', 'Sports']
const PRIORITIES = ['Normal', 'High', 'Urgent']

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All') // All, Active, Pinned
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')
  const [sortOrder, setSortOrder] = useState('newest')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; type: 'single' | 'bulk'; id?: string }>({ open: false, type: 'single' })
  const [form, setForm] = useState({ title: '', content: '', isPinned: false, category: 'General', priority: 'Normal' })

  const fetchNotices = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notices')
      if (res.ok) setNotices(await res.json())
    } catch (e) { console.error(e) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchNotices() }, [fetchNotices])

  async function handleSubmit() {
    if (!form.title.trim()) return
    await fetch('/api/notices', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setOpen(false)
    setForm({ title: '', content: '', isPinned: false, category: 'General', priority: 'Normal' })
    fetchNotices()
  }

  function openDeleteDialog(type: 'single' | 'bulk', id?: string) {
    setDeleteDialog({ open: true, type, id })
  }

  async function executeDelete() {
    try {
      if (deleteDialog.type === 'single' && deleteDialog.id) {
        await fetch(`/api/notices?id=${deleteDialog.id}`, { method: 'DELETE' })
      } else if (deleteDialog.type === 'bulk' && selectedIds.size > 0) {
        await fetch(`/api/notices?ids=${Array.from(selectedIds).join(',')}`, { method: 'DELETE' })
        setSelectedIds(new Set())
      }
      fetchNotices()
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

  const filtered = notices
    .filter(n => {
      const q = search.toLowerCase()
      const matchSearch = !q || n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'All' || (statusFilter === 'Pinned' && n.isPinned) || (statusFilter === 'Active' && !n.isPinned)
      const matchCat = categoryFilter === 'All' || (n.category || 'General') === categoryFilter
      const matchPri = priorityFilter === 'All' || (n.priority || 'Normal') === priorityFilter
      return matchSearch && matchStatus && matchCat && matchPri
    })
    .sort((a, b) => {
      if (sortOrder === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortOrder === 'pinned' && a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  // REAL STATS: Simple Math
  const pinnedCount = notices.filter(n => n.isPinned).length
  const activeCount = notices.filter(n => !n.isPinned).length // Active = Not Pinned
  const urgentCount = notices.filter(n => n.priority === 'Urgent').length
  const usedCategories = new Set(notices.map(n => n.category || 'General')).size

  const stats = [
    { label: 'Total Notices', value: notices.length, sub: `All time`, color: '#6366f1', icon: '📢' },
    { label: 'Active', value: activeCount, sub: 'Normal board posts', color: '#10b981', icon: '✅' },
    { label: 'Urgent', value: urgentCount, sub: 'High priority alerts', color: '#f43f5e', icon: '🔴' },
    { label: 'Categories', value: usedCategories, sub: 'Types used', color: '#3b82f6', icon: '🏷️' },
  ]

  function priorityStyle(p?: string) {
    switch (p) {
      case 'Urgent': return { label: 'Urgent', bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.2)' }
      case 'High':   return { label: 'High',   bg: 'rgba(244,63,94,0.1)', color: '#f43f5e', border: 'rgba(244,63,94,0.2)' }
      default:       return { label: 'Normal', bg: 'rgba(99,102,241,0.1)', color: '#6366f1', border: 'rgba(99,102,241,0.2)' }
    }
  }

  const isAllSelected = filtered.length > 0 && selectedIds.size === filtered.length
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected
  const hasActiveFilters = search || statusFilter !== 'All' || categoryFilter !== 'All' || priorityFilter !== 'All'
  function clearFilters() { setSearch(''); setStatusFilter('All'); setCategoryFilter('All'); setPriorityFilter('All'); setSelectedIds(new Set()) }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notice Board</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage and publish announcements</p>
        </div>
        <button onClick={() => setOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }}>
          + Post Notice
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
          <input placeholder="Search notices..." value={search} onChange={e => { setSearch(e.target.value); setSelectedIds(new Set()) }}
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs px-1.5 py-0.5 rounded-md hover:opacity-70"
              style={{ color: 'var(--text-muted)', background: 'var(--border-color)' }}>✕</button>
          )}
        </div>

        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setSelectedIds(new Set()) }}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Pinned">Pinned</option>
        </select>

        <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setSelectedIds(new Set()) }}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setSelectedIds(new Set()) }}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="All">All Priority</option>
          {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
        </select>

        <select value={sortOrder} onChange={e => setSortOrder(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="newest">↕ Newest First</option>
          <option value="oldest">↕ Oldest First</option>
          <option value="pinned">📌 Pinned First</option>
        </select>

        {hasActiveFilters && (
          <button onClick={clearFilters} className="px-3 py-2.5 rounded-xl text-xs font-semibold border transition-colors hover:opacity-80"
            style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#ef4444', background: 'rgba(239,68,68,0.06)' }}>
            ✕ Clear
          </button>
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
          <div className="p-8 space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--bg-page)' }} />)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">{notices.length === 0 ? '📢' : '🔍'}</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{notices.length === 0 ? 'No notices yet' : 'No matches'}</p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{notices.length === 0 ? 'Post your first notice' : 'Adjust filters'}</p>
          </div>
        ) : (
          <div>
            <div className="px-6 py-3 flex items-center gap-4 border-b text-xs font-semibold uppercase tracking-wider"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
              <div className="w-5 flex justify-center">
                <input type="checkbox" checked={isAllSelected} ref={el => { if (el) el.indeterminate = isSomeSelected }}
                  onChange={toggleSelectAll} className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
              </div>
              <span className="flex-1">Notice</span>
              <span className="w-24 text-center hidden md:block">Category</span>
              <span className="w-20 text-center hidden md:block">Priority</span>
              <span className="w-24 text-center hidden sm:block">Status</span>
              <span className="w-10 text-center">Del</span>
            </div>

            {filtered.map(notice => {
              const pri = priorityStyle(notice.priority)
              const sel = selectedIds.has(notice.id)
              return (
                <div key={notice.id} className="border-b transition-colors"
                  style={{ borderColor: 'var(--border-color)', background: sel ? 'rgba(99,102,241,0.04)' : 'transparent' }}
                  onMouseEnter={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'transparent' }}>

                  <div className="px-6 py-4 flex items-center gap-4">
                    <div className="w-5 flex justify-center">
                      <input type="checkbox" checked={sel} onChange={() => toggleSelect(notice.id)}
                        className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
                    </div>

                    <div className="flex-1 min-w-0 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                        style={{ background: notice.isPinned ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
                        {notice.isPinned ? '📌' : '📢'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{notice.title}</h3>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{notice.content}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>👤 {notice.author?.name || 'Admin'}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📅 {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-24 text-center hidden md:block">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full"
                        style={{ background: 'var(--bg-page)', color: 'var(--text-muted)', border: '1px solid var(--border-color)' }}>
                        {notice.category || 'General'}
                      </span>
                    </div>

                    <div className="w-20 text-center hidden md:block">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                        style={{ background: pri.bg, color: pri.color, borderColor: pri.border }}>{pri.label}</span>
                    </div>

                    <div className="w-24 text-center hidden sm:block">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: notice.isPinned ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)', color: notice.isPinned ? '#f43f5e' : '#10b981' }}>
                        {notice.isPinned ? 'Pinned' : 'Active'}
                      </span>
                    </div>

                    <div className="w-10 flex justify-center">
                      <button onClick={() => openDeleteDialog('single', notice.id)}
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
              <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{notices.length}</span>
            </div>
          </div>
        )}
      </div>

      {/* Post Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Post New Notice</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label>Title</Label><Input placeholder="Notice title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" autoFocus /></div>
            <div><Label>Content</Label><Textarea placeholder="Write notice content here..." value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} className="mt-1 min-h-28" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><Label>Priority</Label>
                <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-xl border text-sm outline-none" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="pinned" checked={form.isPinned} onChange={e => setForm({ ...form, isPinned: e.target.checked })} className="w-4 h-4 rounded accent-indigo-500" />
              <Label htmlFor="pinned">📌 Pin this notice to top</Label>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSubmit} className="flex-1 text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Post Notice</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteDialog.open} onOpenChange={o => setDeleteDialog(p => ({ ...p, open: o }))}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><span className="text-xl">⚠️</span> Confirm Delete</DialogTitle></DialogHeader>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            {deleteDialog.type === 'single' ? 'Delete this notice permanently?' : `Delete ${selectedIds.size} selected notices?`}
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