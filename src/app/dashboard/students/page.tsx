'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface Student {
  id: string
  rollNumber: string | null
  admissionNo: string | null
  gender: string | null
  phone: string | null
  address: string | null
  dob: string | null
  status: string
  user: { name: string; email: string }
  section: { name: string; class: { name: string } } | null
}

const spark = [{ v: 2 }, { v: 5 }, { v: 3 }, { v: 8 }, { v: 5 }, { v: 9 }, { v: 7 }, { v: 11 }]
const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const CLASSES = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12']
const AVATAR_COLORS = ['#6366f1', '#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#14b8a6', '#f97316']

function getAvatarColor(name: string) {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

type TabKey = 'personal' | 'academic' | 'address' | 'guardian'
const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'personal', label: 'Personal', icon: '👤' },
  { key: 'academic', label: 'Academic', icon: '📚' },
  { key: 'address', label: 'Address', icon: '📍' },
  { key: 'guardian', label: 'Guardian', icon: '👪' },
]

const FORM_INIT = {
  name: '', email: '', phone: '', dob: '', gender: '', bloodGroup: '', religion: '', nationality: 'Indian',
  rollNumber: '', admissionNo: '', classVal: '', section: '', admissionDate: '',
  address: '', city: '', state: '', pincode: '',
  guardianName: '', guardianRelation: 'Father', guardianPhone: '', guardianOccupation: '',
  medicalNotes: '', allergies: '', password: '', confirmPassword: '',
}

const VALIDATORS: Record<string, (v: string, form?: typeof FORM_INIT) => string> = {
  name: v => !v.trim() ? 'Full name is required' : v.trim().length < 2 ? 'Name too short' : '',
  email: v => !v.trim() ? 'Email is required' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'Enter a valid email' : '',
  phone: v => !v.trim() ? 'Phone is required' : !/^[0-9+\-\s()]{7,15}$/.test(v.trim()) ? 'Enter a valid phone number' : '',
  gender: v => !v ? 'Please select gender' : '',
  rollNumber: v => !v.trim() ? 'Roll number is required' : '',
  password: v => !v.trim() ? 'Password is required' : v.length < 6 ? 'Min 6 characters' : '',
  confirmPassword: (v, form) => !v.trim() ? 'Please confirm password' : v !== form?.password ? 'Passwords do not match' : '',
  // address tab
  address: v => !v.trim() ? 'Street/Area is required' : '',
  city: v => !v.trim() ? 'City is required' : '',
  state: v => !v.trim() ? 'State is required' : '',
  // guardian tab
  guardianName: v => !v.trim() ? 'Guardian name is required' : '',
  guardianPhone: v => !v.trim() ? 'Guardian phone is required' : !/^[0-9+\-\s()]{7,15}$/.test(v.trim()) ? 'Enter a valid phone' : '',
}

const TAB_REQUIRED: Record<TabKey, string[]> = {
  personal: ['name', 'email', 'phone', 'gender', 'password', 'confirmPassword'],
  academic: ['rollNumber'],
  address: ['address', 'city', 'state'],
  guardian: ['guardianName', 'guardianPhone'],
}

