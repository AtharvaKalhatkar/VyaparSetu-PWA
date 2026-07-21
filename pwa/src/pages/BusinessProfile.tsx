import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s, Field } from '../utils/styles'
import { DB } from '../utils/storage'
import { Icons } from '../utils/Icons'

export function BusinessProfile({ onBack, onNavigate }: { onBack: () => void; onNavigate?: (p: string) => void }) {
  const profile = DB.businessProfile.get()
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
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (!name.trim()) { alert('Business name is required'); return }
    if (phone.trim() && !/^\d{10}$/.test(phone.trim())) { alert('Phone must be a 10-digit number'); return }
    if (email.trim() && !/.+@.+\..+/.test(email.trim())) { alert('Invalid email format'); return }
    if (gstin.trim() && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/.test(gstin.trim())) { alert('Invalid GSTIN format (e.g., 29ABCDE1234F1Z5)'); return }
    if (pan.trim() && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan.trim())) { alert('Invalid PAN format (e.g., ABCDE1234F)'); return }
    if (bankIfsc.trim() && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(bankIfsc.trim())) { alert('Invalid IFSC code format (e.g., SBIN0001234)'); return }
    DB.businessProfile.save({
      businessName: name, ownerName: owner, phone, email, address, gstin, pan,
      bankName, bankAccount, bankIfsc, signature: profile.signature,
    })
    setSaved(true)
    setTimeout(onBack, 800)
  }

  if (saved) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Icons.Check size={48} color={Colors.success} /></div>

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: Spacing.md }}>Business Details</div>
      <Field label="Business Name"><input value={name} onChange={e => setName(e.target.value)} placeholder="Your business name" style={s.input} /></Field>
      <Field label="Owner Name"><input value={owner} onChange={e => setOwner(e.target.value)} placeholder="Owner/Proprietor" style={s.input} /></Field>
      <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" style={s.input} /></Field>
      <Field label="Email"><input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" style={s.input} /></Field>
      <Field label="Address"><textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Full address" rows={2} style={{ ...s.input, resize: 'vertical', fontFamily: 'inherit' }} /></Field>

      <div style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.md }}>Tax Info</div>
      <Field label="GSTIN"><input value={gstin} onChange={e => setGstin(e.target.value)} placeholder="GST registration number" style={s.input} /></Field>
      <Field label="PAN"><input value={pan} onChange={e => setPan(e.target.value)} placeholder="PAN number" style={s.input} /></Field>

      <div style={{ fontSize: 12, fontWeight: 600, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1, marginTop: Spacing.lg, marginBottom: Spacing.md }}>Bank Details</div>
      <Field label="Bank Name"><input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Bank name" style={s.input} /></Field>
      <Field label="Account Number"><input value={bankAccount} onChange={e => setBankAccount(e.target.value)} placeholder="Account number" style={s.input} /></Field>
      <Field label="IFSC Code"><input value={bankIfsc} onChange={e => setBankIfsc(e.target.value)} placeholder="IFSC code" style={s.input} /></Field>

      <button onClick={handleSave} style={{ ...s.primaryBtn, marginTop: Spacing.lg }}>Save Profile</button>
    </div>
  )
}
