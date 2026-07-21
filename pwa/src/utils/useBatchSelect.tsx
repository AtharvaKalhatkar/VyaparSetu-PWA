import React, { useState, useCallback, useMemo } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'

export function useBatchSelect<T extends { id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const toggle = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(items.map(i => i.id)))
  }, [items])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds])

  const allSelected = items.length > 0 && selectedIds.size === items.length
  const someSelected = selectedIds.size > 0

  const selectedItems = useMemo(
    () => items.filter(i => selectedIds.has(i.id)),
    [items, selectedIds]
  )

  const toggleAll = useCallback(() => {
    if (allSelected) clearSelection()
    else selectAll()
  }, [allSelected, selectAll, clearSelection])

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    toggle,
    selectAll,
    clearSelection,
    isSelected,
    allSelected,
    someSelected,
    toggleAll,
  }
}

export interface BatchAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  color?: string
  danger?: boolean
}

export function BatchActionBar({
  selectedCount,
  actions,
  onClear,
  children,
}: {
  selectedCount: number
  actions: BatchAction[]
  onClear: () => void
  children?: React.ReactNode
}) {
  if (selectedCount === 0) return null

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: Spacing.md, right: Spacing.md,
      backgroundColor: Colors.textPrimary, borderRadius: BorderRadius.md,
      padding: '8px 12px', display: 'flex', alignItems: 'center', gap: Spacing.sm,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)', zIndex: 200,
      animation: 'vySlideUp 0.2s ease-out',
    }}>
      <button onClick={onClear} style={{
        background: 'none', border: 'none', color: '#fff', cursor: 'pointer',
        fontSize: 13, fontWeight: 600, padding: '4px 8px', whiteSpace: 'nowrap',
        display: 'flex', alignItems: 'center', gap: 4,
      }}>
        <span style={{ width: 20, height: 20, borderRadius: 10, border: '2px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✕</span>
        {selectedCount} selected
      </button>
      <div style={{ flex: 1 }} />
      {children}
      {actions.map((action, i) => (
        <button
          key={i}
          onClick={action.onClick}
          style={{
            padding: '6px 12px', border: 'none', borderRadius: 6, cursor: 'pointer',
            fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
            backgroundColor: action.danger ? Colors.error : action.color || Colors.primary,
            color: '#fff', display: 'flex', alignItems: 'center', gap: 4,
          }}
        >
          {action.icon}{action.label}
        </button>
      ))}
    </div>
  )
}
