'use client'
import { useState } from 'react'

interface SubmissionData {
  id: string
  content: string | null
  fileUrl: string | null
  submittedAt: string
  marks: number | null
  status: string
  feedback: string | null
  studentName: string
}

export default function SubmissionRow({
  submission: sub,
  maxMarks
}: {
  submission: SubmissionData
  maxMarks: number | null | undefined
}) {
  const [grading, setGrading] = useState(false)
  const [marks, setMarks] = useState(sub.marks?.toString() || '')
  const [feedback, setFeedback] = useState(sub.feedback || '')
  const [saved, setSaved] = useState(false)
  const [currentStatus, setCurrentStatus] = useState(sub.status)
  const [currentMarks, setCurrentMarks] = useState(sub.marks)
  const [showGradeForm, setShowGradeForm] = useState(false)

  const statusColor =
    currentStatus === 'GRADED'
      ? { bg: 'rgba(16,185,129,0.1)', color: '#10b981' }
      : currentStatus === 'RETURNED'
      ? { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' }
      : { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' }

  async function handleGrade() {
    if (!marks.trim()) return
    setGrading(true)
    try {
      const res = await fetch(`/api/submissions/${sub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marks: parseFloat(marks),
          feedback: feedback.trim() || null,
          status: 'GRADED'
        })
      })
      if (res.ok) {
        setCurrentMarks(parseFloat(marks))
        setCurrentStatus('GRADED')
        setSaved(true)
        setShowGradeForm(false)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e) {
      console.error(e)
    }
    setGrading(false)
  }

  function openFile(url: string) {
    if (!url) return
    if (url.startsWith('data:')) {
      // base64 — create object URL
      const [meta, base64] = url.split(',')
      const mimeMatch = meta.match(/data:([^;]+)/)
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream'
      const binary = atob(base64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const blob = new Blob([bytes], { type: mime })
      const objectUrl = URL.createObjectURL(blob)
      window.open(objectUrl, '_blank')
    } else {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="border-b last:border-0" style={{ borderColor: 'var(--border-color)' }}>
      {/* Main row */}
      <div
        className="grid items-center px-6 py-4 transition-colors cursor-pointer"
        style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        onClick={() => setShowGradeForm(p => !p)}
      >
        {/* Student name */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {sub.studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              {sub.studentName}
            </p>
            {sub.content && (
              <p className="text-xs truncate max-w-48" style={{ color: 'var(--text-muted)' }}>
                {sub.content}
              </p>
            )}
          </div>
        </div>

        {/* Submitted at */}
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {new Date(sub.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
        </p>

        {/* File */}
        <div onClick={e => e.stopPropagation()}>
          {sub.fileUrl ? (
            <button
              onClick={() => openFile(sub.fileUrl!)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              📎 View File
            </button>
          ) : (
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>—</span>
          )}
        </div>

        {/* Marks */}
        <p className="text-sm font-bold" style={{ color: currentMarks !== null ? '#10b981' : 'var(--text-muted)' }}>
          {currentMarks !== null && currentMarks !== undefined
            ? `${currentMarks}${maxMarks ? ` / ${maxMarks}` : ''}`
            : '—'}
        </p>

        {/* Status */}
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-lg inline-block"
          style={{ background: statusColor.bg, color: statusColor.color }}>
          {currentStatus}
        </span>

        {/* Feedback */}
        <p className="text-xs truncate max-w-32" style={{ color: 'var(--text-muted)' }}>
          {feedback || sub.feedback || '—'}
        </p>
      </div>

      {/* Expandable grade panel */}
      {showGradeForm && (
        <div className="px-6 pb-5 pt-1">
          <div className="p-4 rounded-xl border space-y-3"
            style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Grade this submission
            </p>

            {/* Show submitted text if any */}
            {sub.content && (
              <div className="p-3 rounded-lg" style={{ background: 'var(--bg-card)' }}>
                <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>Student answer:</p>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-primary)' }}>{sub.content}</p>
              </div>
            )}

            {/* Show file if any */}
            {sub.fileUrl && (
              <button
                onClick={() => openFile(sub.fileUrl!)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
                style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                📎 Open Submitted File
              </button>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Marks {maxMarks ? `(out of ${maxMarks})` : ''}
                </label>
                <input
                  type="number"
                  value={marks}
                  onChange={e => setMarks(e.target.value)}
                  max={maxMarks || undefined}
                  min={0}
                  placeholder={maxMarks ? `0 – ${maxMarks}` : 'Enter marks'}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-muted)' }}>
                  Feedback (optional)
                </label>
                <input
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="Write feedback..."
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                  style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGrade}
                disabled={grading || !marks.trim()}
                className="px-5 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {grading ? 'Saving...' : saved ? '✓ Saved!' : 'Save Grade'}
              </button>
              <button
                onClick={() => setShowGradeForm(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium border"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
              {saved && (
                <span className="text-xs font-medium" style={{ color: '#10b981' }}>
                  ✓ Grade saved successfully
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}