'use client'
import { useState, useEffect } from 'react'
import { uploadAssignmentFile } from '@/lib/supabase'
import Link from 'next/link'

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState('all')
  const [studentId,   setStudentId]   = useState('')

  // submission modal state
  const [openId, setOpenId] = useState<string | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      setStudentId(parsed.id)
      fetchAssignments(parsed.id)
    } else {
      setLoading(false)
    }
  }, [])

  async function fetchAssignments(id: string) {
    try {
      const res  = await fetch(`/api/student/assignments?studentId=${id}`)
      const data = await res.json()
      setAssignments(Array.isArray(data) ? data : [])
    } catch {}
    setLoading(false)
  }

  const now = new Date()

  const filtered = assignments.filter(a => {
    const matchQ = !search || a.title.toLowerCase().includes(search.toLowerCase())
    const due    = a.dueDate ? new Date(a.dueDate) : null
    if (filter === 'pending')  return matchQ && due && due >= now
    if (filter === 'overdue')  return matchQ && due && due < now
    if (filter === 'noduedate') return matchQ && !due
    return matchQ
  })

  const pending  = assignments.filter(a => a.dueDate && new Date(a.dueDate) >= now).length
  const overdue  = assignments.filter(a => a.dueDate && new Date(a.dueDate) < now).length

  function openSubmit(assignment: any) {
    setOpenId(assignment.id)
    setSubmitError('')
    const mySubmission = assignment.submissions?.[0]
    setAnswerText(mySubmission?.content || '')
    setAnswerFile(null)
  }

  async function handleSubmitAnswer(assignmentId: string) {
    if (!answerText.trim() && !answerFile) {
      setSubmitError('Add a text answer or attach a file before submitting')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      let fileUrl: string | undefined
      if (answerFile) {
        try {
          fileUrl = await uploadAssignmentFile(answerFile, `submissions/${studentId}`)
        } catch (uploadErr: any) {
          console.error('File upload failed:', uploadErr)
          setSubmitError(`File upload failed: ${uploadErr?.message || 'unknown storage error'}`)
          setSubmitting(false)
          return
        }
      }
      const res = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, assignmentId, content: answerText, fileUrl })
      })
      const data = await res.json()
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit')
        setSubmitting(false)
        return
      }
      setSubmitting(false)
      setOpenId(null)
      fetchAssignments(studentId)
    } catch (err: any) {
      console.error('Submit failed:', err)
      setSubmitError(`Failed to submit: ${err?.message || 'unknown error'}`)
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Assignments</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{pending} pending · {overdue} overdue</p>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {[
          { key: 'all',     label: `All (${assignments.length})`,  color: '#6366f1' },
          { key: 'pending', label: `Pending (${pending})`,         color: '#10b981' },
          { key: 'overdue', label: `Overdue (${overdue})`,         color: '#f43f5e' },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all border"
            style={{
              background: filter === f.key ? f.color : 'var(--bg-card)',
              color: filter === f.key ? '#fff' : 'var(--text-secondary)',
              borderColor: filter === f.key ? f.color : 'var(--border-color)'
            }}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <span style={{ color: 'var(--text-muted)' }}>🔍</span>
        <input placeholder="Search assignments…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent outline-none" style={{ color: 'var(--text-primary)' }} />
      </div>

      <div className="space-y-3">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
          ))
        ) : filtered.length === 0 ? (
          <div className="py-20 text-center rounded-2xl border"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <p className="text-4xl mb-3">📝</p>
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No assignments found</p>
          </div>
        ) : filtered.map(a => {
          const due        = a.dueDate ? new Date(a.dueDate) : null
          const isOverdue  = due && due < now
          const daysLeft   = due ? Math.ceil((due.getTime() - now.getTime()) / 86400000) : null
          const mySubmission = a.submissions?.[0]
          const isOpen = openId === a.id

          return (
            <div key={a.id} className="rounded-2xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: isOverdue ? 'rgba(244,63,94,0.2)' : 'var(--border-color)' }}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
                    {isOverdue ? '⚠️' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>{a.title}</h3>
                    {a.description && (
                      <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{a.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        👤 {a.teacher?.user?.name || 'Teacher'}
                      </span>
                      {a.subject && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📗 {a.subject.name}</span>
                      )}
                      {a.maxMarks && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>⭐ {a.maxMarks} marks</span>
                      )}
                    </div>

                    {/* Teacher's attached file, if any */}
                    {a.fileUrl && (
                      <a href={a.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                        📎 View / Download Assignment File
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  {due ? (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-full block"
                      style={{
                        background: isOverdue ? 'rgba(244,63,94,0.1)' : daysLeft! <= 2 ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isOverdue ? '#f43f5e' : daysLeft! <= 2 ? '#f59e0b' : '#10b981'
                      }}>
                      {isOverdue ? `${Math.abs(daysLeft!)}d overdue` : daysLeft === 0 ? 'Due today' : `${daysLeft}d left`}
                    </span>
                  ) : (
                    <span className="text-xs px-3 py-1.5 rounded-full" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                      No due date
                    </span>
                  )}
                </div>
              </div>

              {due && (
                <div className="mt-3 flex items-center justify-between px-4 py-2 rounded-xl"
                  style={{ background: isOverdue ? 'rgba(244,63,94,0.06)' : 'rgba(99,102,241,0.06)' }}>
                  <span className="text-sm font-medium" style={{ color: isOverdue ? '#f43f5e' : '#6366f1' }}>
                    📅 Due: {due.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                  </span>
                </div>
              )}

              {/* Submission status / action */}
              <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
                {mySubmission && !isOpen ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full"
                        style={{
                          background: mySubmission.status === 'GRADED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)',
                          color: mySubmission.status === 'GRADED' ? '#10b981' : '#6366f1'
                        }}>
                        {mySubmission.status === 'GRADED' ? `✓ Graded${mySubmission.marks != null ? ` — ${mySubmission.marks}/${a.maxMarks || '?'}` : ''}` : '✓ Submitted'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        on {new Date(mySubmission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <button onClick={() => openSubmit(a)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                      Edit Submission
                    </button>
                  </div>
                ) : !isOpen ? (
                  <button onClick={() => openSubmit(a)}
                    className="w-full py-2.5 rounded-xl text-white text-sm font-semibold"
                    style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                    Submit Answer
                  </button>
                ) : (
                  <div className="space-y-3">
                    {submitError && (
                      <div className="px-3 py-2 rounded-lg text-xs font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
                        ⚠ {submitError}
                      </div>
                    )}
                    <textarea
                      value={answerText}
                      onChange={e => setAnswerText(e.target.value)}
                      placeholder="Type your answer here..."
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                      style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer"
                        style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        📎 {answerFile ? answerFile.name : (mySubmission?.fileUrl ? 'Replace attached file' : 'Attach a file (optional)')}
                        <input type="file" className="hidden" onChange={e => setAnswerFile(e.target.files?.[0] || null)} />
                      </label>
                      {mySubmission?.fileUrl && !answerFile && (
                        <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                          View current file
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setOpenId(null)}
                        className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                        style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                        Cancel
                      </button>
                      <button onClick={() => handleSubmitAnswer(a.id)} disabled={submitting}
                        className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {submitting ? 'Submitting...' : mySubmission ? 'Update Submission' : 'Submit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}