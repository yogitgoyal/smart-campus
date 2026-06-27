'use client'
import { useState, useEffect } from 'react'

export default function StudentNotes() {
  const [notes,   setNotes]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      fetch(`/api/student/notes?studentId=${parsed.id}`)
        .then(r => r.json())
        .then(d => { setNotes(Array.isArray(d) ? d : []); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const filtered = notes.filter(n => !search || n.title.toLowerCase().includes(search.toLowerCase()))

  const subjectColors: Record<string, { bg: string; color: string }> = {
    Mathematics: { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
    Science:     { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
    English:     { bg: 'rgba(59,130,246,0.1)',  color: '#3b82f6' },
    Physics:     { bg: 'rgba(245,158,11,0.1)',  color: '#f59e0b' },
    Chemistry:   { bg: 'rgba(16,185,129,0.1)',  color: '#10b981' },
    History:     { bg: 'rgba(249,115,22,0.1)',  color: '#f97316' },
    default:     { bg: 'rgba(99,102,241,0.1)',  color: '#6366f1' },
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Study Notes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Study materials shared by your teachers</p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-4xl mb-3">📚</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No notes available yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your teachers will upload study materials here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(note => {
            const sc = subjectColors[note.subject?.name || ''] || subjectColors.default
            return (
              <div key={note.id} className="rounded-2xl border p-5 hover:-translate-y-0.5 hover:shadow-md transition-all"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{ background: sc.bg }}>📄</div>
                {note.subject && (
                  <span className="text-xs font-semibold px-2 py-1 rounded-full mb-2 inline-block"
                    style={{ background: sc.bg, color: sc.color }}>{note.subject.name}</span>
                )}
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{note.title}</h3>
                {note.description && (
                  <p className="text-xs line-clamp-2 mb-3" style={{ color: 'var(--text-muted)' }}>{note.description}</p>
                )}
                <div className="flex items-center justify-between mt-auto">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(note.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                  </span>
                  {note.fileUrl ? (
                    <a href={note.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                      style={{ background: sc.bg, color: sc.color }}>
                      📎 View File
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>No file</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}