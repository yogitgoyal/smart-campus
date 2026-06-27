'use client'
import { useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface ProfileData {
  user: { name: string; phone?: string | null }
  clerk: { email: string; accountId: string; joined: string | null; lastSignIn: string | null; imageUrl: string | null }
  stats: { studentCount: number; teacherCount: number; classCount: number; noticeCount: number; noteCount: number; assignmentCount: number }
}

const TABS = ['Overview', 'Account Details', 'School Analytics']

const platformInfo = [
  { icon: '🖥️', label: 'Framework', value: 'Next.js 16', color: 'rgba(99,102,241,0.1)', iconColor: '#6366f1' },
  { icon: '🗄️', label: 'Database', value: 'PostgreSQL', color: 'rgba(16,185,129,0.1)', iconColor: '#10b981' },
  { icon: '🛡️', label: 'Auth', value: 'Clerk', color: 'rgba(59,130,246,0.1)', iconColor: '#3b82f6' },
  { icon: '🔺', label: 'ORM', value: 'Prisma 5', color: 'rgba(244,63,94,0.1)', iconColor: '#f43f5e' },
  { icon: '🎨', label: 'Styling', value: 'Tailwind CSS', color: 'rgba(20,184,166,0.1)', iconColor: '#14b8a6' },
  { icon: '📦', label: 'Components', value: 'shadcn/ui', color: 'rgba(249,115,22,0.1)', iconColor: '#f97316' },
]

export default function ProfilePage() {
  const { user: clerkUser, isLoaded } = useUser()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('Overview')
  
  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false)
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isLoaded) fetchProfile()
  }, [isLoaded])

  async function fetchProfile() {
    try {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const profileData = await res.json()
        setData(profileData)
        setEditName(profileData.user.name)
        setEditPhone(profileData.user.phone || '')
      }
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  async function handleSaveProfile() {
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, phone: editPhone })
      })
      if (res.ok) {
        const updatedUser = await res.json()
        setData(prev => prev ? { ...prev, user: updatedUser } : null)
        setEditOpen(false)
      }
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const name = data?.user.name || clerkUser?.firstName || 'Admin'
  const email = data?.clerk.email || clerkUser?.emailAddresses?.[0]?.emailAddress || ''
  const initials = name.charAt(0).toUpperCase()
  const joined = data?.clerk.joined ? new Date(data.clerk.joined).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const lastSignIn = data?.clerk.lastSignIn ? new Date(data.clerk.lastSignIn).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'

  if (loading || !isLoaded) {
    return <div className="max-w-5xl mx-auto space-y-5"><div className="h-40 rounded-2xl animate-pulse" style={{background:'var(--bg-card)'}} /><div className="h-60 rounded-2xl animate-pulse" style={{background:'var(--bg-card)'}} /></div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">

      {/* Profile Header Card */}
      <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="h-24 w-full" style={{ background: 'linear-gradient(135deg, #ede9fe 0%, #ddd6fe 40%, #c4b5fd 70%, #a78bfa 100%)' }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              {clerkUser?.imageUrl ? (
                <img src={clerkUser.imageUrl} className="w-20 h-20 rounded-2xl border-4 object-cover shadow-lg" style={{ borderColor: 'var(--bg-card)' }} />
              ) : (
                <div className="w-20 h-20 rounded-2xl border-4 flex items-center justify-center text-3xl font-black text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderColor: 'var(--bg-card)' }}>
                  {initials}
                </div>
              )}
            </div>
            <button onClick={() => setEditOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium transition-all hover:opacity-80"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
              ✏️ Edit Profile
            </button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{name}</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Admin</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Active</span>
          </div>
          <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--text-muted)' }}>✉️ {email}</p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-1 p-1 rounded-xl border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: activeTab === tab ? 'var(--bg-card)' : 'transparent',
              color: activeTab === tab ? '#6366f1' : 'var(--text-muted)',
              boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
            }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'Overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Quick Stats */}
          <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Quick Stats</h3>
            <div className="space-y-3">
              {[
                { icon: '👥', label: 'Students', val: data?.stats.studentCount || 0, href: '/dashboard/students' },
                { icon: '👨‍🏫', label: 'Teachers', val: data?.stats.teacherCount || 0, href: '/dashboard/students' },
                { icon: '📚', label: 'Classes', val: data?.stats.classCount || 0, href: '/dashboard/timetable' },
              ].map(s => (
                <Link key={s.label} href={s.href} className="flex items-center justify-between p-3 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-sm"
                  style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{s.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{s.val}</span>
                    <span style={{ color: 'var(--text-muted)' }}>→</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Tech Stack */}
          <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Platform Information</h3>
            <div className="grid grid-cols-2 gap-3">
              {platformInfo.map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-page)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ background: item.color }}>{item.icon}</div>
                  <div>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Account Details' && (
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <h3 className="font-bold text-sm mb-5" style={{ color: 'var(--text-primary)' }}>Detailed Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '👤', label: 'Full Name', value: name },
              { icon: '✉️', label: 'Email Address', value: email },
              { icon: '📱', label: 'Phone Number', value: data?.user.phone || 'Not set' },
              { icon: '🪪', label: 'Account ID', value: data?.clerk.accountId ? `${data.clerk.accountId.slice(0, 15)}...` : '—' },
              { icon: '📅', label: 'Account Created', value: joined },
              { icon: '🕐', label: 'Last Sign In', value: lastSignIn },
            ].map(item => (
              <div key={item.label} className="p-4 rounded-xl border" style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{item.icon}</span>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                </div>
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'School Analytics' && (
        <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>🏫</div>
            <div>
              <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Smart Campus School</h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complete platform database overview</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: '👥', label: 'Total Students', val: data?.stats.studentCount, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
              { icon: '👨‍🏫', label: 'Total Teachers', val: data?.stats.teacherCount, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
              { icon: '📚', label: 'Active Classes', val: data?.stats.classCount, color: '#f43f5e', bg: 'rgba(244,63,94,0.1)' },
              { icon: '📢', label: 'Notices Posted', val: data?.stats.noticeCount, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
              { icon: '📄', label: 'Study Materials', val: data?.stats.noteCount, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
              { icon: '📝', label: 'Assignments', val: data?.stats.assignmentCount, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
            ].map(stat => (
              <div key={stat.label} className="p-5 rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: 'var(--bg-page)', borderColor: 'var(--border-color)' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3" style={{ background: stat.bg }}>{stat.icon}</div>
                <p className="text-3xl font-black tabular-nums" style={{ color: stat.color }}>{stat.val}</p>
                <p className="text-sm font-semibold mt-1" style={{ color: 'var(--text-primary)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Edit Profile Details</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Display Name</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input placeholder="Enter phone number" value={editPhone} onChange={e => setEditPhone(e.target.value)} className="mt-1" />
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>* To change your email or password, use Clerk's user management settings.</p>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveProfile} disabled={saving || !editName.trim()} className="flex-1 text-white" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}