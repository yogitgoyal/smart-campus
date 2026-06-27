'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { UserButton, useUser } from '@clerk/nextjs'

const navGroups = [
  {
    label: 'Academics',
    items: [
      { href: '/dashboard/students',    icon: '👥', label: 'Students' },
      { href: '/dashboard/attendance',  icon: '🎯', label: 'Attendance' },
      { href: '/dashboard/timetable',   icon: '📅', label: 'Timetable' },
      { href: '/dashboard/assignments', icon: '📋', label: 'Assignments' },
      { href: '/dashboard/notices',     icon: '🔔', label: 'Notices' },
      { href: '/dashboard/notes',       icon: '📄', label: 'Notes' },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/dashboard/profile',  icon: '👤', label: 'Profile' },
      { href: '/dashboard/settings', icon: '⚙️', label: 'Settings' },
    ]
  }
]

const QUICK_LINKS = [
  { href: '/dashboard',             icon: '⊞', label: 'Dashboard' },
  { href: '/dashboard/students',    icon: '👥', label: 'Students' },
  { href: '/dashboard/attendance',  icon: '🎯', label: 'Attendance' },
  { href: '/dashboard/timetable',   icon: '📅', label: 'Timetable' },
  { href: '/dashboard/assignments', icon: '📋', label: 'Assignments' },
  { href: '/dashboard/notices',     icon: '🔔', label: 'Notices' },
  { href: '/dashboard/notes',       icon: '📄', label: 'Notes' },
  { href: '/dashboard/profile',     icon: '👤', label: 'Profile' },
  { href: '/dashboard/settings',    icon: '⚙️', label: 'Settings' },
]

