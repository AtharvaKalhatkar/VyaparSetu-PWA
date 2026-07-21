import React, { useState, useEffect, useCallback } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { Icons } from './Icons'

interface AdCreative {
  id: string
  title: string
  subtitle: string
  cta: string
  icon: React.ReactNode
  gradient: string
  action?: () => void
}

const GRADIENTS = [
  'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
  'linear-gradient(135deg, #000428 0%, #004e92 100%)',
  'linear-gradient(135deg, #1cb5e0 0%, #000851 100%)',
  'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
  'linear-gradient(135deg, #0d324d 0%, #7f5a83 100%)',
  'linear-gradient(135deg, #0b8793 0%, #360033 100%)',
  'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
  'linear-gradient(135deg, #3c1053 0%, #ad5389 100%)',
  'linear-gradient(135deg, #0c3483 0%, #a2b6df 100%)',
]

let shownAds = new Set<string>()

function ShimmerOverlay() {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', borderRadius: 'inherit',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: '-100%', width: '60%', height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        animation: 'adShimmer 3s ease-in-out infinite',
      }} />
    </div>
  )
}

const ANIM_IN = 'adBannerIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'

const AD_CREATIVES: AdCreative[] = [
  { id: 'stock-summary', title: 'Stock Summary Live', subtitle: 'Track stock value, low alerts & movement at a glance', cta: 'Try Now', icon: <ChartIcon />, gradient: GRADIENTS[0] },
  { id: 'whatsapp-share', title: 'Share with CA on WhatsApp', subtitle: 'One tap to send monthly reports directly to your CA', cta: 'Share Now', icon: <WAIcon />, gradient: GRADIENTS[1] },
  { id: 'backup', title: 'Backup & Restore', subtitle: 'Never lose your data — export & import with one click', cta: 'Backup Now', icon: <Icons.Download size={20} />, gradient: GRADIENTS[2] },
  { id: 'pos-mode', title: 'POS Billing Mode', subtitle: 'Quick billing with large buttons & instant receipt print', cta: 'Open POS', icon: <Icons.Billing size={20} />, gradient: GRADIENTS[3] },
  { id: 'price-lists', title: 'Price Lists', subtitle: 'Set retail, wholesale & distributor prices per item', cta: 'Set Prices', icon: <TagIcon />, gradient: GRADIENTS[4] },
  { id: 'multi-currency', title: 'Multi-Currency Support', subtitle: 'Bill in USD, EUR, GBP & more — now supported', cta: 'Enable', icon: <GlobeIcon />, gradient: GRADIENTS[5] },
  { id: 'credit-limit', title: 'Credit Limit Alerts', subtitle: 'Get warned when a customer exceeds their credit limit', cta: 'Set Limits', icon: <ShieldIcon />, gradient: GRADIENTS[6] },
  { id: 'fixed-assets', title: 'Fixed Assets Tracker', subtitle: 'Track depreciation & manage your assets in one place', cta: 'View Assets', icon: <Icons.Building size={20} />, gradient: GRADIENTS[7] },
  { id: 'barcode-scan', title: 'Scan Barcodes', subtitle: 'Use camera to scan & add items instantly', cta: 'Scan Now', icon: <Icons.Barcode size={20} />, gradient: GRADIENTS[8] },
  { id: 'gstr2', title: 'GSTR-2 / ITC Matching', subtitle: 'Auto-match purchase invoices with supplier GSTR-2A', cta: 'View Report', icon: <Icons.Reports size={20} />, gradient: GRADIENTS[9] },
]

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function WAIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

function TagIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}

