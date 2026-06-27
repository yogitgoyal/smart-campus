import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-[#02020a] text-white overflow-x-hidden">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-16 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/40">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="font-bold text-white text-base tracking-tight">Smart Campus</span>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/student/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Student Login
          </Link>
          <Link href="/sign-in" className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2">
            Admin Login
          </Link>
          <Link href="/sign-up"
            className="text-sm bg-white text-gray-900 hover:bg-gray-100 px-5 py-2.5 rounded-full font-semibold transition-all hover:shadow-xl hover:shadow-white/10">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">

        {/* Background glows */}
        <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(109,40,217,0.15) 0%, transparent 70%)' }} />
          <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.08) 0%, transparent 70%)' }} />
          <div className="absolute top-[30%] right-[15%] w-[350px] h-[350px] rounded-full"
            style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.08) 0%, transparent 70%)' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.015]"
            style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
        </div>

        {/* Content */}
        <div className="relative">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300 text-xs font-medium mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            School Management · Built for 2026
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-8xl font-black leading-[0.95] tracking-[-0.03em] max-w-5xl mx-auto mb-8">
            <span className="text-white block">Manage your</span>
            <span className="block" style={{ background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 40%, #6366f1 70%, #4f46e5 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              school smarter
            </span>
          </h1>

          <p className="text-gray-400 text-xl max-w-lg mx-auto leading-relaxed mb-12 font-light">
            Attendance, timetables, assignments, notices, and student profiles — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-24">
            <Link href="/sign-up"
              className="group relative flex items-center gap-2.5 px-8 py-4 rounded-full font-semibold text-base transition-all"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 0 40px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)' }}>
              <span className="text-white">Start for free</span>
              <span className="text-white/70 group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link href="/sign-in"
              className="flex items-center gap-2 px-8 py-4 border border-white/8 hover:border-white/15 text-gray-400 hover:text-white rounded-full font-semibold text-base transition-all bg-white/3 hover:bg-white/5">
              Sign in to dashboard
            </Link>
          </div>

          {/* Dashboard mockup */}
          <div className="relative w-full max-w-5xl mx-auto">
            {/* Fade bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-40 z-10 pointer-events-none"
              style={{ background: 'linear-gradient(to top, #02020a, transparent)' }} />
            {/* Glow behind card */}
            <div className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl pointer-events-none"
              style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(79,70,229,0.3))' }} />

            <div className="relative rounded-2xl overflow-hidden border border-white/8"
              style={{ background: 'linear-gradient(135deg, #0d0d1f, #080814)', boxShadow: '0 40px 100px rgba(0,0,0,0.8)' }}>
              {/* Chrome bar */}
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                <div className="flex-1 mx-6">
                  <div className="rounded-md px-3 py-1.5 text-xs text-gray-600 text-center border border-white/5" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    smartcampus.app/dashboard
                  </div>
                </div>
              </div>

              {/* App layout */}
              <div className="flex" style={{ minHeight: '360px' }}>
                {/* Sidebar */}
                <div className="w-52 border-r border-white/5 hidden md:block p-3" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-2 px-2 py-2 mb-4">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>S</div>
                    <span className="text-xs font-semibold text-gray-300">Smart Campus</span>
                  </div>
                  <div className="space-y-0.5">
                    {[
                      { name: 'Dashboard', active: true },
                      { name: 'Students', active: false },
                      { name: 'Attendance', active: false },
                      { name: 'Timetable', active: false },
                      { name: 'Assignments', active: false },
                      { name: 'Notices', active: false },
                    ].map(item => (
                      <div key={item.name}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-colors ${item.active ? 'text-violet-300' : 'text-gray-600'}`}
                        style={item.active ? { background: 'rgba(124,58,237,0.12)' } : {}}>
                        <div className={`w-1.5 h-1.5 rounded-full ${item.active ? 'bg-violet-400' : 'bg-gray-700'}`} />
                        {item.name}
                        {item.active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-sm font-semibold text-gray-200">Dashboard</p>
                      <p className="text-xs text-gray-600 mt-0.5">Wednesday, 25 June 2026</p>
                    </div>
                    <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white">Y</div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-3 mb-5">
                    {[
                      { label: 'Students', val: '342', color: 'rgba(99,102,241,0.12)', text: '#818cf8' },
                      { label: 'Present', val: '289', color: 'rgba(16,185,129,0.10)', text: '#34d399' },
                      { label: 'Assignments', val: '18', color: 'rgba(139,92,246,0.12)', text: '#a78bfa' },
                      { label: 'Notices', val: '7', color: 'rgba(245,158,11,0.10)', text: '#fbbf24' },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 border border-white/5" style={{ background: s.color }}>
                        <p className="text-xl font-bold" style={{ color: s.text }}>{s.val}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="rounded-xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-400">Recent Students</span>
                      <span className="text-xs text-violet-400">View all →</span>
                    </div>
                    {[
                      { name: 'Aarav Sharma', roll: 'R-001', status: 'Present' },
                      { name: 'Priya Patel', roll: 'R-002', status: 'Present' },
                      { name: 'Rahul Verma', roll: 'R-003', status: 'Absent' },
                      { name: 'Sneha Gupta', roll: 'R-004', status: 'Present' },
                    ].map((row, i) => (
                      <div key={row.name} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/3 last:border-0 hover:bg-white/2 transition-colors">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: `linear-gradient(135deg, hsl(${i * 60 + 220},70%,55%), hsl(${i * 60 + 260},70%,45%))` }}>
                          {row.name[0]}
                        </div>
                        <span className="text-xs text-gray-300 flex-1">{row.name}</span>
                        <span className="text-xs text-gray-600">{row.roll}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${row.status === 'Present' ? 'text-emerald-400' : 'text-red-400'}`}
                          style={{ background: row.status === 'Present' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '8', label: 'Core modules' },
            { val: '3K+', label: 'Students supported' },
            { val: '100%', label: 'Mobile ready' },
            { val: '<2s', label: 'Load time' },
          ].map(s => (
            <div key={s.label}>
              <p className="text-4xl font-black text-white mb-1">{s.val}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 text-violet-300 text-xs font-medium mb-6">
              ✦ Everything you need
            </div>
            <h2 className="text-5xl md:text-6xl font-black text-white tracking-[-0.03em] mb-5">
              One platform.<br />
              <span style={{ background: 'linear-gradient(135deg, #a78bfa, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Every tool.
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-lg mx-auto">
              Every feature was designed around how small schools actually operate — not how enterprise software assumes they do.
            </p>
          </div>

          {/* Big feature cards - top row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Card 1 - Attendance (large) */}
            <div className="group relative rounded-3xl p-8 border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(5,150,105,0.04) 100%)', borderColor: 'rgba(16,185,129,0.15)' }}>
              {/* Glow */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12), transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6"
                  style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  ✅
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Smart Attendance</h3>
                <p className="text-gray-400 leading-relaxed mb-6">Mark attendance in under 2 minutes. Present, Absent, or Late — with full session history, percentage tracking, and visual reports.</p>
                {/* Mini UI preview */}
                <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">Today's Attendance</span>
                    <span className="text-xs font-bold text-emerald-400">85% present</span>
                  </div>
                  {['Aarav Sharma', 'Priya Patel', 'Rahul Verma'].map((name, i) => (
                    <div key={name} className="flex items-center gap-3 px-4 py-2.5 border-b border-white/3 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">{name[0]}</div>
                      <span className="text-xs text-gray-400 flex-1">{name}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${i === 2 ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'}`}>
                        {i === 2 ? '✗ Absent' : '✓ Present'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card 2 - Timetable (large) */}
            <div className="group relative rounded-3xl p-8 border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(79,70,229,0.04) 100%)', borderColor: 'rgba(99,102,241,0.15)' }}>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%)', transform: 'translate(30%, -30%)' }} />
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-6"
                  style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  📅
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Visual Timetable</h3>
                <p className="text-gray-400 leading-relaxed mb-6">Click any cell to assign a subject. Color-coded by subject, with room numbers and time slots. Mobile and desktop optimized.</p>
                {/* Mini timetable */}
                <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="grid grid-cols-6 border-b border-white/5">
                    {['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                      <div key={d} className="px-2 py-2 text-center text-xs text-gray-600 font-medium border-r border-white/5 last:border-0">{d}</div>
                    ))}
                  </div>
                  {[
                    ['P1', { s: 'Math', c: 'rgba(99,102,241,0.2)', t: '#818cf8' }, { s: 'Sci', c: 'rgba(16,185,129,0.2)', t: '#34d399' }, { s: 'Eng', c: 'rgba(245,158,11,0.2)', t: '#fbbf24' }, { s: 'Math', c: 'rgba(99,102,241,0.2)', t: '#818cf8' }, { s: 'Art', c: 'rgba(236,72,153,0.2)', t: '#f472b6' }],
                    ['P2', { s: 'Eng', c: 'rgba(245,158,11,0.2)', t: '#fbbf24' }, { s: 'Math', c: 'rgba(99,102,241,0.2)', t: '#818cf8' }, { s: 'Sci', c: 'rgba(16,185,129,0.2)', t: '#34d399' }, { s: 'PE', c: 'rgba(239,68,68,0.2)', t: '#f87171' }, { s: 'Math', c: 'rgba(99,102,241,0.2)', t: '#818cf8' }],
                  ].map((row, ri) => (
                    <div key={ri} className="grid grid-cols-6 border-b border-white/5 last:border-0">
                      {row.map((cell, ci) => (
                        <div key={ci} className="px-2 py-2 border-r border-white/5 last:border-0">
                          {ci === 0 ? (
                            <span className="text-xs text-gray-600 font-medium">{cell as string}</span>
                          ) : (
                            <div className="rounded-lg px-1.5 py-1 text-center text-xs font-medium"
                              style={{ background: (cell as any).c, color: (cell as any).t }}>
                              {(cell as any).s}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom row - 3 smaller cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Assignments */}
            <div className="group relative rounded-3xl p-7 border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(109,40,217,0.04))', borderColor: 'rgba(139,92,246,0.15)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent 70%)', transform: 'translate(30%,-30%)' }} />
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-5"
                style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}>📝</div>
              <h3 className="text-lg font-bold text-white mb-2">Assignments</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">Create tasks with due dates, max marks. Track submissions in real-time.</p>
              <div className="space-y-2">
                {[
                  { title: 'Math Exercise 3', due: '2 days', sub: 12 },
                  { title: 'Science Project', due: 'Today', sub: 5 },
                ].map(a => (
                  <div key={a.title} className="flex items-center gap-3 p-3 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 truncate">{a.title}</p>
                      <p className="text-xs text-gray-600 mt-0.5">Due in {a.due}</p>
                    </div>
                    <span className="text-xs text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full flex-shrink-0">{a.sub} submitted</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Notices */}
            <div className="group relative rounded-3xl p-7 border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.04))', borderColor: 'rgba(245,158,11,0.15)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent 70%)', transform: 'translate(30%,-30%)' }} />
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-5"
                style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>📢</div>
              <h3 className="text-lg font-bold text-white mb-2">Notice Board</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">Post announcements instantly. Pin important notices, set expiry dates.</p>
              <div className="space-y-2">
                {[
                  { title: 'Annual Sports Day', pin: true, date: 'Today' },
                  { title: 'Fee Deadline Reminder', pin: false, date: 'Yesterday' },
                ].map(n => (
                  <div key={n.title} className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="flex items-start gap-2">
                      {n.pin && <span className="text-amber-400 text-xs mt-0.5">📌</span>}
                      <div>
                        <p className="text-xs font-medium text-gray-300">{n.title}</p>
                        <p className="text-xs text-gray-600 mt-0.5">{n.date}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Students */}
            <div className="group relative rounded-3xl p-7 border overflow-hidden transition-all duration-300 hover:-translate-y-1"
              style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(37,99,235,0.04))', borderColor: 'rgba(59,130,246,0.15)' }}>
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'radial-gradient(circle, rgba(59,130,246,0.15), transparent 70%)', transform: 'translate(30%,-30%)' }} />
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-5"
                style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' }}>👨‍🎓</div>
              <h3 className="text-lg font-bold text-white mb-2">Student Profiles</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-5">Full records with roll numbers, class assignments, contact info and status.</p>
              <div className="space-y-2">
                {['Aarav Sharma', 'Priya Patel', 'Rahul Verma'].map((name, i) => (
                  <div key={name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-white/5" style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, hsl(${i * 60 + 200},70%,55%), hsl(${i * 60 + 240},70%,45%))` }}>
                      {name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-gray-300 truncate">{name}</p>
                      <p className="text-xs text-gray-600">Roll R-00{i + 1}</p>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes - full width */}
          <div className="group relative rounded-3xl p-8 border overflow-hidden transition-all duration-300 hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.04))', borderColor: 'rgba(236,72,153,0.12)' }}>
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ background: 'radial-gradient(ellipse at 80% 50%, rgba(236,72,153,0.06), transparent 60%)' }} />
            <div className="relative flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl mb-5"
                  style={{ background: 'rgba(236,72,153,0.12)', border: '1px solid rgba(236,72,153,0.2)' }}>📚</div>
                <h3 className="text-2xl font-bold text-white mb-3">Study Notes</h3>
                <p className="text-gray-400 leading-relaxed">Teachers upload materials with file links. Students access notes organized by subject, anytime, anywhere.</p>
              </div>
              <div className="md:w-2/3 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
                {[
                  { title: 'Chapter 5 — Algebra', sub: 'Mathematics', date: '24 Jun', icon: '📐' },
                  { title: 'Photosynthesis Notes', sub: 'Biology', date: '23 Jun', icon: '🌱' },
                  { title: 'World War II Summary', sub: 'History', date: '22 Jun', icon: '📖' },
                ].map(n => (
                  <div key={n.title} className="p-4 rounded-2xl border border-white/5 hover:border-pink-500/20 transition-colors group/card"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="text-2xl mb-3">{n.icon}</div>
                    <p className="text-sm font-semibold text-gray-200 mb-1">{n.title}</p>
                    <p className="text-xs text-pink-400/70 mb-2">{n.sub}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">{n.date}</p>
                      <span className="text-xs text-pink-400 opacity-0 group-hover/card:opacity-100 transition-opacity">View →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="py-12 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs text-gray-600 uppercase tracking-widest mb-6">Powered by</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {['Next.js 16', 'TypeScript', 'PostgreSQL', 'Prisma', 'Clerk Auth', 'Tailwind CSS', 'shadcn/ui', 'Vercel'].map(t => (
              <span key={t}
                className="px-4 py-2 rounded-full text-xs text-gray-500 hover:text-gray-300 transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center relative">
          <div className="absolute inset-0 blur-3xl opacity-20 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.8), transparent 70%)' }} />
          <div className="relative p-12 rounded-3xl border border-white/8"
            style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08), rgba(79,70,229,0.05))' }}>
            <p className="text-5xl mb-6">🏫</p>
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">Ready to get started?</h2>
            <p className="text-gray-400 mb-8">Join schools already managing students, attendance, and communication with Smart Campus.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/sign-up"
                className="px-8 py-4 rounded-full font-bold text-white text-base transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}>
                Admin Portal →
              </Link>
              <Link href="/student/sign-in"
                className="px-8 py-4 rounded-full font-semibold text-base transition-all border hover:border-white/30 hover:text-white"
                style={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.15)' }}>
                Student Login →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>S</div>
            <span className="font-semibold text-gray-500 text-sm">Smart Campus</span>
          </div>
          <p className="text-gray-700 text-xs text-center">
            Built with Next.js · PostgreSQL · Prisma · Clerk · Tailwind CSS · ReadyNest Internship 2026
          </p>
          <div className="flex gap-5">
            <Link href="/sign-in" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Sign In</Link>
            <Link href="/sign-up" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Sign Up</Link>
            <Link href="/dashboard" className="text-xs text-gray-600 hover:text-gray-300 transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}