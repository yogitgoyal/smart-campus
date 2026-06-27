'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

interface StudentSession {
  id: string
  name: string
  email: string
  role: string
}

const navItems = [
  { href: '/student/dashboard',    icon: '⊞', label: 'Dashboard'   },
  { href: '/student/timetable',    icon: '📅', label: 'Timetable'   },
  { href: '/student/attendance',   icon: '✅', label: 'Attendance'  },
  { href: '/student/assignments',  icon: '📋', label: 'Assignments' },
  { href: '/student/notices',      icon: '🔔', label: 'Notices'     },
  { href: '/student/notes',        icon: '📚', label: 'Notes'       },
  { href: '/student/profile',      icon: '👤', label: 'Profile'     },
]

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [session, setSession] = useState<StudentSession | null>(null)
  const [dark, setDark]       = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (!s) { router.push('/student/sign-in'); return }
    setSession(JSON.parse(s))
    const d = localStorage.getItem('darkMode') === 'true'
    setDark(d)
    document.documentElement.classList.toggle('dark', d)
  }, [router])

  function toggleDark() {
    const next = !dark
    setDark(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  function signOut() {
    localStorage.removeItem('studentSession')
    router.push('/student/sign-in')
  }

  if (!session) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-page)' }}>
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    </div>
  )

  const initials = session.name.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed h-full z-40 flex flex-col transition-transform duration-200 border-r
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 w-60`}
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>S</div>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Smart Campus</p>
            <p className="text-xs font-medium" style={{ color: '#6366f1' }}>Student Portal</p>
          </div>
        </div>

        {/* Student card */}
        <div className="mx-3 mt-3 p-3 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{initials}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{session.name}</p>
              <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>Student</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: 'var(--text-muted)' }}>Menu</p>
          {navItems.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                }}>
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={toggleDark}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2.5">
              <span>{dark ? '☀️' : '🌙'}</span>
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className="w-8 h-4 rounded-full relative transition-colors"
              style={{ background: dark ? '#6366f1' : '#e2e8f0' }}>
              <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: dark ? '18px' : '2px' }} />
            </div>
          </button>
          <button onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ color: '#f43f5e', background: 'rgba(244,63,94,0.06)' }}>
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 md:px-6 py-3.5 border-b"
          style={{ background: 'var(--bg-topbar)', borderColor: 'var(--border-color)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center gap-3">
            <button className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}
              onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="hidden md:flex items-center gap-1.5">
              {pathname.split('/').filter(Boolean).map((seg, i, arr) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span style={{ color: 'var(--text-muted)' }} className="text-xs">/</span>}
                  <span className={`text-sm capitalize ${i === arr.length-1 ? 'font-semibold' : ''}`}
                    style={{ color: i === arr.length-1 ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {seg}
                  </span>
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>{initials}</div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around py-2 z-20"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        {navItems.slice(0, 5).map(item => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}
              className="flex flex-col items-center gap-1 px-2 py-1"
              style={{ color: isActive ? '#6366f1' : 'var(--text-muted)' }}>
              <span className="text-xl">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}