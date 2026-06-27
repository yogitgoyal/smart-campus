'use client'
import { useState, useEffect } from 'react'

interface Settings {
  id: number
  platformName: string
  platformDesc: string
  academicSession: string
  schoolName: string
  schoolEmail: string
  schoolPhone: string
  schoolAddress: string
  schoolCity: string
  schoolState: string
  schoolWebsite: string
  language: string
  dateFormat: string
  currency: string
  theme: string
}

const defaults: Settings = {
  id: 1,
  platformName: 'Smart Campus',
  platformDesc: 'Modern School Management Platform',
  academicSession: '2026 - 2027',
  schoolName: '',
  schoolEmail: '',
  schoolPhone: '',
  schoolAddress: '',
  schoolCity: '',
  schoolState: '',
  schoolWebsite: '',
  language: 'English',
  dateFormat: 'DD/MM/YYYY',
  currency: 'INR',
  theme: 'indigo',
}

function getStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '20%' }
  if (score <= 2) return { label: 'Fair', color: '#f97316', width: '40%' }
  if (score <= 3) return { label: 'Good', color: '#eab308', width: '60%' }
  if (score <= 4) return { label: 'Strong', color: '#22c55e', width: '80%' }
  return { label: 'Very Strong', color: '#10b981', width: '100%' }
}