export function AdBanner({ onAction, position = 'top' }: { onAction?: (ad: AdCreative) => void; position?: 'top' | 'inline' }) {
  const [ad, setAd] = useState<AdCreative | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const available = AD_CREATIVES.filter(a => !shownAds.has(a.id))
    if (available.length === 0) { shownAds.clear(); setAd(AD_CREATIVES[Math.floor(Math.random() * AD_CREATIVES.length)]) }
    else setAd(available[Math.floor(Math.random() * available.length)])
    const interval = setInterval(() => {
      setAd(prev => {
        const avail = AD_CREATIVES.filter(a => a.id !== prev?.id && !shownAds.has(a.id))
        return avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : prev
      })
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handleDismiss = useCallback(() => {
    if (ad) shownAds.add(ad.id)
    setDismissed(true)
  }, [ad])

  if (!ad || dismissed) return null

  const handleClick = () => {
    shownAds.add(ad.id)
    onAction?.(ad)
  }

  const bannerStyle: React.CSSProperties = position === 'top' ? {
    margin: '0 0 12px 0', borderRadius: BorderRadius.md, overflow: 'hidden',
  } : {
    margin: '12px 0', borderRadius: BorderRadius.md, overflow: 'hidden',
  }

  return (
    <div style={bannerStyle}>
      <div style={{
        background: ad.gradient, padding: '14px 16px', position: 'relative',
        animation: ANIM_IN,
      }}>
        <ShimmerOverlay />
        <button onClick={handleDismiss} style={{
          position: 'absolute', top: 6, right: 8, background: 'rgba(255,255,255,0.15)', border: 'none',
          color: 'rgba(255,255,255,0.7)', borderRadius: 12, width: 24, height: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, zIndex: 2,
          backdropFilter: 'blur(4px)',
        }}>✕</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingRight: 20 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            flexShrink: 0, animation: 'adPulse 2s ease-in-out infinite',
          }}>
            {ad.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2, letterSpacing: '0.01em' }}>{ad.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', lineHeight: 1.3 }}>{ad.subtitle}</div>
          </div>
          <button onClick={handleClick} style={{
            padding: '8px 14px', borderRadius: 20, border: 'none', backgroundColor: 'rgba(255,255,255,0.92)',
            color: '#1a1a2e', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
            flexShrink: 0, boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.15)' }}
          >{ad.cta}</button>
        </div>
      </div>
      <style>{`
        @keyframes adBannerIn { from { opacity:0; transform:translateY(-12px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes adPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        @keyframes adShimmer { 0% { left:-100%; } 100% { left:200%; } }
      `}</style>
    </div>
  )
}

export function AdPopup({ onAction }: { onAction?: (ad: AdCreative) => void }) {
  const [visible, setVisible] = useState(false)
  const [ad, setAd] = useState<AdCreative | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const available = AD_CREATIVES.filter(a => !shownAds.has(a.id))
      if (available.length > 0) {
        setAd(available[Math.floor(Math.random() * available.length)])
        setVisible(true)
      }
    }, 30000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible || !ad) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: Spacing.lg,
      animation: 'adPopFade 0.35s ease-out',
      backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: ad.gradient, borderRadius: BorderRadius.lg, padding: '28px 24px',
        maxWidth: 340, width: '100%', position: 'relative', overflow: 'hidden',
        animation: 'adPopBounce 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <ShimmerOverlay />
        <button onClick={() => { if (ad) shownAds.add(ad.id); setVisible(false) }} style={{
          position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.12)',
          border: 'none', color: 'rgba(255,255,255,0.7)', borderRadius: 16, width: 32, height: 32,
          cursor: 'pointer', fontSize: 16, zIndex: 2,
          backdropFilter: 'blur(4px)',
        }}>✕</button>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
            margin: '0 auto 12px',
            animation: 'adPopPulse 2s ease-in-out infinite',
          }}>{ad.icon}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, letterSpacing: '0.01em' }}>{ad.title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.4 }}>{ad.subtitle}</div>
        </div>
        <button onClick={() => { shownAds.add(ad.id); onAction?.(ad); setVisible(false) }} style={{
          width: '100%', padding: '14px', borderRadius: 12, border: 'none',
          backgroundColor: 'rgba(255,255,255,0.92)', color: '#1a1a2e',
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)' }}
        >{ad.cta}</button>
      </div>
      <style>{`
        @keyframes adPopFade { from { opacity:0; } to { opacity:1; } }
        @keyframes adPopBounce { from { opacity:0; transform:scale(0.7) translateY(24px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes adPopPulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.05); } }
        @keyframes adShimmer { 0% { left:-100%; } 100% { left:200%; } }
      `}</style>
    </div>
  )
}
