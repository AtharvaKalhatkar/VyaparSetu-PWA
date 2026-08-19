import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { ALL_VERTICALS } from '../verticals'
import { supabase } from '../utils/supabase'
import { hashPin } from '../utils/security'
import { Icons } from '../utils/Icons'
import type { EmployeeRole } from '../types'

export function Login({ onLogin }: { onLogin: (name: string, business: string, businessType?: string, role?: EmployeeRole) => void }) {
  const [mode, setMode] = useState<'cloud' | 'employee'>('cloud')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sign In State
  const [businessId, setBusinessId] = useState('')
  const [signInPassword, setSignInPassword] = useState('')

  // Sign Up State
  const [email, setEmail] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [businessName, setBusinessName] = useState('')
  const [businessType, setBusinessType] = useState('RETAIL')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Generated Business ID Modal State
  const [newlyCreatedBizId, setNewlyCreatedBizId] = useState<string | null>(null)

  // Employee Login State
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)

  // Password Visibility State
  const [showSignInPass, setShowSignInPass] = useState(false)
  const [showSignUpPass, setShowSignUpPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)

  const handleCloudSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!businessId.trim() || !signInPassword.trim()) {
      setError('Business ID and Password are required')
      return
    }
    setLoading(true)

    try {
      // Check local stored profile or Supabase user
      const existingProfile = DB.businessProfile.get()
      const savedBizId = existingProfile.businessId || localStorage.getItem('vs_business_id')

      if (savedBizId && savedBizId.toUpperCase() === businessId.trim().toUpperCase()) {
        onLogin(existingProfile.ownerName || 'Owner', existingProfile.businessName || 'My Business', existingProfile.businessType || 'RETAIL')
        return
      }

      // Supabase email/password fallback if businessId matches email prefix or metadata
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email: businessId.includes('@') ? businessId : `${businessId.toLowerCase()}@vyaparsetu.local`,
        password: signInPassword,
      })

      if (err) {
        // Allow login if matching business ID was previously generated
        if (savedBizId && savedBizId.toUpperCase() === businessId.trim().toUpperCase()) {
          onLogin(existingProfile.ownerName || 'Owner', existingProfile.businessName || 'My Business', existingProfile.businessType || 'RETAIL')
          return
        }
        throw new Error('Invalid Business ID or Password')
      }

      const userMeta = data.user?.user_metadata || {}
      const name = userMeta.ownerName || userMeta.name || 'Owner'
      const bizName = userMeta.businessName || 'My Business'
      onLogin(name, bizName, userMeta.businessType || 'RETAIL')
    } catch (err: any) {
      setError(err.message || 'Cloud authentication failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCloudSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !ownerName.trim() || !businessName.trim() || !signUpPassword.trim()) {
      setError('All fields are required')
      return
    }

    if (signUpPassword !== confirmPassword) {
      setError('Password and Confirm Password do not match')
      return
    }

    if (signUpPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      // Generate a unique 6-digit Business ID
      const uniqueId = 'VS-' + Math.floor(100000 + Math.random() * 900000)

      const { data, error: err } = await supabase.auth.signUp({
        email,
        password: signUpPassword,
        options: {
          data: {
            ownerName: ownerName.trim(),
            businessName: businessName.trim(),
            businessType,
            businessId: uniqueId,
          },
        },
      })

      if (err && !err.message.includes('already registered')) throw err

      // Save generated businessId in local profile storage
      const existingProfile = DB.businessProfile.get()
      DB.businessProfile.save({
        ...existingProfile,
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        businessType,
        email: email.trim(),
        businessId: uniqueId,
      })
      localStorage.setItem('vs_business_id', uniqueId)

      setNewlyCreatedBizId(uniqueId)
    } catch (err: any) {
      setError(err.message || 'Failed to create cloud account')
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const inputPin = pin.trim()
    const inputHash = await hashPin(inputPin)
    const emp = DB.employees.list().find(e => e.pin === inputPin || e.pin === inputHash)
    if (!emp) { setError('Invalid Employee PIN'); return }
    const profile = DB.businessProfile.get()
    onLogin(emp.name, profile.businessName || 'My Business', '__EMPLOYEE__', emp.role)
  }

  const proceedWithNewBiz = () => {
    if (!newlyCreatedBizId) return
    onLogin(ownerName.trim(), businessName.trim(), businessType)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', backgroundColor: Colors.background, padding: Spacing.xxl }}>
      <div style={{ textAlign: 'center', marginBottom: Spacing.xxxl }}>
        <div style={{ width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg, #2B5DC2, #1E4BA8)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(43,93,194,0.3)' }}>
          <span style={{ fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1 }}>V</span>
        </div>
        <h1 style={{ color: Colors.primary, fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>Vyapar Setu</h1>
        <p style={{ color: Colors.textSecondary, fontSize: 13, margin: '4px 0 0' }}>GST Accounting & Cloud Business Portal</p>
      </div>

      <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.lg, maxWidth: 440, width: '100%', margin: '0 auto 16px' }}>
        <button onClick={() => { setMode('cloud'); setError('') }} style={{ ...s.toggle(mode === 'cloud', Colors.primary), flex: 1, padding: '12px' }}>
          Cloud Login
        </button>
        <button onClick={() => { setMode('employee'); setError('') }} style={{ ...s.toggle(mode === 'employee', Colors.primary), flex: 1, padding: '12px' }}>
          Employee Login
        </button>
      </div>

      {newlyCreatedBizId ? (
        <div style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
          maxWidth: 440, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', textAlign: 'center'
        }}>
          <div style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.successLight, color: Colors.success, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Icons.Check size={32} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, color: Colors.textPrimary }}>Account Created!</h2>
          <p style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 20 }}>
            Your account has been set up successfully. Here is your unique Business ID for login:
          </p>

          <div style={{ backgroundColor: Colors.background, border: `2px dashed ${Colors.primary}`, borderRadius: BorderRadius.md, padding: '16px', marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 }}>Your Unique Business ID</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: Colors.primary, letterSpacing: 2, marginTop: 4 }}>{newlyCreatedBizId}</div>
          </div>

          <button onClick={proceedWithNewBiz} style={{ ...s.primaryBtn, width: '100%', padding: '14px', fontSize: 16 }}>
            Continue to Dashboard
          </button>
        </div>
      ) : mode === 'cloud' ? (
        !isSignUp ? (
          /* Sign In (Already Have Account) */
          <form onSubmit={handleCloudSignIn} style={{
            backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
            maxWidth: 440, width: '100%', margin: '0 auto', boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: Colors.textPrimary }}>Cloud Sign In</h2>
              <button type="button" onClick={() => { setIsSignUp(true); setError('') }} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                New User? Sign Up
              </button>
            </div>

            <InputField label="Business ID" value={businessId} onChange={setBusinessId} placeholder="e.g. VS-893421 or registered email" />

            <div style={{ marginBottom: Spacing.lg }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showSignInPass ? 'text' : 'password'} value={signInPassword} onChange={e => setSignInPassword(e.target.value)} placeholder="••••••••" style={{
                  width: '100%', padding: '12px 42px 12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary,
                }} />
                <button type="button" onClick={() => setShowSignInPass(!showSignInPass)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, display: 'flex', alignItems: 'center'
                }}>
                  {showSignInPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div style={{ color: Colors.error, fontSize: 12, marginBottom: Spacing.md, padding: 10, borderRadius: 6, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Warning size={16} /> {error}
            </div>}

            <button type="submit" disabled={loading || !businessId.trim() || !signInPassword.trim()} style={{
              width: '100%', padding: '14px', backgroundColor: Colors.primary, color: Colors.textLight,
              border: 'none', borderRadius: BorderRadius.sm, fontSize: 16, fontWeight: 600,
              cursor: 'pointer', opacity: loading || !businessId.trim() || !signInPassword.trim() ? 0.6 : 1,
            }}>
              {loading ? 'Signing In...' : 'Log In'}
            </button>
          </form>
        ) : (
          /* Sign Up (New User) */
          <form onSubmit={handleCloudSignUp} style={{
            backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
            maxWidth: 440, width: '100%', margin: '0 auto', boxSizing: 'border-box',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, color: Colors.textPrimary }}>New Business Sign Up</h2>
              <button type="button" onClick={() => { setIsSignUp(false); setError('') }} style={{ background: 'none', border: 'none', color: Colors.primary, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                Already Have Account? Sign In
              </button>
            </div>

            <InputField label="1. Email Address" value={email} onChange={setEmail} placeholder="owner@business.com" type="email" />
            <InputField label="2. Owner Name" value={ownerName} onChange={setOwnerName} placeholder="Enter your full name" />
            <InputField label="3. Business Name" value={businessName} onChange={setBusinessName} placeholder="Enter company or shop name" />

            <div style={{ marginBottom: Spacing.lg }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>4. Business Type</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)} style={{
                width: '100%', padding: '12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary, fontFamily: 'inherit'
              }}>
                {ALL_VERTICALS.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: Spacing.lg }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>5. Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showSignUpPass ? 'text' : 'password'} value={signUpPassword} onChange={e => setSignUpPassword(e.target.value)} placeholder="At least 6 characters" style={{
                  width: '100%', padding: '12px 42px 12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary,
                }} />
                <button type="button" onClick={() => setShowSignUpPass(!showSignUpPass)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, display: 'flex', alignItems: 'center'
                }}>
                  {showSignUpPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: Spacing.lg }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>6. Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirmPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Re-enter password" style={{
                  width: '100%', padding: '12px 42px 12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary,
                }} />
                <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, display: 'flex', alignItems: 'center'
                }}>
                  {showConfirmPass ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div style={{ color: Colors.error, fontSize: 12, marginBottom: Spacing.md, padding: 10, borderRadius: 6, backgroundColor: '#FEE2E2', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Warning size={16} /> {error}
            </div>}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', backgroundColor: Colors.primary, color: Colors.textLight,
              border: 'none', borderRadius: BorderRadius.sm, fontSize: 16, fontWeight: 600,
              cursor: 'pointer', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Creating Business Account...' : 'Sign Up & Get Business ID'}
            </button>
          </form>
        )
      ) : (
        /* Employee Login */
        <form onSubmit={handleEmployeeSubmit} style={{
          backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.xxl,
          maxWidth: 400, width: '100%', margin: '0 auto', boxSizing: 'border-box',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ margin: '0 0 20px', fontSize: 18, color: Colors.textPrimary }}>Employee Sign In</h2>
          <div style={{ marginBottom: Spacing.lg }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>Enter Employee PIN</label>
            <div style={{ position: 'relative' }}>
              <input type={showPin ? 'text' : 'password'} value={pin} onChange={e => setPin(e.target.value)} placeholder="Your 4-6 digit PIN" maxLength={6} style={{
                width: '100%', padding: '12px 42px 12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
                fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary,
              }} />
              <button type="button" onClick={() => setShowPin(!showPin)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: Colors.textSecondary, display: 'flex', alignItems: 'center'
              }}>
                {showPin ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
              </button>
            </div>
          </div>
          {error && <div style={{ color: Colors.error, fontSize: 13, marginBottom: Spacing.md, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icons.Warning size={16} /> {error}
          </div>}
          <button type="submit" style={{
            width: '100%', padding: '14px', backgroundColor: Colors.primary, color: Colors.textLight,
            border: 'none', borderRadius: BorderRadius.sm, fontSize: 16, fontWeight: 600,
            cursor: 'pointer', opacity: pin.trim() ? 1 : 0.6,
          }} disabled={!pin.trim()}>Sign In</button>
          <p style={{ fontSize: 11, color: Colors.textDisabled, marginTop: Spacing.md, textAlign: 'center' }}>
            Ask your business owner or admin for your 4-6 digit login PIN
          </p>
        </form>
      )}
    </div>
  )
}

function InputField({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; type?: string }) {
  return (
    <div style={{ marginBottom: Spacing.lg }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{
        width: '100%', padding: '12px 14px', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
        fontSize: 14, outline: 'none', boxSizing: 'border-box', backgroundColor: Colors.background, color: Colors.textPrimary,
      }} />
    </div>
  )
}
