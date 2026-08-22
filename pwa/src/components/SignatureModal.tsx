import React, { useRef, useState, useEffect } from 'react'
import { Colors, BorderRadius, Shadows } from '../theme'
import { Icons } from '../utils/Icons'

export function SignatureModal({
  open,
  onClose,
  onSave,
  initialSignature,
}: {
  open: boolean
  onClose: () => void
  onSave: (signatureDataUrl: string) => void
  initialSignature?: string
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Setup high resolution canvas sizing
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * 2
    canvas.height = rect.height * 2
    ctx.scale(2, 2)

    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Fill white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Load initial signature if present
    if (initialSignature) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height)
        setHasDrawn(true)
      }
      img.src = initialSignature
    }
  }, [open, initialSignature])

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.setPointerCapture(e.pointerId)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    setIsDrawing(true)
    setHasDrawn(true)
  }

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {}
    }
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const rect = canvas.getBoundingClientRect()
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, rect.width, rect.height)
    setHasDrawn(false)
  }

  const handleSave = () => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawn) {
      alert('Please draw your signature first!')
      return
    }
    const dataUrl = canvas.toDataURL('image/png')
    onSave(dataUrl)
    onClose()
  }

  if (!open) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.85)',
      zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 12, backdropFilter: 'blur(4px)',
    }}>
      <div style={{
        backgroundColor: Colors.surface, borderRadius: 16,
        width: '94vw', maxWidth: 640, height: '80vh', maxHeight: 440,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        animation: 'popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <style>{`@keyframes popIn { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: scale(1); } }`}</style>
        
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px', borderBottom: `1px solid ${Colors.border}`,
          backgroundColor: Colors.surfaceVariant,
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
              ✍️ Draw Digital Signature
            </div>
            <div style={{ fontSize: 11, color: Colors.textSecondary, marginTop: 2 }}>
              Sign with your finger or stylus on the canvas below
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: Colors.textMuted, cursor: 'pointer' }}>
            <Icons.Close size={22} />
          </button>
        </div>

        {/* Horizontal Drawing Canvas Frame */}
        <div style={{ flex: 1, padding: 12, backgroundColor: '#F1F5F9', position: 'relative', display: 'flex' }}>
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerCancel={stopDrawing}
            style={{
              width: '100%', height: '100%', backgroundColor: '#FFFFFF',
              borderRadius: BorderRadius.sm, border: `2px dashed ${Colors.primary}`,
              touchAction: 'none', cursor: 'crosshair',
            }}
          />
          <div style={{
            position: 'absolute', right: 24, bottom: 24, pointerEvents: 'none',
            fontSize: 11, fontWeight: 700, color: Colors.textMuted, opacity: 0.6,
          }}>
            ✍️ Sign Here
          </div>
        </div>

        {/* Action Controls */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderTop: `1px solid ${Colors.border}`,
          backgroundColor: Colors.surface, gap: 10,
        }}>
          <button onClick={clearCanvas} style={{
            padding: '10px 16px', backgroundColor: Colors.dangerBg, color: Colors.danger,
            border: `1px solid ${Colors.danger}30`, borderRadius: BorderRadius.sm,
            fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            🗑️ Clear
          </button>

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              padding: '10px 16px', backgroundColor: 'transparent', color: Colors.textSecondary,
              border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm,
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSave} style={{
              padding: '10px 22px', backgroundColor: Colors.primary, color: '#fff',
              border: 'none', borderRadius: BorderRadius.sm,
              fontSize: 13, fontWeight: 900, cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
            }}>
              Save Signature
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
