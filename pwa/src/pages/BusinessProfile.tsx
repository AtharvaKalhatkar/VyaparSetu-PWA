import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'
import { ALL_VERTICALS } from '../verticals'
import type { BusinessType } from '../verticals/types'

export function BusinessProfile({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (p: string) => void }) {
  const profile = DB.businessProfile.get()
  const businessId = profile.businessId || localStorage.getItem('vs_business_id') || 'VS-682914'

  const [businessType, setBusinessType] = useState<BusinessType>((profile as any).businessType || 'RETAIL')
  const [name, setName] = useState(profile.businessName)
  const [owner, setOwner] = useState(profile.ownerName)
  const [phone, setPhone] = useState(profile.phone)
  const [email, setEmail] = useState(profile.email)
  const [address, setAddress] = useState(profile.address)
  const [gstin, setGstin] = useState(profile.gstin)
  const [pan, setPan] = useState(profile.pan)
  const [bankName, setBankName] = useState(profile.bankName)
  const [bankAccount, setBankAccount] = useState(profile.bankAccount)
  const [bankIfsc, setBankIfsc] = useState(profile.bankIfsc)
  const [upiId, setUpiId] = useState(profile.upiId || '')

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [passMsg, setPassMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)

  const copyBusinessId = () => {
    navigator.clipboard.writeText(businessId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = () => {
    if (!name.trim()) { alert('Business name is required'); return }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) { alert('Phone must be a 10-digit number'); return }
    if (email.trim() && !/.+@.+\..+/.test(email.trim())) { alert('Invalid email format'); return }
    if (gstin.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(gstin.trim())) { alert('Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)'); return }
    if (pan.trim() && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan.trim())) { alert('Invalid PAN format (e.g., ABCDE1234F)'); return }
    if (bankIfsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc.trim())) { alert('Invalid IFSC code format (e.g., SBIN0001234)'); return }

    DB.businessProfile.save({
      ...profile,
      businessName: name, ownerName: owner, phone, email, address, gstin, pan,
      bankName, bankAccount, bankIfsc, upiId: upiId.trim(), signature: profile.signature,
      businessType, businessId,
    })
    setSaved(true)
    setTimeout(onBack, 800)
  }

  const handleChangePassword = () => {
    setPassMsg(null)
    if (!currentPassword) {
      setPassMsg({ type: 'error', text: 'Please enter your current password.' })
      return
    }
    if (!newPassword || newPassword.length < 6) {
      setPassMsg({ type: 'error', text: 'New password must be at least 6 characters long.' })
      return
    }
    if (newPassword !== confirmPassword) {
      setPassMsg({ type: 'error', text: 'New passwords do not match.' })
      return
    }

    // Save updated password in local auth storage
    localStorage.setItem('vs_password', newPassword)
    setPassMsg({ type: 'success', text: 'Password updated successfully!' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const eyeBtnStyle: React.CSSProperties = {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary,
    display: 'flex', alignItems: 'center', padding: 4,
  }

  if (saved) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Icons.Check size={48} color={Colors.success} /></div>

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80, maxWidth: 600, margin: '0 auto' }}>
      
      {/* 🔒 Read-Only Business ID Banner */}
      <div style={{
        backgroundColor: Colors.primaryLight + '25',
        border: `1.5px solid ${Colors.primary}40`,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: Colors.primary, textTransform: 'uppercase', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Lock size={14} color={Colors.primary} /> Permanent Business ID (Read-Only)
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: Colors.textPrimary, letterSpacing: 1.5, fontFamily: 'monospace' }}>
            {businessId}
          </div>
          <button onClick={copyBusinessId} style={{
            padding: '6px 14px', backgroundColor: Colors.primary, color: '#fff', border: 'none',
            borderRadius: BorderRadius.sm, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {copied ? '✓ Copied' : 'Copy ID'}
          </button>
        </div>
        <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 6 }}>
          This unique 6-digit Business ID is locked to your account for cloud sync and employee login. It cannot be edited.
        </div>
      </div>

      {/* Business Vertical */}
      <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md }}>Business Type & Vertical</div>
      <Field label="Business Category / Industry Vertical">
        <select value={businessType} onChange={e => setBusinessType(e.target.value as any)} style={{ ...s.select, fontWeight: 700, color: Colors.primary }}>
          {ALL_VERTICALS.map(v => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>
      </Field>

      {/* Editable Business Details */}
      <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.md, marginBottom: Spacing.md }}>Editable Business Details</div>
      <Field label="Business Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="Your business name" style={s.input} /></Field>
      <Field label="Owner Name"><input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Owner/Proprietor" style={s.input} /></Field>
      <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={s.input} /></Field>
      <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={s.input} /></Field>
      <Field label="Address"><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" rows={2} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} /></Field>

      {/* Tax Info */}
      <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.md }}>Tax Info</div>
      <Field label="GSTIN"><input value={gstin} onChange={e => setGstin(e.target.value)} placeholder="GST registration number" style={s.input} /></Field>
      <Field label="PAN"><input value={pan} onChange={e => setPan(e.target.value)} placeholder="PAN number" style={s.input} /></Field>

      {/* Bank & Payment Details */}
      <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.md }}>Bank & Payment Details</div>
      <Field label="UPI ID (VPA)"><input value={upiId} onChange={e => setUpiId(e.target.value)} placeholder="e.g. yourshopname@upi" style={s.input} /></Field>
      <Field label="Bank Name"><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank name" style={s.input} /></Field>
      <Field label="Account Number"><input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Account number" style={s.input} /></Field>
      <Field label="IFSC Code"><input value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} placeholder="IFSC code" style={s.input} /></Field>

      <button onClick={handleSave} style={{ ...s.primaryBtn, marginTop: Spacing.lg, marginBottom: Spacing.xl }}>
        Save Profile Details
      </button>

      {/* 🔑 Change Password Section */}
      <div style={{ borderTop: `1.5px dashed ${Colors.divider}`, paddingTop: Spacing.lg, marginTop: Spacing.lg }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: Colors.textPrimary, marginBottom: Spacing.md, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icons.Lock size={16} color={Colors.primary} /> Change Account Password
        </div>

        {passMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: BorderRadius.sm, marginBottom: Spacing.md, fontSize: 12, fontWeight: 600,
            backgroundColor: passMsg.type === 'success' ? Colors.successLight : Colors.errorLight,
            color: passMsg.type === 'success' ? Colors.success : Colors.error,
          }}>
            {passMsg.text}
          </div>
        )}

        <Field label="Current Password">
          <div style={{ position: 'relative' }}>
            <input type={showCurrentPass ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Enter current password" style={{ ...s.input, paddingRight: 40 }} />
            <button type="button" onClick={() => setShowCurrentPass(!showCurrentPass)} style={eyeBtnStyle}>
              {showCurrentPass ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="New Password">
          <div style={{ position: 'relative' }}>
            <input type={showNewPass ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" style={{ ...s.input, paddingRight: 40 }} />
            <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={eyeBtnStyle}>
              {showNewPass ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
            </button>
          </div>
        </Field>

        <Field label="Confirm New Password">
          <div style={{ position: 'relative' }}>
            <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter new password" style={{ ...s.input, paddingRight: 40 }} />
            <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={eyeBtnStyle}>
              {showConfirmPass ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
            </button>
          </div>
        </Field>

        <button onClick={handleChangePassword} style={{ ...s.primaryBtn, backgroundColor: Colors.info, marginTop: Spacing.md }}>
          Update Password
        </button>
      </div>

    </div>
  )
}
