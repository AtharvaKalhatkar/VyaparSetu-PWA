import { useState, useRef, useCallback, useEffect } from 'react'
import { Colors } from '../theme'

export function usePullToRefresh(onRefresh: () => void) {
  const [pulling, setPulling] = useState(false)
  const [pullDist, setPullDist] = useState(0)
  const startY = useRef(0)
  const refreshing = useRef(false)

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (refreshing.current) return
    const el = e.currentTarget
    if (el.scrollTop > 0) return
    startY.current = e.touches[0].clientY
    setPulling(true)
  }, [])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing.current) return
    const dist = Math.max(0, (e.touches[0].clientY - startY.current) * 0.5)
    setPullDist(Math.min(dist, 120))
    if (dist > 80) {
      refreshing.current = true
      setPulling(false)
      setPullDist(0)
      onRefresh()
      setTimeout(() => { refreshing.current = false }, 500)
    }
  }, [pulling, onRefresh])

  const onTouchEnd = useCallback(() => {
    setPulling(false)
    setPullDist(0)
  }, [])

  const pullIndicator = pulling || pullDist > 0 ? (
    <div style={{
      height: pullDist, display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', transition: pulling ? 'none' : 'height 0.3s',
      fontSize: 12, color: Colors.textSecondary, gap: 6,
    }}>
      <span style={{
        display: 'inline-block', transform: `rotate(${pullDist * 3}deg)`,
        transition: 'transform 0.1s', fontSize: 16,
      }}>↓</span>
      {pullDist > 80 ? 'Release to refresh' : 'Pull to refresh'}
    </div>
  ) : null

  return { pullIndicator, onTouchStart, onTouchMove, onTouchEnd, pullHandlers: { onTouchStart, onTouchMove, onTouchEnd } }
}
