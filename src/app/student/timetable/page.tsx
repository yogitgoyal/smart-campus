import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function StudentTimetablePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { section: { include: { class: true } } }
  })
  if (!student) redirect('/dashboard')

  const slots = await prisma.timetableSlot.findMany({
    where: { sectionId: student.sectionId },
    include: { subject: true, teacher: { include: { user: true } } },
    orderBy: [{ dayOfWeek: 'asc' }, { period: 'asc' }],
  })

  const today = new Date().getDay()
  const todaySlots = slots.filter(s => s.dayOfWeek === (today === 0 ? 7 : today))

  const COLORS: Record<string, { bg: string; color: string }> = {
    Mathematics: { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' },
    Science:     { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
    English:     { bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
    Physics:     { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
    Chemistry:   { bg: 'rgba(244,63,94,0.1)', color: '#f43f5e' },
    History:     { bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
    Computer:    { bg: 'rgba(20,184,166,0.1)', color: '#14b8a6' },
  }
  function getColor(name: string | null) {
    return COLORS[name || ''] || { bg: 'rgba(99,102,241,0.1)', color: '#6366f1' }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Timetable</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {student.section?.class.name} · Section {student.section?.name}
        </p>
      </div>

      {/* Today */}
      {todaySlots.length > 0 && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h2 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            📅 Today — {DAYS[(today === 0 ? 7 : today) - 1]}
          </h2>
          <div className="space-y-2">
            {todaySlots.map(slot => {
              const c = getColor(slot.subject?.name || null)
              return (
                <div key={slot.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: c.bg }}>
                  <div className="text-center min-w-16">
                    <p className="text-xs font-bold" style={{ color: c.color }}>P{slot.period}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{slot.startTime}</p>
                  </div>
                  <div className="w-px h-8" style={{ background: c.color, opacity: 0.3 }} />
                  <div className="flex-1">
                    <p className="text-sm font-bold" style={{ color: c.color }}>{slot.subject?.name || 'Free'}</p>
                    {slot.teacher && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{slot.teacher.user.name}</p>}
                  </div>
                  {slot.room && (
                    <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                      📍 {slot.room}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Full week */}
      <div className="space-y-4">
        {DAYS.map((day, idx) => {
          const daySlots = slots.filter(s => s.dayOfWeek === idx + 1)
          const isToday = (today === 0 ? 7 : today) === idx + 1
          return (
            <div key={day} className="rounded-2xl border overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: isToday ? 'rgba(16,185,129,0.4)' : 'var(--border-color)' }}>
              <div className="px-4 py-3 flex items-center justify-between border-b"
                style={{ borderColor: 'var(--border-color)', background: isToday ? 'rgba(16,185,129,0.06)' : 'var(--bg-page)' }}>
                <p className="text-sm font-bold" style={{ color: isToday ? '#10b981' : 'var(--text-primary)' }}>
                  {day} {isToday && <span className="text-xs ml-2 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Today</span>}
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{daySlots.length} periods</p>
              </div>
              {daySlots.length === 0 ? (
                <div className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>No classes</div>
              ) : (
                <div className="divide-y" style={{ borderColor: 'var(--border-color)' }}>
                  {daySlots.map(slot => {
                    const c = getColor(slot.subject?.name || null)
                    return (
                      <div key={slot.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="text-center min-w-12">
                          <p className="text-xs font-bold" style={{ color: '#6366f1' }}>P{slot.period}</p>
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{slot.startTime}-{slot.endTime}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: c.bg }}>📖</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: c.color }}>{slot.subject?.name || 'Free Period'}</p>
                          {slot.teacher && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{slot.teacher.user.name}</p>}
                        </div>
                        {slot.room && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>📍 {slot.room}</span>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}