// parse stored address string back into parts
function parseAddress(raw: string | null) {
  if (!raw) return { street: '', extra: {} as Record<string, string> }
  const [addrPart, extraPart] = raw.split(' | EXTRA: ')
  const parts = (addrPart || '').split(', ')
  const extra: Record<string, string> = {}
  if (extraPart) {
    extraPart.split(' | ').forEach(seg => {
      const [k, ...v] = seg.split(': ')
      if (k && v.length) extra[k.trim()] = v.join(': ').trim()
    })
  }
  return { street: parts[0] || '', city: parts[1] || '', state: parts[2] || '', pincode: parts[3] || '', extra }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [search, setSearch] = useState('')
  const [filterGender, setFilterGender] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterClass, setFilterClass] = useState('all')
  const [filterSection, setFilterSection] = useState('all')
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<TabKey>('personal')
  const [form, setForm] = useState(FORM_INIT)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [detailStudent, setDetailStudent] = useState<Student | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [resetTarget, setResetTarget] = useState<Student | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [resetting, setResetting] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const PER_PAGE = 10

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(Array.isArray(data) ? data : [])
    } catch { setStudents([]) }
    setLoading(false)
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  function f(key: string, val: string) {
    setForm(p => ({ ...p, [key]: val }))
    setTouched(p => ({ ...p, [key]: true }))
  }
  function touch(key: string) { setTouched(p => ({ ...p, [key]: true })) }

  function getError(key: string): string {
    if (!touched[key]) return ''
    const v = VALIDATORS[key]
    return v ? v((form as any)[key], form) : ''
  }

  function hasTabErrors(t: TabKey): boolean {
    return TAB_REQUIRED[t].some(k => {
      const v = VALIDATORS[k]
      return v ? !!v((form as any)[k], form) : false
    })
  }

  function touchAll() {
    setTouched(Object.fromEntries(Object.keys(FORM_INIT).map(k => [k, true])))
  }

  function resetForm() {
    setForm(FORM_INIT)
    setTouched({})
    setTab('personal')
    setSaveError('')
    setShowPwd(false)
    setShowConfirm(false)
  }

  function validateAll(): string {
    for (const [key, validator] of Object.entries(VALIDATORS)) {
      const err = validator((form as any)[key], form)
      if (err) return `${key}: ${err}`
    }
    return ''
  }

  async function handleSubmit() {
    touchAll()
    const err = validateAll()
    if (err) {
      // find which tab has error and switch to it
      for (const [t, keys] of Object.entries(TAB_REQUIRED)) {
        if (keys.some(k => {
          const v = VALIDATORS[k]; return v ? !!v((form as any)[k], form) : false
        })) { setTab(t as TabKey); break }
      }
      setSaveError('Please fix all required fields before submitting.')
      return
    }
    setSaveError('')
    setSaving(true)
    try {
      // Map classVal/section (form field names) to className/sectionName
      // (the names the backend route.ts actually reads and resolves
      // into a real Section row via Class/Section lookup-or-create).
      const payload = {
        ...form,
        email: form.email.trim().toLowerCase(),
        className: form.classVal,
        sectionName: form.section,
      }

      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (!res.ok) { setSaveError(data.error || 'Failed to add student'); setSaving(false); return }
      setSaving(false); setOpen(false); resetForm(); fetchStudents()
    } catch {
      setSaveError('Network error. Please try again.')
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/students?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to delete') }
      setDeleting(false); setDeleteTarget(null); setDetailStudent(null); fetchStudents()
    } catch { alert('Network error'); setDeleting(false) }
  }

  async function handleBulkDelete() {
    setBulkDeleting(true)
    const ids = Array.from(selected).join(',')
    try {
      const res = await fetch(`/api/students?ids=${ids}`, { method: 'DELETE' })
      if (!res.ok) { const d = await res.json(); alert(d.error || 'Failed to delete') }
    } catch { alert('Network error') }
    setBulkDeleting(false); setBulkConfirm(false); setSelected(new Set()); fetchStudents()
  }

  async function handlePasswordReset() {
    if (!resetTarget || newPassword.length < 6) return
    setResetting(true)
    await fetch('/api/students', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: resetTarget.id, newPassword })
    })
    setResetting(false); setResetTarget(null); setNewPassword('')
    alert('Password reset recorded. Share the new password with the student.')
  }

  const total = students.length
  const active = students.filter(s => s.status === 'ACTIVE').length
  const boys = students.filter(s => s.gender === 'M').length
  const girls = students.filter(s => s.gender === 'F').length

  const filtered = students.filter(s => {
    const q = search.toLowerCase().trim()
    const matchQ = !q ||
      s.user?.name?.toLowerCase().includes(q) ||
      (s.rollNumber || '').toLowerCase().includes(q) ||
      s.user?.email?.toLowerCase().includes(q) ||
      (s.phone || '').includes(q) ||
      (s.admissionNo || '').toLowerCase().includes(q)
    const matchG = filterGender === 'all' || s.gender === filterGender
    const matchSt = filterStatus === 'all' || s.status === filterStatus
    const matchC = filterClass === 'all' || s.section?.class?.name === filterClass
    const matchSec = filterSection === 'all' || s.section?.name === filterSection
    return matchQ && matchG && matchSt && matchC && matchSec
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  useEffect(() => { setPage(1) }, [search, filterGender, filterStatus, filterClass, filterSection])

  const uniqClasses = Array.from(new Set(students.map(s => s.section?.class?.name).filter(Boolean))) as string[]
  const uniqSections = Array.from(new Set(students.map(s => s.section?.name).filter(Boolean))) as string[]

  const stats = [
    { label: 'Total Students', value: total, sub: `${total} enrolled`, color: '#6366f1', icon: '👥' },
    { label: 'Active Students', value: active, sub: `${total > 0 ? Math.round(active / total * 100) : 0}% of total`, color: '#10b981', icon: '✅' },
    { label: 'Boys', value: boys, sub: `${total > 0 ? Math.round(boys / total * 100) : 0}% of total`, color: '#3b82f6', icon: '👦' },
    { label: 'Girls', value: girls, sub: `${total > 0 ? Math.round(girls / total * 100) : 0}% of total`, color: '#f43f5e', icon: '👧' },
  ]

  function iStyle(key: string) {
    const err = getError(key)
    return {
      background: 'var(--bg-page)',
      color: 'var(--text-primary)',
      borderColor: err ? '#f43f5e' : touched[key] && !err ? '#10b981' : 'var(--border-color)',
    }
  }
  const iCls = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition-colors"
  const lCls = "text-xs font-semibold uppercase tracking-wide block mb-1.5"
  const lSty = { color: 'var(--text-muted)' }

  function FieldErr({ k }: { k: string }) {
    const e = getError(k)
    return e ? <p className="text-xs mt-1 font-medium" style={{ color: '#f43f5e' }}>⚠ {e}</p> : null
  }

  function TabBadge({ t }: { t: TabKey }) {
    const allKeys = TAB_REQUIRED[t]
    const anyTouched = allKeys.some(k => touched[k])
    if (!anyTouched) return null
    const hasErr = hasTabErrors(t)
    return (
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ml-1"
        style={{ background: hasErr ? '#f43f5e' : '#10b981' }}>
        {hasErr ? '!' : '✓'}
      </span>
    )
  }

  function highlight(text: string, query: string) {
    if (!query.trim()) return <span>{text}</span>
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
    return (
      <span>{parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase()
          ? <mark key={i} style={{ background: 'rgba(99,102,241,0.2)', color: '#6366f1', borderRadius: 3, padding: '0 2px' }}>{p}</mark>
          : p
      )}</span>
    )
  }

  function handleExport() {
    const rows = [
      ['Name', 'Email', 'Phone', 'Roll No', 'Admission No', 'Class', 'Section', 'Gender', 'DOB', 'Address', 'Status'],
      ...students.map(s => [
        s.user?.name || '', s.user?.email || '', s.phone || '', s.rollNumber || '',
        s.admissionNo || '', s.section?.class?.name || '', s.section?.name || '',
        s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : s.gender || '',
        s.dob ? new Date(s.dob).toLocaleDateString('en-IN') : '', s.address || '', s.status,
      ])
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv)
    a.download = `students_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selected.size === paginated.length) setSelected(new Set())
    else setSelected(new Set(paginated.map(s => s.id)))
  }

  return (
    <div className="max-w-7xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 rounded-2xl border p-5"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
            style={{ background: 'rgba(99,102,241,0.1)' }}>👥</div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Students</h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{total} enrolled · {active} active</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {selected.size > 0 && (
            <button onClick={() => setBulkConfirm(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold animate-pulse"
              style={{ background: 'rgba(244,63,94,0.1)', borderColor: 'rgba(244,63,94,0.4)', color: '#f43f5e' }}>
              🗑 Delete Selected ({selected.size})
            </button>
          )}
          <button onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium"
            style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            ↓ Export
          </button>
          <button onClick={() => { resetForm(); setOpen(true) }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}>
            + Add Student
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl mb-4"
              style={{ background: `${s.color}15` }}>{s.icon}</div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-black tabular-nums" style={{ color: s.color }}>{s.value}</p>
                <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{s.label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</p>
              </div>
              <div className="w-20 h-10">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spark}>
                    <Line type="monotone" dataKey="v" stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border p-4 flex flex-wrap items-center gap-3"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-2 flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
          <span style={{ color: 'var(--text-muted)' }}>🔍</span>
          <input placeholder="Search name, email, roll, phone…" value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
          {search && <button onClick={() => setSearch('')} style={{ color: 'var(--text-muted)' }}>✕</button>}
        </div>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="all">All Classes</option>
          {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSection} onChange={e => setFilterSection(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="all">All Sections</option>
          {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
        </select>
        <select value={filterGender} onChange={e => setFilterGender(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="all">All Gender</option>
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="O">Other</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl border text-sm font-medium outline-none cursor-pointer"
          style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        {(filterGender !== 'all' || filterStatus !== 'all' || filterClass !== 'all' || filterSection !== 'all' || search) && (
          <button onClick={() => { setSearch(''); setFilterGender('all'); setFilterStatus('all'); setFilterClass('all'); setFilterSection('all') }}
            className="px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.08)' }}>
            ✕ Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b"
          style={{ borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Student Directory</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{filtered.length} of {total} students
            {selected.size > 0 && <span style={{ color: '#6366f1' }}> · {selected.size} selected</span>}
          </p>
        </div>

        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--bg-page)' }} />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-5xl mb-4">👨‍🎓</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {search || filterGender !== 'all' || filterStatus !== 'all' ? 'No students match your filters' : 'No students yet'}
            </p>
            <p className="text-sm mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>
              {search ? 'Try different keywords' : 'Add your first student'}
            </p>
            {!search && filterGender === 'all' && filterStatus === 'all' && (
              <button onClick={() => { resetForm(); setOpen(true) }}
                className="px-6 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>+ Add Student</button>
            )}
          </div>
        ) : (
          <>
            {/* Column headers */}
            <div className="hidden md:grid px-6 py-3 text-xs font-bold uppercase tracking-wide border-b"
              style={{ gridTemplateColumns: '40px 2.5fr 1.2fr 1.2fr 1fr 1fr 1fr 110px', borderColor: 'var(--border-color)', color: 'var(--text-muted)', background: 'var(--bg-page)' }}>
              <div className="flex items-center">
                <input type="checkbox"
                  checked={selected.size === paginated.length && paginated.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />
              </div>
              <span>Student</span><span>Class / Section</span><span>Roll No</span>
              <span>Phone</span><span>Gender</span><span>Status</span><span>Actions</span>
            </div>

            {paginated.map(student => {
              const color = getAvatarColor(student.user?.name || 'A')
              const init = (student.user?.name || '?').charAt(0).toUpperCase()
              const isActive = student.status === 'ACTIVE'
              const q = search.trim()
              const isChecked = selected.has(student.id)
              return (
                <div key={student.id}
                  className="grid px-6 py-4 border-b items-center transition-colors"
                  style={{
                    gridTemplateColumns: '40px 2.5fr 1.2fr 1.2fr 1fr 1fr 1fr 110px',
                    borderColor: 'var(--border-color)',
                    background: isChecked ? 'rgba(99,102,241,0.04)' : 'transparent'
                  }}
                  onMouseEnter={e => { if (!isChecked) e.currentTarget.style.background = 'var(--bg-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isChecked ? 'rgba(99,102,241,0.04)' : 'transparent' }}>

                  <input type="checkbox" checked={isChecked} onChange={() => toggleSelect(student.id)}
                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer" />

                  {/* Student */}
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => setDetailStudent(student)}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg,${color},${color}bb)` }}>{init}</div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {highlight(student.user?.name || '', q)}
                      </p>
                      <p className="text-xs truncate max-w-[180px]" style={{ color: 'var(--text-muted)' }}>
                        {highlight(student.user?.email || '', q)}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {student.section
                      ? `${student.section.class.name} · ${student.section.name}`
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </p>

                  <p className="text-sm font-mono font-semibold" style={{ color: student.rollNumber ? '#6366f1' : 'var(--text-muted)' }}>
                    {student.rollNumber ? highlight(student.rollNumber, q) : '—'}
                  </p>

                  <p className="text-sm" style={{ color: student.phone ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
                    {student.phone ? highlight(student.phone, q) : '—'}
                  </p>

                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {student.gender === 'M' ? '♂ Male' : student.gender === 'F' ? '♀ Female' : student.gender || '—'}
                  </p>

                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: isActive ? '#10b981' : '#94a3b8' }} />
                    <span className="text-sm" style={{ color: isActive ? '#10b981' : 'var(--text-muted)' }}>
                      {isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <button title="View" onClick={() => setDetailStudent(student)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                      style={{ color: '#6366f1' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>👁</button>
                    <button title="Reset password" onClick={() => setResetTarget(student)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                      style={{ color: '#f59e0b' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,158,11,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>🔑</button>
                    <button title="Delete" onClick={() => setDeleteTarget(student)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors"
                      style={{ color: '#f43f5e' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(244,63,94,0.1)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>🗑</button>
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            <div className="px-6 py-4 flex items-center justify-between border-t"
              style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {filtered.length === 0 ? 'No results' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)} of ${filtered.length}`}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm disabled:opacity-40"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>‹</button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-medium"
                      style={{ background: page === n ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: page === n ? '#fff' : 'var(--text-primary)', borderColor: page === n ? 'transparent' : 'var(--border-color)' }}>
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="w-8 h-8 rounded-lg border flex items-center justify-center text-sm disabled:opacity-40"
                    style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}>›</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!detailStudent} onOpenChange={() => setDetailStudent(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Student Profile</DialogTitle></DialogHeader>
          {detailStudent && (() => {
            const s = detailStudent
            const color = getAvatarColor(s.user?.name || 'A')
            const isActive = s.status === 'ACTIVE'
            const parsed = parseAddress(s.address)
            return (
              <div>
                <div className="flex items-center gap-4 mb-5 p-4 rounded-2xl" style={{ background: 'var(--bg-page)' }}>
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg,${color},${color}bb)` }}>
                    {(s.user?.name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>{s.user?.name}</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{s.user?.email}</p>
                    <span className="inline-flex items-center gap-1.5 mt-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.15)', color: isActive ? '#10b981' : '#94a3b8' }}>
                      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isActive ? '#10b981' : '#94a3b8' }} />
                      {isActive ? 'Active' : s.status}
                    </span>
                  </div>
                </div>

                {/* Personal */}
                <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1" style={{ color: '#6366f1' }}>Personal Info</p>
                {[
                  { label: 'Email', value: s.user?.email },
                  { label: 'Phone', value: s.phone },
                  { label: 'Gender', value: s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : s.gender },
                  { label: 'Date of Birth', value: s.dob ? new Date(s.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                  { label: 'Blood Group', value: parsed.extra['Blood Group'] },
                  { label: 'Religion', value: parsed.extra['Religion'] },
                  { label: 'Nationality', value: parsed.extra['Nationality'] },
                ].map(row => row.value ? (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ) : null)}

                {/* Academic */}
                <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1 mt-4" style={{ color: '#6366f1' }}>Academic Info</p>
                {[
                  { label: 'Roll No', value: s.rollNumber },
                  { label: 'Admission', value: s.admissionNo },
                  { label: 'Class', value: s.section ? `${s.section.class.name} · Section ${s.section.name}` : null },
                ].map(row => row.value ? (
                  <div key={row.label} className="flex items-center justify-between py-2 border-b"
                    style={{ borderColor: 'var(--border-color)' }}>
                    <span className="text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                    <span className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                  </div>
                ) : null)}

                {/* Address */}
                {(parsed.street || parsed.city) && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1 mt-4" style={{ color: '#6366f1' }}>Address</p>
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'var(--bg-page)', color: 'var(--text-primary)' }}>
                      {[parsed.street, parsed.city, parsed.state, parsed.pincode].filter(Boolean).join(', ')}
                    </div>
                  </>
                )}

                {/* Guardian */}
                {parsed.extra['Guardian'] && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1 mt-4" style={{ color: '#6366f1' }}>Guardian</p>
                    {[
                      { label: 'Name', value: parsed.extra['Guardian'] },
                      { label: 'Relation', value: parsed.extra['Relation'] },
                      { label: 'Phone', value: parsed.extra['Guardian Phone'] },
                      { label: 'Job', value: parsed.extra['Occupation'] },
                    ].map(row => row.value ? (
                      <div key={row.label} className="flex items-center justify-between py-2 border-b"
                        style={{ borderColor: 'var(--border-color)' }}>
                        <span className="text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                        <span className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
                      </div>
                    ) : null)}
                  </>
                )}

                {/* Medical */}
                {(parsed.extra['Medical'] || parsed.extra['Allergies']) && (
                  <>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2 px-1 mt-4" style={{ color: '#f43f5e' }}>Medical</p>
                    {parsed.extra['Medical'] && (
                      <div className="p-3 rounded-xl text-sm mb-2" style={{ background: 'rgba(244,63,94,0.06)', color: 'var(--text-primary)' }}>
                        {parsed.extra['Medical']}
                      </div>
                    )}
                    {parsed.extra['Allergies'] && (
                      <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(245,158,11,0.06)', color: 'var(--text-primary)' }}>
                        ⚠ Allergies: {parsed.extra['Allergies']}
                      </div>
                    )}
                  </>
                )}

                <div className="flex gap-2 mt-5">
                  <button onClick={() => { setDetailStudent(null); setResetTarget(s) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.3)', color: '#f59e0b' }}>
                    🔑 Reset Password
                  </button>
                  <button onClick={() => { setDetailStudent(null); setDeleteTarget(s) }}
                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold border"
                    style={{ background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}>
                    🗑 Delete
                  </button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Single Confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Student</DialogTitle></DialogHeader>
          <div className="py-2 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: 'rgba(244,63,94,0.08)' }}>🗑</div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>Delete student</p>
            <p className="font-bold mb-1" style={{ color: '#f43f5e' }}>{deleteTarget?.user?.name}</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              All records, attendance, and submissions will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: '#f43f5e' }}>
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirm */}
      <Dialog open={bulkConfirm} onOpenChange={() => setBulkConfirm(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete {selected.size} Students</DialogTitle></DialogHeader>
          <div className="py-2 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
              style={{ background: 'rgba(244,63,94,0.08)' }}>🗑</div>
            <p className="text-sm mb-1" style={{ color: 'var(--text-primary)' }}>
              You are about to permanently delete
            </p>
            <p className="text-2xl font-black mb-1" style={{ color: '#f43f5e' }}>{selected.size} students</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              All records, attendance, and submissions will be deleted. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setBulkConfirm(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleBulkDelete} disabled={bulkDeleting} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: '#f43f5e' }}>
                {bulkDeleting ? 'Deleting…' : `Delete ${selected.size}`}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Modal */}
      <Dialog open={!!resetTarget} onOpenChange={() => { setResetTarget(null); setNewPassword('') }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>🔑 Reset Student Password</DialogTitle></DialogHeader>
          <div className="py-2 space-y-4">

            {/* Student info */}
            <div className="flex items-center gap-3 p-4 rounded-2xl"
              style={{ background: 'var(--bg-page)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${getAvatarColor(resetTarget?.user?.name || 'A')},#8b5cf6)` }}>
                {(resetTarget?.user?.name || '?').charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{resetTarget?.user?.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{resetTarget?.user?.email}</p>
                <span className="inline-flex items-center gap-1 mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                  ● Active
                </span>
              </div>
            </div>

            {/* New password field */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wide block mb-1.5"
                style={{ color: 'var(--text-muted)' }}>New Password *</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 chars)"
                  autoComplete="new-password"
                  className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
                  style={{
                    background: 'var(--bg-page)',
                    borderColor: newPassword.length > 0 && newPassword.length < 6 ? '#f43f5e'
                      : newPassword.length >= 6 ? '#10b981' : 'var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />
                <button type="button" onClick={() => setShowPwd(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base"
                  style={{ color: 'var(--text-muted)' }}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>

              {/* Strength bar */}
              {newPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="flex-1 h-1.5 rounded-full transition-all"
                        style={{
                          background: newPassword.length >= n * 2
                            ? newPassword.length >= 8 ? '#10b981'
                              : newPassword.length >= 6 ? '#f59e0b' : '#f43f5e'
                            : 'var(--border-color)'
                        }} />
                    ))}
                  </div>
                  <p className="text-xs font-medium" style={{
                    color: newPassword.length >= 8 ? '#10b981'
                      : newPassword.length >= 6 ? '#f59e0b' : '#f43f5e'
                  }}>
                    {newPassword.length >= 8 ? '✓ Strong password'
                      : newPassword.length >= 6 ? '~ Acceptable — consider making it longer'
                        : '⚠ Too short'}
                  </p>
                </div>
              )}

              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-xs mt-1 font-medium" style={{ color: '#f43f5e' }}>⚠ Minimum 6 characters required</p>
              )}
            </div>

            {/* Info box */}
            <div className="p-3 rounded-xl text-xs space-y-1" style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <p className="font-semibold" style={{ color: '#6366f1' }}>ℹ Admin Instructions</p>
              <p style={{ color: 'var(--text-muted)' }}>• This will record the new password for the student</p>
              <p style={{ color: 'var(--text-muted)' }}>• Share the new password with the student directly</p>
              <p style={{ color: 'var(--text-muted)' }}>• Student logs in with their email + new password</p>
              <p style={{ color: 'var(--text-muted)' }}>• Advise the student to change it after first login</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setResetTarget(null); setNewPassword(''); setShowPwd(false) }}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all hover:opacity-80"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              <button onClick={handlePasswordReset}
                disabled={resetting || newPassword.length < 6}
                className="flex-1 py-3 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-40"
                style={{ background: newPassword.length >= 6 ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'var(--border-color)', boxShadow: newPassword.length >= 6 ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
                {resetting ? '⏳ Resetting…' : '🔑 Reset Password'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Add Student Modal */}
      <Dialog open={open} onOpenChange={v => { if (!v) { setOpen(false); resetForm() } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Add New Student</DialogTitle>
          </DialogHeader>

          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-xl mb-4" style={{ background: 'var(--bg-page)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: tab === t.key ? '#fff' : 'transparent',
                  color: tab === t.key ? '#6366f1' : 'var(--text-muted)',
                  boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.1)' : 'none'
                }}>
                <span>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
                <TabBadge t={t.key} />
              </button>
            ))}
          </div>

          {saveError && (
            <div className="px-4 py-3 rounded-xl mb-3 text-sm font-medium flex items-center gap-2"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
              ⚠ {saveError}
            </div>
          )}

          {/* Personal Tab */}
          {tab === 'personal' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className={lCls} style={lSty}>Full Name *</label>
                <input
                  ref={firstInputRef}
                  type="text"
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  onBlur={() => touch('name')}
                  placeholder="e.g. Aarav Sharma"
                  autoComplete="off"
                  className={iCls}
                  style={iStyle('name')}
                />
                <FieldErr k="name" />
              </div>
              <div className="col-span-2">
                <label className={lCls} style={lSty}>Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => f('email', e.target.value)}
                  onBlur={() => touch('email')}
                  placeholder="student@school.com"
                  autoComplete="off"
                  className={iCls}
                  style={iStyle('email')}
                />
                <FieldErr k="email" />
              </div>
              <div>
                <label className={lCls} style={lSty}>Phone Number *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => f('phone', e.target.value)}
                  onBlur={() => touch('phone')}
                  placeholder="+91 98765 43210"
                  autoComplete="off"
                  className={iCls}
                  style={iStyle('phone')}
                />
                <FieldErr k="phone" />
              </div>
              <div>
                <label className={lCls} style={lSty}>Gender *</label>
                <select
                  value={form.gender}
                  onChange={e => f('gender', e.target.value)}
                  onBlur={() => touch('gender')}
                  className={iCls}
                  style={iStyle('gender')}
                >
                  <option value="">Select gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="O">Other</option>
                </select>
                <FieldErr k="gender" />
              </div>
              <div>
                <label className={lCls} style={lSty}>Date of Birth</label>
                <input type="date" value={form.dob} onChange={e => f('dob', e.target.value)}
                  className={iCls} style={iStyle('dob')} />
              </div>
              <div>
                <label className={lCls} style={lSty}>Blood Group</label>
                <select value={form.bloodGroup} onChange={e => f('bloodGroup', e.target.value)}
                  className={iCls} style={iStyle('bloodGroup')}>
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className={lCls} style={lSty}>Religion</label>
                <input type="text" value={form.religion} onChange={e => f('religion', e.target.value)}
                  placeholder="e.g. Hindu" autoComplete="off" className={iCls} style={iStyle('religion')} />
              </div>
              <div>
                <label className={lCls} style={lSty}>Nationality</label>
                <input type="text" value={form.nationality} onChange={e => f('nationality', e.target.value)}
                  placeholder="Indian" autoComplete="off" className={iCls} style={iStyle('nationality')} />
              </div>

              <div className="col-span-2 pt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
                <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#6366f1' }}>🔐 Login Credentials</p>
              </div>
              <div>
                <label className={lCls} style={lSty}>Password *</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => f('password', e.target.value)}
                    onBlur={() => touch('password')}
                    placeholder="Min 6 characters"
                    autoComplete="new-password"
                    className={iCls}
                    style={{ ...iStyle('password'), paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowPwd(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'var(--text-muted)' }}>
                    {showPwd ? '🙈' : '👁'}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-1.5 flex gap-1">
                    {[1, 2, 3, 4, 5].map(n => (
                      <div key={n} className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: form.password.length >= n * 2 ? (form.password.length >= 8 ? '#10b981' : '#f59e0b') : 'var(--border-color)' }} />
                    ))}
                  </div>
                )}
                <FieldErr k="password" />
              </div>
              <div>
                <label className={lCls} style={lSty}>Confirm Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => f('confirmPassword', e.target.value)}
                    onBlur={() => touch('confirmPassword')}
                    placeholder="Re-enter password"
                    autoComplete="new-password"
                    className={iCls}
                    style={{ ...iStyle('confirmPassword'), paddingRight: 40 }}
                  />
                  <button type="button" onClick={() => setShowConfirm(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
                    style={{ color: 'var(--text-muted)' }}>
                    {showConfirm ? '🙈' : '👁'}
                  </button>
                </div>
                <FieldErr k="confirmPassword" />
              </div>
            </div>
          )}

          {/* Academic Tab */}
          {tab === 'academic' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={lCls} style={lSty}>Roll Number *</label>
                <input type="text" value={form.rollNumber}
                  onChange={e => f('rollNumber', e.target.value)} onBlur={() => touch('rollNumber')}
                  placeholder="e.g. R-001" autoComplete="off" className={iCls} style={iStyle('rollNumber')} />
                <FieldErr k="rollNumber" />
              </div>
              <div>
                <label className={lCls} style={lSty}>Admission Number</label>
                <input type="text" value={form.admissionNo} onChange={e => f('admissionNo', e.target.value)}
                  placeholder="ADM-2026-001" autoComplete="off" className={iCls} style={iStyle('admissionNo')} />
              </div>
              <div>
                <label className={lCls} style={lSty}>Class</label>
                <select value={form.classVal} onChange={e => f('classVal', e.target.value)}
                  className={iCls} style={iStyle('classVal')}>
                  <option value="">Select class</option>
                  {CLASSES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={lCls} style={lSty}>Section</label>
                <select value={form.section} onChange={e => f('section', e.target.value)}
                  className={iCls} style={iStyle('section')}>
                  <option value="">Select section</option>
                  {SECTIONS.map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
              </div>
              <div>
                <label className={lCls} style={lSty}>Admission Date</label>
                <input type="date" value={form.admissionDate} onChange={e => f('admissionDate', e.target.value)}
                  className={iCls} style={iStyle('admissionDate')} />
              </div>
            </div>
          )}

          {/* Address Tab */}
          {tab === 'address' && (
            <div className="space-y-4">
              <div>
                <label className={lCls} style={lSty}>Street / Area *</label>
                <textarea value={form.address} onChange={e => f('address', e.target.value)}
                  onBlur={() => touch('address')}
                  placeholder="House no, Street, Area" rows={3}
                  className={iCls + ' resize-none'} style={iStyle('address')} />
                <FieldErr k="address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lCls} style={lSty}>City *</label>
                  <input type="text" value={form.city}
                    onChange={e => f('city', e.target.value)} onBlur={() => touch('city')}
                    placeholder="Enter city" autoComplete="off" className={iCls} style={iStyle('city')} />
                  <FieldErr k="city" />
                </div>
                <div>
                  <label className={lCls} style={lSty}>State *</label>
                  <input type="text" value={form.state}
                    onChange={e => f('state', e.target.value)} onBlur={() => touch('state')}
                    placeholder="Enter state" autoComplete="off" className={iCls} style={iStyle('state')} />
                  <FieldErr k="state" />
                </div>
                <div>
                  <label className={lCls} style={lSty}>Pincode</label>
                  <input type="text" value={form.pincode} onChange={e => f('pincode', e.target.value)}
                    placeholder="e.g. 141001" autoComplete="off" className={iCls} style={iStyle('pincode')} />
                </div>
              </div>
            </div>
          )}

          {/* Guardian Tab */}
          {tab === 'guardian' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={lCls} style={lSty}>Guardian Name *</label>
                  <input type="text" value={form.guardianName}
                    onChange={e => f('guardianName', e.target.value)} onBlur={() => touch('guardianName')}
                    placeholder="Full name" autoComplete="off" className={iCls} style={iStyle('guardianName')} />
                  <FieldErr k="guardianName" />
                </div>
                <div>
                  <label className={lCls} style={lSty}>Relation</label>
                  <select value={form.guardianRelation} onChange={e => f('guardianRelation', e.target.value)}
                    className={iCls} style={iStyle('guardianRelation')}>
                    {['Father', 'Mother', 'Guardian', 'Uncle', 'Aunt', 'Grandparent', 'Other'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className={lCls} style={lSty}>Guardian Phone *</label>
                  <input type="tel" value={form.guardianPhone}
                    onChange={e => f('guardianPhone', e.target.value)} onBlur={() => touch('guardianPhone')}
                    placeholder="+91 98765 43210" autoComplete="off" className={iCls} style={iStyle('guardianPhone')} />
                  <FieldErr k="guardianPhone" />
                </div>
                <div>
                  <label className={lCls} style={lSty}>Occupation</label>
                  <input type="text" value={form.guardianOccupation} onChange={e => f('guardianOccupation', e.target.value)}
                    placeholder="e.g. Business" autoComplete="off" className={iCls} style={iStyle('guardianOccupation')} />
                </div>
              </div>
              <div>
                <label className={lCls} style={lSty}>Medical Notes</label>
                <textarea value={form.medicalNotes} onChange={e => f('medicalNotes', e.target.value)}
                  placeholder="Any conditions or special needs" rows={2}
                  className={iCls + ' resize-none'} style={iStyle('medicalNotes')} />
              </div>
              <div>
                <label className={lCls} style={lSty}>Known Allergies</label>
                <input type="text" value={form.allergies} onChange={e => f('allergies', e.target.value)}
                  placeholder="e.g. Peanuts, None" autoComplete="off" className={iCls} style={iStyle('allergies')} />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 mt-2 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div>
              {tab !== 'personal' && (
                <button onClick={() => setTab(p => { const i = TABS.findIndex(t => t.key === p); return TABS[i - 1]?.key ?? p })}
                  className="px-4 py-2.5 rounded-xl border text-sm font-medium"
                  style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>← Back</button>
              )}
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => { setOpen(false); resetForm() }}
                className="px-4 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
              {tab !== 'guardian' ? (
                <button onClick={() => setTab(p => { const i = TABS.findIndex(t => t.key === p); return TABS[i + 1]?.key ?? p })}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Next →</button>
              ) : (
                <button onClick={handleSubmit} disabled={saving}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                  {saving ? 'Adding…' : '+ Add Student'}
                </button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}