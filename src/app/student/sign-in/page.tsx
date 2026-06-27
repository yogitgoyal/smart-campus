'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function StudentSignIn() {
  const router = useRouter()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.email || !form.password) { setError('Both fields are required'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch('/api/student/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Invalid credentials'); setLoading(false); return }
      // store student session in localStorage
      localStorage.setItem('studentSession', JSON.stringify({ id: data.id, name: data.name, email: data.email, role: 'STUDENT' }))
      router.push('/student/dashboard')
    } catch {
      setError('Network error. Try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%)' }}>
      
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>S</div>
        <div>
          <p className="font-bold text-white text-base">Smart Campus</p>
          <p className="text-xs" style={{ color: '#6366f1' }}>Student Portal</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-2xl border p-8"
        style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)' }}>
        
        <h1 className="text-xl font-bold text-white mb-1">Student Sign In</h1>
        <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Use credentials provided by your school admin
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium"
            style={{ background: 'rgba(244,63,94,0.12)', color: '#f43f5e', border: '1px solid rgba(244,63,94,0.2)' }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}>Email Address</label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              placeholder="your@email.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
              style={{ color: 'rgba(255,255,255,0.4)' }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: '#fff' }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-60 mt-2"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Are you an admin?{' '}
            <Link href="/sign-in" className="font-semibold" style={{ color: '#6366f1' }}>Admin Login →</Link>
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
        © 2026 Smart Campus · Contact your school admin if you forgot your password
      </p>
    </div>
  )
}