'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton, useUser } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

const NAV = [
  { href: '/student',             icon: '🏠', label: 'Home' },
  { href: '/student/assignments',  icon: '📝', label: 'Assignments' },
  { href: '/student/attendance',   icon: '✅', label: 'Attendance' },
  { href: '/student/timetable',    icon: '📅', label: 'Timetable' },
  { href: '/student/notices',      icon: '📢', label: 'Notices' },
  { href: '/student/notes',        icon: '📚', label: 'Notes' },
  { href: '/student/profile',      icon: '👤', label: 'Profile' },
]

export default function StudentLayoutClient({
  children, studentName, sectionName, className
}: {
  children: React.ReactNode
  studentName: string
  sectionName: string
  className: string
}) {
  const pathname = usePathname()
  const { user } = useUser()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  const title = pathname === '/student' ? 'Home'
    : pathname.split('/').pop()?.replace('-', ' ') || ''

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col fixed h-full z-20 border-r"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#10b981,#3b82f6)' }}>
            <span className="text-white font-black text-base">S</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>Smart Campus</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Student Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(item => {
            const isActive = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: isActive ? 'linear-gradient(135deg,#10b981,#3b82f6)' : 'transparent',
                  color: isActive ? '#fff' : 'var(--text-secondary)',
                }}>
                <span className="w-5 text-center">{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Student info card */}
        <div className="mx-3 mb-3 p-3 rounded-xl border" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>{studentName}</p>
          {className && <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Class {className} · Sec {sectionName}</p>}
        </div>

        <div className="px-3 pb-4 border-t pt-3 space-y-1" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={toggleDark}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2.5">
              <span>{dark ? '☀️' : '🌙'}</span>
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className="w-8 h-4 rounded-full relative" style={{ background: dark ? '#10b981' : '#e2e8f0' }}>
              <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: dark ? '18px' : '2px' }} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 md:ml-56 flex flex-col">

        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b"
          style={{ background: 'var(--bg-topbar)', borderColor: 'var(--border-color)', backdropFilter: 'blur(20px)' }}>
          <h1 className="text-lg font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          <div className="flex items-center gap-2">
            <div className="w-px h-6 mx-1" style={{ background: 'var(--border-color)' }} />
            <div className="flex items-center gap-2">
              <UserButton afterSignOutUrl="/" />
              <div className="hidden md:block">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.firstName || studentName.split(' ')[0]}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Student</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around py-2 z-20"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        {NAV.slice(0, 5).map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-1 px-2 py-1"
            style={{ color: pathname === item.href ? '#10b981' : 'var(--text-muted)' }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[9px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}