import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function StudentProfilePage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  if (!user) redirect('/sign-in')

  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: { section: { include: { class: true } } }
  })
  if (!student) redirect('/dashboard')

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const fields = [
    { label: 'Full Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Phone', value: student.phone || '—' },
    { label: 'Gender', value: student.gender || '—' },
    { label: 'Date of Birth', value: student.dob ? new Date(student.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
    { label: 'Roll Number', value: student.rollNumber || '—' },
    { label: 'Admission No', value: student.admissionNo || '—' },
    { label: 'Class', value: student.section?.class.name || 'Not assigned' },
    { label: 'Section', value: student.section?.name || 'Not assigned' },
    { label: 'Status', value: student.status },
    { label: 'Joined', value: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
  ]

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your personal information</p>
      </div>

      {/* Avatar card */}
      <div className="rounded-2xl border p-6 text-center" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-black text-white mx-auto"
          style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
          {initials}
        </div>
        <h2 className="font-bold text-lg mt-4" style={{ color: 'var(--text-primary)' }}>{user.name}</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
        <div className="flex items-center justify-center gap-3 mt-3">
          {student.section && (
            <span className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              Class {student.section.class.name} · Section {student.section.name}
            </span>
          )}
          <span className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: student.status === 'ACTIVE' ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
              color: student.status === 'ACTIVE' ? '#10b981' : '#f43f5e' }}>
            {student.status}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        {fields.map((f, i) => (
          <div key={f.label} className="flex items-center justify-between px-5 py-4"
            style={{ background: i % 2 === 0 ? 'transparent' : 'var(--bg-page)', borderBottom: '1px solid var(--border-color)' }}>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{f.label}</span>
            <span className="text-sm font-semibold text-right" style={{ color: 'var(--text-primary)' }}>{f.value}</span>
          </div>
        ))}
      </div>

      {/* Address */}
      {student.address && (
        <div className="rounded-2xl border p-5" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Address / Additional Info</h3>
          <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{student.address}</p>
        </div>
      )}
    </div>
  )
}