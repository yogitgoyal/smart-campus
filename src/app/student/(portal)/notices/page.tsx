'use client'
import { useState, useEffect } from 'react'

export default function StudentNotices() {
  const [notices, setNotices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search,  setSearch]  = useState('')

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      fetch(`/api/student/notices?studentId=${parsed.id}`)
        .then(r => r.json())
        .then(d => { setNotices(Array.isArray(d) ? d : []); setLoading(false) })
        .catch(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const filtered = notices.filter(n =>
    !search || n.title.toLowerCase().includes(search.toLowerCase()) || n.content.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notice Board</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{notices.length} announcements from your school</p>
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input placeholder="Search notices…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      <div className="space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />)
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-4xl mb-3">📢</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No notices yet</p>
          </div>
        ) : filtered.map(notice => (
          <div key={notice.id} className="rounded-2xl border p-5"
            style={{ background: 'var(--bg-card)', borderColor: notice.isPinned ? 'rgba(245,158,11,0.3)' : 'var(--border-color)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: notice.isPinned ? 'rgba(245,158,11,0.1)' : 'rgba(99,102,241,0.1)' }}>
                {notice.isPinned ? '📌' : '📢'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{notice.title}</h3>
                  {notice.isPinned && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Pinned</span>
                  )}
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{notice.content}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    👤 {notice.author?.name || 'Admin'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    📅 {new Date(notice.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}