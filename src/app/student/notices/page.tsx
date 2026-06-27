import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function StudentNoticesPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { section: { include: { class: true } } }
  })
  if (!student) redirect('/dashboard')

  const classId = student.section?.classId

  const notices = await prisma.notice.findMany({
    where: {
      schoolId: user.schoolId || undefined,
      OR: [
        { classId: null },
        { classId },
      ],
    },
    orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    include: { author: { select: { name: true } } }
  })

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Notice Board</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{notices.length} announcements</p>
      </div>

      {notices.length === 0 ? (
        <div className="rounded-2xl border py-16 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-5xl mb-3">📢</p>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>No notices yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your school will post announcements here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map(notice => (
            <div key={notice.id} className="rounded-2xl border p-5"
              style={{ background: 'var(--bg-card)', borderColor: notice.isPinned ? 'rgba(245,158,11,0.3)' : 'var(--border-color)' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: notice.isPinned ? 'rgba(245,158,11,0.1)' : 'rgba(244,63,94,0.1)' }}>
                  {notice.isPinned ? '📌' : '📢'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold" style={{ color: 'var(--text-primary)' }}>{notice.title}</h3>
                    {notice.isPinned && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>Pinned</span>
                    )}
                    {notice.category && notice.category !== 'General' && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>{notice.category}</span>
                    )}
                  </div>
                  <p className="text-sm mt-2 leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>
                    {notice.content}
                  </p>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>👤 {notice.author.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>•</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      📅 {new Date(notice.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}