const reqs = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One special character', test: (p: string) => /[^A-Za-z0-9]/.test(p) },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaults)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [showCur, setShowCur] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showCon, setShowCon] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const strength = getStrength(pw.next)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          setSettings({ ...defaults, ...data })
        } else {
          const d = await res.json().catch(() => ({}))
          setMsg({ ok: false, text: d.error || 'Failed to load settings' })
        }
      } catch (err) {
        setMsg({ ok: false, text: `Network error: ${err}` })
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function saveSettings() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        setMsg({ ok: true, text: 'Settings saved successfully' })
      } else {
        const d = await res.json().catch(() => ({}))
        setMsg({ ok: false, text: d.error || 'Failed to save' })
      }
    } catch (err) {
      setMsg({ ok: false, text: `Network error: ${err}` })
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(null), 5000)
    }
  }

  async function changePassword() {
    setPwMsg(null)
    if (!pw.current || !pw.next || !pw.confirm) {
      setPwMsg({ ok: false, text: 'All fields are required' })
      return
    }
    if (pw.next.length < 8) {
      setPwMsg({ ok: false, text: 'Password must be at least 8 characters' })
      return
    }
    if (pw.next !== pw.confirm) {
      setPwMsg({ ok: false, text: 'New passwords do not match' })
      return
    }
    if (strength.label === 'Weak' || strength.label === 'Fair') {
      setPwMsg({ ok: false, text: 'Password is too weak — add uppercase, numbers, or special characters' })
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
      })
      if (res.ok) {
        setPwMsg({ ok: true, text: 'Password changed successfully' })
        setPw({ current: '', next: '', confirm: '' })
      } else {
        const d = await res.json().catch(() => ({}))
        setPwMsg({ ok: false, text: d.error || 'Failed to change password' })
      }
    } catch (err) {
      setPwMsg({ ok: false, text: `Network error: ${err}` })
    } finally {
      setPwSaving(false)
      setTimeout(() => setPwMsg(null), 5000)
    }
  }

  const tabs = [
    { key: 'general', label: 'General', icon: '⚙️' },
    { key: 'school', label: 'School Info', icon: '🏫' },
    { key: 'security', label: 'Security', icon: '🛡️' },
  ]

  const lc = 'text-xs font-bold uppercase tracking-wide block mb-1.5'
  const lm = { color: 'var(--text-muted)' }
  const ic = 'w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors focus:border-indigo-400'
  const is = { background: 'var(--bg-page)', borderColor: 'var(--border-color)', color: 'var(--text-primary)' }
  const bp = 'flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60'
  const bg = { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.35)' }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-40 rounded-lg animate-pulse" style={{ background: 'var(--border-color)' }} />
          <div className="h-4 w-72 rounded-lg animate-pulse" style={{ background: 'var(--border-color)' }} />
        </div>
        <div className="flex gap-6 flex-col md:flex-row">
          <div className="md:w-52 flex-shrink-0 space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-11 rounded-xl animate-pulse" style={{ background: 'var(--border-color)' }} />
            ))}
          </div>
          <div className="flex-1">
            <div className="h-72 rounded-2xl animate-pulse" style={{ background: 'var(--border-color)' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Manage your school preferences and configurations</p>
      </div>

      {msg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2"
          style={{ color: msg.ok ? '#059669' : '#e11d48', background: msg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${msg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
          <span className="mt-0.5">{msg.ok ? '✓' : '✕'}</span>
          <span className="break-all">{msg.text}</span>
        </div>
      )}

      <div className="flex gap-6 flex-col md:flex-row">

        {/* Sidebar */}
        <div className="md:w-52 flex-shrink-0">
          <div className="rounded-2xl border p-2 space-y-0.5 sticky top-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            {tabs.map((tab) => (
              <button key={tab.key} onClick={() => { setActiveTab(tab.key); setMsg(null) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left"
                style={{ background: activeTab === tab.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent', color: activeTab === tab.key ? '#fff' : 'var(--text-secondary)' }}>
                <span>{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-5">

          {/* GENERAL */}
          {activeTab === 'general' && (
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <h2 className="font-bold text-base mb-5" style={{ color: 'var(--text-primary)' }}>General Settings</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={lc} style={lm}>Platform Name</label>
                    <input value={settings.platformName} onChange={(e) => setSettings({ ...settings, platformName: e.target.value })} className={ic} style={is} />
                  </div>
                  <div>
                    <label className={lc} style={lm}>Academic Session</label>
                    <select value={settings.academicSession} onChange={(e) => setSettings({ ...settings, academicSession: e.target.value })} className={ic} style={is}>
                      <option>2026 - 2027</option>
                      <option>2025 - 2026</option>
                      <option>2024 - 2025</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lc} style={lm}>Platform Description</label>
                  <textarea rows={3} value={settings.platformDesc} onChange={(e) => setSettings({ ...settings, platformDesc: e.target.value })} className={`${ic} resize-none`} style={is} />
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={saveSettings} disabled={saving} className={bp} style={bg}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
                </div>
              </div>
            </div>
          )}

          {/* SCHOOL INFO */}
          {activeTab === 'school' && (
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>🏫</div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>School Information</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Update your school details</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'School Name', key: 'schoolName' as const, ph: 'Enter school name' },
                    { label: 'Email', key: 'schoolEmail' as const, ph: 'school@example.com' },
                    { label: 'Phone', key: 'schoolPhone' as const, ph: '+91 00000 00000' },
                    { label: 'Website', key: 'schoolWebsite' as const, ph: 'https://school.com' },
                    { label: 'City', key: 'schoolCity' as const, ph: 'Enter city' },
                    { label: 'State', key: 'schoolState' as const, ph: 'Enter state' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label className={lc} style={lm}>{f.label}</label>
                      <input value={settings[f.key]} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value })} placeholder={f.ph} className={ic} style={is} />
                    </div>
                  ))}
                </div>
                <div>
                  <label className={lc} style={lm}>Address</label>
                  <textarea rows={2} value={settings.schoolAddress} onChange={(e) => setSettings({ ...settings, schoolAddress: e.target.value })} placeholder="Enter full address" className={`${ic} resize-none`} style={is} />
                </div>
                <div className="flex justify-end pt-2">
                  <button onClick={saveSettings} disabled={saving} className={bp} style={bg}>{saving ? 'Saving...' : '💾 Save Changes'}</button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === 'security' && (
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>🛡️</div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Change Password</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Ensure your account stays secure</p>
                </div>
              </div>

              {pwMsg && (
                <div className="mb-5 px-4 py-3 rounded-xl text-sm font-medium flex items-start gap-2"
                  style={{ color: pwMsg.ok ? '#059669' : '#e11d48', background: pwMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(244,63,94,0.08)', border: `1px solid ${pwMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(244,63,94,0.2)'}` }}>
                  <span className="mt-0.5">{pwMsg.ok ? '✓' : '✕'}</span>
                  <span className="break-all">{pwMsg.text}</span>
                </div>
              )}

              <div className="space-y-5 max-w-md">
                {/* Current Password */}
                <div>
                  <label className={lc} style={lm}>Current Password</label>
                  <div className="relative">
                    <input
                      type={showCur ? 'text' : 'password'}
                      value={pw.current}
                      onChange={(e) => setPw({ ...pw, current: e.target.value })}
                      placeholder="Enter current password"
                      className={ic}
                      style={{ ...is, paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCur(!showCur)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm leading-none p-1 rounded-lg"
                      style={{ color: 'var(--text-muted)' }}
                      tabIndex={-1}>
                      {showCur ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className={lc} style={lm}>New Password</label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={pw.next}
                      onChange={(e) => setPw({ ...pw, next: e.target.value })}
                      placeholder="Create a strong password"
                      className={ic}
                      style={{ ...is, paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm leading-none p-1 rounded-lg"
                      style={{ color: 'var(--text-muted)' }}
                      tabIndex={-1}>
                      {showNew ? '🙈' : '👁️'}
                    </button>
                  </div>

                  {pw.next.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold" style={{ color: strength.color }}>{strength.label}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-color)' }}>
                        <div className="h-full rounded-full transition-all duration-300" style={{ width: strength.width, background: strength.color }} />
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
                        {reqs.map((r) => {
                          const pass = r.test(pw.next)
                          return (
                            <div key={r.label} className="flex items-center gap-1.5">
                              <span className="text-xs" style={{ color: pass ? '#10b981' : 'var(--text-muted)' }}>{pass ? '✓' : '○'}</span>
                              <span className="text-xs" style={{ color: pass ? '#10b981' : 'var(--text-muted)' }}>{r.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className={lc} style={lm}>Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showCon ? 'text' : 'password'}
                      value={pw.confirm}
                      onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                      placeholder="Re-enter new password"
                      className={ic}
                      style={{ ...is, paddingRight: '48px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCon(!showCon)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-sm leading-none p-1 rounded-lg"
                      style={{ color: 'var(--text-muted)' }}
                      tabIndex={-1}>
                      {showCon ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {pw.confirm.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <span className="text-xs" style={{ color: pw.next === pw.confirm ? '#10b981' : '#ef4444' }}>
                        {pw.next === pw.confirm ? '✓' : '✕'}
                      </span>
                      <span className="text-xs" style={{ color: pw.next === pw.confirm ? '#10b981' : '#ef4444' }}>
                        {pw.next === pw.confirm ? 'Passwords match' : 'Passwords do not match'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2">
                  <button onClick={changePassword} disabled={pwSaving} className={bp} style={bg}>
                    {pwSaving ? 'Changing...' : '🔑 Change Password'}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}