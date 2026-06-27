'use client'
import { useState, useEffect } from 'react'
import { useClerk, useUser } from '@clerk/nextjs'

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

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>(defaults)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const { openUserProfile } = useClerk()
  const { user } = useUser()
  const signInMethod = user?.externalAccounts?.[0]?.provider // e.g. "google"

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
                      <input value={settings[f.key]} onChange={(e) => setSettings({ ...settings, [f.key]: e.target.value})} placeholder={f.ph} className={ic} style={is} />
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

          {/* SECURITY -- delegates entirely to Clerk, since that's what actually
              manages this admin account. The old custom form pointed at a
              "password" field that never existed on User and couldn't ever
              have worked, especially for accounts (like this one) signed in
              via Google, which has no password to change in the first place. */}
          {activeTab === 'security' && (
            <div className="rounded-2xl border p-6" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: 'rgba(99,102,241,0.1)' }}>🛡️</div>
                <div>
                  <h2 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>Account Security</h2>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Manage your sign-in and password</p>
                </div>
              </div>

              <div className="max-w-md space-y-4">
                <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-page)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {signInMethod
                      ? <>You signed in with <strong className="capitalize">{signInMethod}</strong>. Password changes, connected accounts, and two-factor authentication are all managed securely through Clerk.</>
                      : <>Your password, connected accounts, and two-factor authentication are all managed securely through Clerk.</>
                    }
                  </p>
                </div>

                <button onClick={() => openUserProfile()} className={bp} style={bg}>
                  🔑 Manage Account Security
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
