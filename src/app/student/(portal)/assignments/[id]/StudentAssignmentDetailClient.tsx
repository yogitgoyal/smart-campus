'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { uploadAssignmentFile } from '@/lib/supabase'

type AssignmentData = {
  id: string
  title: string
  description: string | null
  fileUrl: string | null
  dueDate: string | null
  maxMarks: number | null
  createdAt: string
  teacherName: string
  subjectName: string | null
  className: string
  isOverdue: boolean
}

type SubmissionData = {
  id: string
  content: string | null
  fileUrl: string | null
  submittedAt: string
  marks: number | null
  status: string
  feedback: string | null
}

interface Props {
  assignment: AssignmentData
  submission: SubmissionData | null
  studentId: string
}

export default function StudentAssignmentDetailClient({ assignment, submission, studentId }: Props) {
  const [answerText, setAnswerText] = useState(submission?.content || '')
  const [answerFile, setAnswerFile] = useState<File | null>(null)
  const [currentSubmission, setCurrentSubmission] = useState<SubmissionData | null>(submission)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState('')

  useEffect(() => {
    setCurrentSubmission(submission)
    setAnswerText(submission?.content || '')
    setAnswerFile(null)
  }, [submission])

  const dueDateText = assignment.dueDate
    ? new Date(assignment.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No due date'

  const createdDateText = new Date(assignment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAnswerFile(event.target.files?.[0] || null)
  }

  const handleSubmit = async () => {
    if (!answerText.trim() && !answerFile && !currentSubmission?.fileUrl) {
      setSubmitError('Add a text answer or attach a file before submitting.')
      return
    }

    setSubmitting(true)
    setSubmitError('')
    setSubmitSuccess('')

    try {
      let fileUrl = currentSubmission?.fileUrl || null

      if (answerFile) {
        fileUrl = await uploadAssignmentFile(answerFile, `submissions/${studentId}`)
      }

      const response = await fetch('/api/student/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          assignmentId: assignment.id,
          content: answerText,
          fileUrl,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assignment.')
      }

      setCurrentSubmission(data)
      setSubmitSuccess('Submission saved successfully.')
      setAnswerFile(null)
    } catch (error: any) {
      setSubmitError(error?.message || 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const mySubmission = currentSubmission
  const hasSubmitted = Boolean(mySubmission)
  const statusLabel = mySubmission?.status === 'GRADED' ? 'Graded' : 'Submitted'
  const statusColor = mySubmission?.status === 'GRADED' ? '#10b981' : '#6366f1'
  const statusBg = mySubmission?.status === 'GRADED' ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)'

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {assignment.title}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {assignment.className} · {assignment.subjectName ?? 'General'} · By {assignment.teacherName}
          </p>
        </div>
        <Link href="/student/assignments"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--text-muted)' }}>
          ← Back to Assignments
        </Link>
      </div>

      <div className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: assignment.isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)' }}>
              ✏️
            </div>
            <div>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  📅 {dueDateText}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  · Max {assignment.maxMarks ?? '—'} marks
                </span>
              </div>
            </div>
          </div>

          <span className="text-sm font-semibold px-4 py-2 rounded-xl flex-shrink-0"
            style={{
              background: assignment.isOverdue ? 'rgba(244,63,94,0.1)' : 'rgba(16,185,129,0.1)',
              color: assignment.isOverdue ? '#f43f5e' : '#10b981',
            }}>
            {assignment.isOverdue ? '⚠ Overdue' : '✓ Active'}
          </span>
        </div>

        {assignment.description && (
          <div className="mt-5 p-4 rounded-xl" style={{ background: 'var(--bg-page)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Instructions
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
              {assignment.description}
            </p>
          </div>
        )}

        {assignment.fileUrl && (
          <div className="mt-4">
            <a href={assignment.fileUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl px-4 py-3"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
              📎 Download Assignment File
            </a>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Due Date', value: dueDateText, icon: '📅', color: assignment.isOverdue ? '#f43f5e' : 'var(--text-primary)' },
            { label: 'Max Marks', value: assignment.maxMarks ? `${assignment.maxMarks} marks` : 'Not set', icon: '⭐', color: 'var(--text-primary)' },
            { label: 'Created', value: createdDateText, icon: '🗓', color: 'var(--text-primary)' },
            { label: 'Teacher', value: assignment.teacherName, icon: '👨‍🏫', color: 'var(--text-primary)' },
          ].map(item => (
            <div key={item.label} className="p-3.5 rounded-xl" style={{ background: 'var(--bg-page)' }}>
              <p className="text-xs font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
                {item.icon} {item.label}
              </p>
              <p className="text-sm font-bold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border p-6"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {hasSubmitted ? 'Your Submission' : 'Submit Your Answer'}
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              {hasSubmitted ? 'Update your response and resubmit if needed.' : 'Attach a file, write your answer, then submit.'}
            </p>
          </div>
          {hasSubmitted && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: statusBg, color: statusColor }}>
              {statusLabel}
            </span>
          )}
        </div>

        {hasSubmitted && mySubmission && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-page)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>Submitted</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {new Date(mySubmission.submittedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-page)' }}>
              <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>File Attached</p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {mySubmission.fileUrl ? (
                  <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">
                    View file
                  </a>
                ) : 'No file uploaded'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
              Answer text
            </label>
            <textarea
              value={answerText}
              onChange={event => setAnswerText(event.target.value)}
              rows={5}
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none resize-none"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
              placeholder="Write your answer or notes here..."
            />
          </div>

          <div>
            <label className="flex items-center gap-3 rounded-2xl border px-4 py-3 cursor-pointer"
              style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              <span>📎</span>
              <span className="text-sm font-medium">
                {answerFile ? answerFile.name : mySubmission?.fileUrl ? 'Replace attached file' : 'Attach a file (optional)'}
              </span>
              <input type="file" className="hidden" onChange={handleFileChange} />
            </label>
            {mySubmission?.fileUrl && !answerFile && (
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                Current file: <a href={mySubmission.fileUrl} target="_blank" rel="noopener noreferrer" className="underline">view file</a>
              </p>
            )}
          </div>

          {submitError && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: 'rgba(16,185,129,0.08)', color: '#10b981' }}>
              {submitSuccess}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-2xl py-3 text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              {submitting ? 'Submitting...' : hasSubmitted ? 'Update Submission' : 'Submit Answer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