interface Notice { id: string; title: string; content: string; createdAt: string; author: { name: string } }
interface Assignment { id: string; title: string; dueDate: string | null; teacher: { user: { name: string } } }
interface Student { id: string; user: { name: string } }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useUser()
  const [dark, setDark] = useState(false)
  const [notifOpen, setNotifOpen]       = useState(false)
  const [chatOpen, setChatOpen]         = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [searchOpen, setSearchOpen]     = useState(false)
  const [searchQuery, setSearchQuery]   = useState('')
  const [readIds, setReadIds]           = useState<Set<string>>(new Set())

  const [notices, setNotices]         = useState<Notice[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [students, setStudents]       = useState<Student[]>([])
  const [dataLoaded, setDataLoaded]   = useState(false)

  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('darkMode')
    if (saved === 'true') { setDark(true); document.documentElement.classList.add('dark') }
    else { setDark(false); document.documentElement.classList.remove('dark') }
  }, [])

  useEffect(() => {
    fetch('/api/dashboard-stats')
      .then(r => r.json())
      .then(data => {
        if (data.recentNotices) setNotices(data.recentNotices)
        if (data.recentAssignments) setAssignments(data.recentAssignments)
        if (data.recentStudents) setStudents(data.recentStudents)
        setDataLoaded(true)
      })
      .catch(() => setDataLoaded(true))
  }, [])

  useEffect(() => {
    if (searchOpen) setTimeout(() => searchRef.current?.focus(), 50)
  }, [searchOpen])

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) }
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotifOpen(false)
        setChatOpen(false)
        setCalendarOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  function toggleDark() {
    const next = !dark
    setDark(next)
    localStorage.setItem('darkMode', String(next))
    document.documentElement.classList.toggle('dark', next)
  }

  const notifications = [
    ...notices.map(n => ({
      id: `notice-${n.id}`,
      icon: '📢',
      title: n.title,
      sub: `Posted by ${n.author?.name || 'Admin'}`,
      time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      color: '#f43f5e',
    })),
    ...assignments.map(a => ({
      id: `assign-${a.id}`,
      icon: '📋',
      title: a.title,
      sub: a.dueDate
        ? `Due: ${new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
        : 'No due date',
      time: a.dueDate && new Date(a.dueDate) < new Date() ? 'Overdue' : 'Active',
      color: '#f59e0b',
    })),
    ...students.map(s => ({
      id: `student-${s.id}`,
      icon: '👥',
      title: `${s.user?.name} enrolled`,
      sub: 'New student added',
      time: 'Recently',
      color: '#6366f1',
    })),
  ].slice(0, 8)

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  function markAllRead() {
    setReadIds(new Set(notifications.map(n => n.id)))
  }

  const pageTitle = pathname.split('/').pop()?.replace('-', ' ') || 'dashboard'
  const title = pageTitle.charAt(0).toUpperCase() + pageTitle.slice(1)

  const filteredLinks = searchQuery
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : QUICK_LINKS

  const today = new Date()
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay()
  const monthName = today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const upcomingAssignments = assignments
    .filter(a => a.dueDate && new Date(a.dueDate) >= new Date())
    .slice(0, 3)

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-page)' }}>

      {/* Sidebar */}
      <aside className="hidden md:flex w-60 flex-col fixed h-full z-20 border-r"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        <div className="flex items-center gap-3 px-5 py-5 border-b"
          style={{ borderColor: 'var(--border-color)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            <span className="text-white font-black text-base">S</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none" style={{ color: 'var(--text-primary)' }}>Smart Campus</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>School Management</p>
          </div>
        </div>

        <div className="px-3 pt-4 pb-2">
          <Link href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: pathname === '/dashboard' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: pathname === '/dashboard' ? '#fff' : 'var(--text-secondary)',
            }}>
            <span>⊞</span> Dashboard
          </Link>
        </div>

        <nav className="flex-1 px-3 pb-4 space-y-4 overflow-y-auto">
          {navGroups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] px-3 mb-2"
                style={{ color: 'var(--text-muted)' }}>{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const isActive = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: isActive ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                      }}>
                      <span className="w-5 text-center">{item.icon}</span>
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="mx-3 mb-3 p-3 rounded-xl border"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2">
            <span>🏫</span>
            <div>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Current Session</p>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>2026 – 2027</p>
            </div>
          </div>
        </div>

        <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
          <button onClick={toggleDark}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium"
            style={{ background: 'var(--bg-card)', color: 'var(--text-secondary)' }}>
            <div className="flex items-center gap-2.5">
              <span>{dark ? '☀️' : '🌙'}</span>
              <span>{dark ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <div className="w-8 h-4 rounded-full relative"
              style={{ background: dark ? '#6366f1' : '#e2e8f0' }}>
              <div className="w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all"
                style={{ left: dark ? '18px' : '2px' }} />
            </div>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col">

        {/* Topbar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5 border-b"
          style={{ background: 'var(--bg-topbar)', borderColor: 'var(--border-color)', backdropFilter: 'blur(20px)' }}>

          <h1 className="text-lg font-bold capitalize" style={{ color: 'var(--text-primary)' }}>{title}</h1>

          <button onClick={() => setSearchOpen(true)}
            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl border flex-1 max-w-sm mx-6 text-left"
            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-color)' }}>
            <span style={{ color: 'var(--text-muted)' }}>🔍</span>
            <span className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>Search pages...</span>
            <span className="text-xs px-1.5 py-0.5 rounded border font-mono"
              style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}>
              ⌘K
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => { setCalendarOpen(p => !p); setChatOpen(false); setNotifOpen(false) }}
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-base"
              style={{
                background: calendarOpen ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                borderColor: calendarOpen ? '#6366f1' : 'var(--border-color)'
              }}>📅</button>

            <button onClick={() => { setChatOpen(p => !p); setCalendarOpen(false); setNotifOpen(false) }}
              className="w-9 h-9 rounded-xl border flex items-center justify-center text-base"
              style={{
                background: chatOpen ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                borderColor: chatOpen ? '#6366f1' : 'var(--border-color)'
              }}>💬</button>

            <button onClick={() => { setNotifOpen(p => !p); setChatOpen(false); setCalendarOpen(false) }}
              className="relative w-9 h-9 rounded-xl border flex items-center justify-center text-base"
              style={{
                background: notifOpen ? 'rgba(99,102,241,0.12)' : 'var(--bg-card)',
                borderColor: notifOpen ? '#6366f1' : 'var(--border-color)'
              }}>
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="w-px h-6 mx-1" style={{ background: 'var(--border-color)' }} />
            <div className="flex items-center gap-2">
              <UserButton />
              <div className="hidden md:block">
                <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.firstName || 'Admin'}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* Notification Panel */}
        {notifOpen && (
          <div className="fixed top-16 right-4 z-50 w-80 rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center justify-between px-4 py-3.5 border-b"
              style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white bg-indigo-500">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={markAllRead} className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                Mark all read
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {!dataLoaded ? (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2">🔔</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No notifications yet</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Add students, notices or assignments to see activity here
                  </p>
                </div>
              ) : notifications.map(notif => {
                const isUnread = !readIds.has(notif.id)
                return (
                  <div key={notif.id}
                    className="flex items-start gap-3 px-4 py-3.5 border-b cursor-pointer transition-colors"
                    style={{ borderColor: 'var(--border-color)', background: isUnread ? `${notif.color}06` : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isUnread ? `${notif.color}06` : 'transparent')}
                    onClick={() => setReadIds(prev => new Set([...prev, notif.id]))}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ background: `${notif.color}15` }}>
                      {notif.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {notif.title}
                        </p>
                        {isUnread && <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: notif.color }} />}
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{notif.sub}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{notif.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-4 py-3 border-t text-center" style={{ borderColor: 'var(--border-color)' }}>
              <Link href="/dashboard/notices" onClick={() => setNotifOpen(false)}
                className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                View all notices →
              </Link>
            </div>
          </div>
        )}

        {/* Calendar Panel */}
        {calendarOpen && (
          <div className="fixed top-16 right-24 z-50 w-72 rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div className="px-4 py-3.5 border-b flex items-center justify-between"
              style={{ borderColor: 'var(--border-color)' }}>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>📅 {monthName}</span>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold py-1"
                    style={{ color: 'var(--text-muted)' }}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {[...Array(firstDay)].map((_, i) => <div key={`e${i}`} />)}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1
                  const isToday = day === today.getDate()
                  return (
                    <button key={day}
                      className="w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium"
                      style={{
                        background: isToday ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                        color: isToday ? '#fff' : 'var(--text-primary)',
                      }}
                      onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--bg-hover)' }}
                      onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = 'transparent' }}>
                      {day}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="px-4 pb-4">
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2"
                style={{ color: 'var(--text-muted)' }}>Upcoming Assignments</p>
              {upcomingAssignments.length === 0 ? (
                <div className="p-3 rounded-xl text-center" style={{ background: 'var(--bg-page)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No upcoming assignments</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {upcomingAssignments.map(a => (
                    <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-xl"
                      style={{ background: 'var(--bg-page)' }}>
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {a.title}
                        </p>
                        {a.dueDate && (
                          <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            Due: {new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-4 pb-4 border-t pt-3" style={{ borderColor: 'var(--border-color)' }}>
              <Link href="/dashboard/timetable" onClick={() => setCalendarOpen(false)}
                className="text-xs font-semibold" style={{ color: '#6366f1' }}>
                View full timetable →
              </Link>
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {chatOpen && (
          <div className="fixed top-16 right-14 z-50 w-80 rounded-2xl border shadow-2xl overflow-hidden"
            style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <div className="px-4 py-3.5 border-b" style={{ borderColor: 'var(--border-color)' }}>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>💬 Recent Activity</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Latest updates from your school</p>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {!dataLoaded ? (
                <div className="p-6 text-center text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</div>
              ) : notices.length === 0 && assignments.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-3xl mb-2">💬</p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No recent activity</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Post notices or create assignments to see activity
                  </p>
                </div>
              ) : (
                <>
                  {notices.slice(0, 3).map(n => (
                    <Link key={n.id} href="/dashboard/notices" onClick={() => setChatOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 border-b transition-colors"
                      style={{ borderColor: 'var(--border-color)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#f43f5e,#ec4899)' }}>
                        📢
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {n.title}
                        </p>
                        <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--text-muted)' }}>
                          {n.content}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                          By {n.author?.name} · {new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    </Link>
                  ))}
                  {assignments.slice(0, 2).map(a => (
                    <Link key={a.id} href="/dashboard/assignments" onClick={() => setChatOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 border-b transition-colors"
                      style={{ borderColor: 'var(--border-color)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        📋
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {a.title}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                          By {a.teacher?.user?.name}
                          {a.dueDate && ` · Due ${new Date(a.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                        </p>
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>

            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <div className="flex gap-2">
                <Link href="/dashboard/notices" onClick={() => setChatOpen(false)}
                  className="flex-1 text-center text-xs font-semibold py-2 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                  Notices
                </Link>
                <Link href="/dashboard/assignments" onClick={() => setChatOpen(false)}
                  className="flex-1 text-center text-xs font-semibold py-2 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                  Assignments
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {searchOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSearchOpen(false) }}>
            <div className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden"
              style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 px-4 py-3.5 border-b"
                style={{ borderColor: 'var(--border-color)' }}>
                <span>🔍</span>
                <input ref={searchRef}
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 text-sm bg-transparent outline-none font-medium"
                  style={{ color: 'var(--text-primary)' }} />
                <button onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                  className="text-xs px-2 py-1 rounded-lg border font-mono"
                  style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                  ESC
                </button>
              </div>
              <div className="p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest px-2 mb-2"
                  style={{ color: 'var(--text-muted)' }}>
                  {searchQuery ? `Results for "${searchQuery}"` : 'Quick Navigation'}
                </p>
                {filteredLinks.length === 0 ? (
                  <div className="py-8 text-center">
                    <p className="text-3xl mb-2">🔍</p>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      No pages found for &quot;{searchQuery}&quot;
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {filteredLinks.map(link => (
                      <Link key={link.href} href={link.href}
                        onClick={() => { setSearchOpen(false); setSearchQuery('') }}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <span className="text-base">{link.icon}</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {link.label}
                        </span>
                        <span className="ml-auto text-xs" style={{ color: 'var(--text-muted)' }}>→</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div className="px-4 py-2.5 border-t flex items-center gap-4"
                style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>↵ to select</span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>ESC to close</span>
              </div>
            </div>
          </div>
        )}

        <main className="flex-1 p-6 pb-8">{children}</main>

        <footer className="py-4 text-center text-xs border-t"
          style={{ color: 'var(--text-muted)', borderColor: 'var(--border-color)' }}>
          © 2026 Smart Campus. All rights reserved.
        </footer>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t flex justify-around py-2 z-20"
        style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}>
        {[
          { href: '/dashboard',            icon: '⊞', label: 'Home' },
          { href: '/dashboard/students',   icon: '👥', label: 'Students' },
          { href: '/dashboard/attendance', icon: '🎯', label: 'Attend' },
          { href: '/dashboard/notices',    icon: '🔔', label: 'Notices' },
          { href: '/dashboard/profile',    icon: '👤', label: 'Profile' },
        ].map(item => (
          <Link key={item.href} href={item.href}
            className="flex flex-col items-center gap-1 px-3 py-1"
            style={{ color: pathname === item.href ? '#6366f1' : 'var(--text-muted)' }}>
            <span className="text-xl">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}