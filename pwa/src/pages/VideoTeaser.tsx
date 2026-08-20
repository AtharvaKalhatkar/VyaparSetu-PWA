import React, { useState, useEffect } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { Icons } from '../utils/Icons'

export function VideoTeaser({ onBack }: { onBack?: () => void }) {
  const [currentScene, setCurrentScene] = useState(1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [language, setLanguage] = useState<'EN' | 'HI'>('HI')

  const totalScenes = 6

  const scriptData = [
    {
      scene: 1,
      badge: '⚠️ SCENE 01: THE PAIN POINT',
      title: 'Tired of Manual Billing, Missing Inventory & GST Confusion?',
      subtitle: language === 'HI' 
        ? 'क्या आप भी रोज़-रोज़ की मैनुअल बिलिंग, स्टॉक के मिसमैच और GST के झंझट से परेशान हैं?'
        : 'Are long customer queues, missing inventory, and complicated GST filing stressing out your business every day?',
      icon: '😩',
    },
    {
      scene: 2,
      badge: '✨ SCENE 02: THE SOLUTION',
      title: 'Meet VyaparSetu Cloud GST ERP',
      subtitle: language === 'HI'
        ? 'अब लाइए अपने बिज़नेस में सुपरस्पीड — व्यापरसेतु के साथ! भारत का सबसे आसान GST बिलिंग और ERP पोर्टल।'
        : "Say hello to VyaparSetu — India's smartest Cloud GST Billing & ERP portal designed for growth.",
      icon: '🚀',
    },
    {
      scene: 3,
      badge: '⚡ SCENE 03: ULTRA-FAST POS COUNTER',
      title: 'Lightning-Fast Barcode POS Billing',
      subtitle: language === 'HI'
        ? 'ग्राहकों को दीजिए सुपरफास्ट बिलिंग! बारकोड स्कैन करें, बैग से किलो का कन्वर्जन करें और तुरंत थर्मल रसीद प्रिंट करें।'
        : 'Checkout customers in seconds! Scan barcodes, convert sub-units from Bags to Kilos automatically, and print instant thermal receipts.',
      icon: '⚡',
      mockup: {
        heading: '⚡ Barcode Scanning & Multi-Unit Bags-to-Kg Conversion',
        detail: 'Instant thermal Bluetooth receipt printer & cash return calculator.',
      }
    },
    {
      scene: 4,
      badge: '📊 SCENE 04: PROFIT ANALYTICS',
      title: 'Real-Time Bill-Wise Profit Breakdown',
      subtitle: language === 'HI'
        ? 'हर एक बिल पर अपना असली नेट प्रॉफिट और मार्जिन तुरंत देखें। कोई छुपा नुकसान नहीं, पूरी पारदर्शिता!'
        : 'Know your exact net profit on every single invoice in real-time. No hidden losses, no manual accounting math.',
      icon: '📈',
      mockup: {
        heading: '₹3,281.25 Net Sales Revenue | +24.5% Net Profit Margin',
        detail: 'Automated fractional cost calculation per unit sold.',
      }
    },
    {
      scene: 5,
      badge: '📲 SCENE 05: SMART AUTOMATION',
      title: 'Smart Stock Reorders & WhatsApp Reminders',
      subtitle: language === 'HI'
        ? 'स्टॉक खत्म होने से पहले पाएँ ऑटो-रीऑर्डर अलर्ट, और ग्राहकों को 1-क्लिक में भेजें WhatsApp पेमेंट रिमाइंडर।'
        : 'Automate supplier reorders before stock runs out, and collect pending payments faster with 1-tap WhatsApp reminders.',
      icon: '📲',
    },
    {
      scene: 6,
      badge: '🌟 SCENE 06: CALL TO ACTION',
      title: 'Upgrade Your Business Today!',
      subtitle: language === 'HI'
        ? 'आज ही अपने व्यापार को बनाइए डिजिटल और स्मार्ट! अभी विजिट करें या ऐप डाउनलोड करें।'
        : 'Join thousands of smart business owners upgrading their store today. Try VyaparSetu for free now!',
      icon: '🏆',
      cta: '👉 https://atharvakalhatkar.github.io/VyaparSetu-PWA/',
    },
  ]

  useEffect(() => {
    let timer: any
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentScene(prev => (prev >= totalScenes ? 1 : prev + 1))
      }, 5000)
    }
    return () => clearInterval(timer)
  }, [isPlaying])

  const activeData = scriptData[currentScene - 1]

  return (
    <div style={{ padding: Spacing.md, backgroundColor: Colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

      {/* Header Bar */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: '14px 20px', borderRadius: BorderRadius.lg, border: `1px solid ${Colors.border}`, ...Shadows.sm, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {onBack && (
            <button onClick={onBack} style={{ background: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, fontSize: 13, color: Colors.textPrimary }}>
              <Icons.Back size={16} /> Exit Video
            </button>
          )}
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary }}>🎬 VyaparSetu Official SaaS Marketing Video</div>
            <div style={{ fontSize: 11, color: Colors.textSecondary }}>High-converting 60-second video screenplay & interactive visual preview</div>
          </div>
        </div>

        {/* Language Switcher */}
        <div style={{ display: 'flex', gap: 6, backgroundColor: Colors.background, padding: 4, borderRadius: 8, border: `1px solid ${Colors.border}` }}>
          <button
            onClick={() => setLanguage('HI')}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: language === 'HI' ? Colors.primary : 'transparent', color: language === 'HI' ? '#fff' : Colors.textSecondary, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
          >
            🇮🇳 Hindi / Hinglish
          </button>
          <button
            onClick={() => setLanguage('EN')}
            style={{ padding: '6px 12px', borderRadius: 6, border: 'none', backgroundColor: language === 'EN' ? Colors.primary : 'transparent', color: language === 'EN' ? '#fff' : Colors.textSecondary, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}
          >
            🌐 English
          </button>
        </div>
      </div>

      {/* 📺 VIDEO STAGE PLAYER FRAME */}
      <div style={{
        width: '100%', maxWidth: 960, aspectRatio: '16/9', backgroundColor: '#0F172A', borderRadius: BorderRadius.xl,
        border: '3px solid #334155', boxShadow: '0 20px 50px rgba(0,0,0,0.4)', padding: 32, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', position: 'relative', overflow: 'hidden', color: '#F8FAFC',
      }}>
        {/* Top Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ backgroundColor: 'rgba(13,148,136,0.2)', border: '1px solid #0D9488', padding: '6px 14px', borderRadius: 20, color: '#2DD4BF', fontSize: 12, fontWeight: 800 }}>
            {activeData.badge}
          </div>
          <div style={{ fontSize: 28 }}>{activeData.icon}</div>
        </div>

        {/* Center Screen Content */}
        <div style={{ margin: 'auto 0' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#FFFFFF', lineHeight: 1.25, marginBottom: 12 }}>
            {activeData.title}
          </div>
          <div style={{ fontSize: 20, color: '#CBD5E1', fontWeight: 600, lineHeight: 1.5 }}>
            "{activeData.subtitle}"
          </div>

          {activeData.mockup && (
            <div style={{ marginTop: 20, backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: 12, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#38BDF8' }}>{activeData.mockup.heading}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 2 }}>{activeData.mockup.detail}</div>
              </div>
              <span style={{ fontSize: 24, backgroundColor: '#0D9488', padding: '8px 14px', borderRadius: 10 }}>⚡</span>
            </div>
          )}

          {activeData.cta && (
            <div style={{ marginTop: 20, backgroundColor: 'rgba(13,148,136,0.2)', border: '2px solid #0D9488', borderRadius: 12, padding: 14, fontSize: 18, fontWeight: 900, color: '#2DD4BF', textAlign: 'center' }}>
              {activeData.cta}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748B', fontWeight: 700 }}>
          <span>VyaparSetu Official Marketing Video • Scene {currentScene} of {totalScenes}</span>
          <span>1080p 60fps Presentation</span>
        </div>
      </div>

      {/* 🕹️ CONTROLS & TIMELINE BAR */}
      <div style={{
        width: '100%', maxWidth: 960, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: '14px 20px',
        border: `1px solid ${Colors.border}`, ...Shadows.sm, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: isPlaying ? Colors.warning : Colors.primary,
            color: '#fff', fontWeight: 900, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {isPlaying ? '⏸ Pause Video' : '▶ Play Video Presentation'}
        </button>

        {/* Scene Selector Chips */}
        <div style={{ display: 'flex', gap: 6, flex: 1, justifyContent: 'center' }}>
          {[1, 2, 3, 4, 5, 6].map(sNum => (
            <button
              key={sNum}
              onClick={() => { setCurrentScene(sNum); setIsPlaying(false) }}
              style={{
                width: 34, height: 34, borderRadius: 8, border: currentScene === sNum ? `2px solid ${Colors.primary}` : `1px solid ${Colors.border}`,
                backgroundColor: currentScene === sNum ? Colors.primaryLight : Colors.background,
                color: currentScene === sNum ? Colors.primary : Colors.textSecondary,
                fontWeight: 800, fontSize: 12, cursor: 'pointer',
              }}
            >
              S{sNum}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 700, color: Colors.textSecondary }}>
          Scene {currentScene} / 6
        </div>
      </div>
    </div>
  )
}
