import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function StudentNotesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { section: { include: { class: true } } }
  })
  if (!student) redirect('/dashboard')

  const notes = await prisma.note.findMany({
    where: {
      schoolId: user.schoolId || undefined,
      OR: [
        { sectionId: null, classId: null },
        { sectionId: student.sectionId },
        { classId: student.section?.classId },
      ],
    },
    orderBy: { createdAt: 'desc' },
    include: {
      subject: true,
      teacher: { include: { user: { select: { name: true } } } },
    }
  })

  const SUB_COLORS: Record<string, { bg: string; color: string }> = {
    Mathematics: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
    Science:     { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    English:     { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    Physics:     { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    Chemistry:   { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e' },
    History:     { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
    Computer:    { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
  }
  function getColor(name: string | null) {
    return SUB_COLORS[name || ''] || { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Study Notes</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{notes.length} materials available</p>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-5xl mb-3">📚</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No study materials yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your teachers will upload notes here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notes.map(note => {
            const c = getColor(note.subject?.name || null)
            return (
              <div key={note.id} className="rounded-2xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: c.bg }}>📄</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{note.title}</p>
                    {note.subject?.name && (
                      <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-1"
                        style={{ background: c.bg, color: c.color }}>{note.subject.name}</span>
                    )}
                    {note.description && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: 'var(--text-muted)' }}>{note.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-3">
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>👤 {note.teacher.user.name}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {new Date(note.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    {note.fileUrl && (
                      <a href={note.fileUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg w-full justify-center"
                        style={{ background: c.bg, color: c.color }}>
                        📥 Download Notes
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}