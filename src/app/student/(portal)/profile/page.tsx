'use client'
import { useState, useEffect } from 'react'

export default function StudentProfile() {
  const [session,  setSession]  = useState<any>(null)
  const [student,  setStudent]  = useState<any>(null)
  const [loading,  setLoading]  = useState(true)
  const [changePwd, setChangePwd] = useState(false)
  const [pwdForm,  setPwdForm]  = useState({ current: '', newPwd: '', confirm: '' })
  const [pwdMsg,   setPwdMsg]   = useState('')
  const [pwdErr,   setPwdErr]   = useState('')

  useEffect(() => {
    const s = localStorage.getItem('studentSession')
    if (s) {
      const parsed = JSON.parse(s)
      setSession(parsed)
      fetch(`/api/student/profile?studentId=${parsed.id}`)
        .then(r => r.json()).then(d => { setStudent(d); setLoading(false) })
    }
  }, [])

  async function handleChangePwd() {
    setPwdErr(''); setPwdMsg('')
    if (!pwdForm.current || !pwdForm.newPwd || !pwdForm.confirm) { setPwdErr('All fields required'); return }
    if (pwdForm.newPwd.length < 6) { setPwdErr('Min 6 characters'); return }
    if (pwdForm.newPwd !== pwdForm.confirm) { setPwdErr('Passwords do not match'); return }
    const res = await fetch('/api/student/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId: session.id, currentPassword: pwdForm.current, newPassword: pwdForm.newPwd })
    })
    const data = await res.json()
    if (!res.ok) { setPwdErr(data.error || 'Failed'); return }
    setPwdMsg('✓ Password changed successfully!'); setPwdForm({ current:'', newPwd:'', confirm:'' }); setChangePwd(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  )

  const name    = session?.name || 'Student'
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase()
  const parsed  = parseAddress(student?.address)

  function parseAddress(raw: string | null) {
    if (!raw) return { street:'', city:'', state:'', pincode:'', extra:{} }
    const [addrPart, extraPart] = raw.split(' | EXTRA: ')
    const parts = (addrPart||'').split(', ')
    const extra: Record<string,string> = {}
    if (extraPart) extraPart.split(' | ').forEach(seg => {
      const [k,...v] = seg.split(': ')
      if (k && v.length) extra[k.trim()] = v.join(': ').trim()
    })
    return { street:parts[0]||'', city:parts[1]||'', state:parts[2]||'', pincode:parts[3]||'', extra }
  }

  const iCls = "w-full px-3 py-2.5 rounded-xl border text-sm outline-none"
  const iSty = { background:'var(--bg-page)', borderColor:'var(--border-color)', color:'var(--text-primary)' }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>My Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Your student information</p>
      </div>

      {pwdMsg && (
        <div className="px-4 py-3 rounded-xl text-sm font-medium"
          style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>
          {pwdMsg}
        </div>
      )}

      {/* Profile header */}
      <div className="rounded-2xl border overflow-hidden"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="h-20" style={{ background: 'linear-gradient(135deg,#1e1b4b,#312e81,#4c1d95)' }} />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl border-4 flex items-center justify-center font-black text-white text-xl"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderColor: 'var(--bg-card)' }}>
              {initials}
            </div>
            <button onClick={() => setChangePwd(!changePwd)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-medium"
              style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)', background: 'var(--bg-page)' }}>
              🔐 Change Password
            </button>
          </div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{name}</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{session?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              ● Active Student
            </span>
            {student?.rollNumber && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                Roll: {student.rollNumber}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Change password form */}
      {changePwd && (
        <div className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'rgba(99,102,241,0.2)' }}>
          <h3 className="font-bold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>🔐 Change Password</h3>
          {pwdErr && (
            <div className="mb-3 px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'rgba(244,63,94,0.08)', color: '#f43f5e' }}>⚠ {pwdErr}</div>
          )}
          <div className="space-y-3">
            {[
              { label:'Current Password', key:'current', ph:'Enter current password' },
              { label:'New Password',     key:'newPwd',  ph:'Min 6 characters' },
              { label:'Confirm Password', key:'confirm', ph:'Re-enter new password' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold uppercase tracking-wide block mb-1.5"
                  style={{ color: 'var(--text-muted)' }}>{f.label}</label>
                <input type="password" placeholder={f.ph}
                  value={(pwdForm as any)[f.key]}
                  onChange={e => setPwdForm(p => ({ ...p, [f.key]: e.target.value }))}
                  className={iCls} style={iSty} />
              </div>
            ))}
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setChangePwd(false); setPwdErr('') }}
                className="flex-1 py-2.5 rounded-xl border text-sm font-semibold"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>Cancel</button>
              <button onClick={handleChangePwd}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>Update Password</button>
            </div>
          </div>
        </div>
      )}

      {/* Info sections */}
      {[
        {
          title: 'Personal Information', icon: '👤',
          rows: [
            { label: 'Full Name',    value: name },
            { label: 'Email',        value: session?.email },
            { label: 'Phone',        value: student?.phone },
            { label: 'Gender',       value: student?.gender === 'M' ? 'Male' : student?.gender === 'F' ? 'Female' : student?.gender },
            { label: 'Date of Birth', value: student?.dob ? new Date(student.dob).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'}) : null },
            { label: 'Blood Group',  value: parsed.extra['Blood Group'] },
            { label: 'Nationality',  value: parsed.extra['Nationality'] },
          ]
        },
        {
          title: 'Academic Information', icon: '📚',
          rows: [
            { label: 'Roll Number',   value: student?.rollNumber },
            { label: 'Admission No',  value: student?.admissionNo },
            { label: 'Class',         value: student?.section ? `${student.section.class.name} · Section ${student.section.name}` : null },
            { label: 'Status',        value: student?.status },
          ]
        },
        ...(parsed.street ? [{
          title: 'Address', icon: '📍',
          rows: [
            { label: 'Street',  value: parsed.street  },
            { label: 'City',    value: parsed.city    },
            { label: 'State',   value: parsed.state   },
            { label: 'Pincode', value: parsed.pincode },
          ]
        }] : []),
        ...(parsed.extra['Guardian'] ? [{
          title: 'Guardian Information', icon: '👪',
          rows: [
            { label: 'Name',       value: parsed.extra['Guardian']      },
            { label: 'Relation',   value: parsed.extra['Relation']      },
            { label: 'Phone',      value: parsed.extra['Guardian Phone']},
            { label: 'Occupation', value: parsed.extra['Occupation']    },
          ]
        }] : []),
      ].map(section => (
        <div key={section.title} className="rounded-2xl border p-5"
          style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">{section.icon}</span>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{section.title}</h3>
          </div>
          <div className="space-y-0">
            {section.rows.filter(r => r.value).map(row => (
              <div key={row.label} className="flex items-center justify-between py-3 border-b last:border-0"
                style={{ borderColor: 'var(--border-color)' }}>
                <span className="text-xs font-semibold uppercase tracking-wide w-28 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span className="text-sm text-right" style={{ color: 'var(--text-primary)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}