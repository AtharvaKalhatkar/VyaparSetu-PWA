import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react'

interface VirtualListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight: number
  overscan?: number
  getKey: (item: T, index: number) => string | number
  style?: React.CSSProperties
  className?: string
  emptyState?: React.ReactNode
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function VirtualList<T>({
  items, renderItem, itemHeight, overscan = 5, getKey, style, className, emptyState, header, footer
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [footerHeight, setFooterHeight] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(entries => {
      setContainerHeight(entries[0].contentRect.height)
    })
    ro.observe(el)
    setContainerHeight(el.clientHeight)
    return () => ro.disconnect()
  }, [])

  const onScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const totalListHeight = items.length * itemHeight
  const totalHeight = headerHeight + totalListHeight + footerHeight

  const startIndex = Math.max(0, Math.floor((scrollTop - headerHeight) / itemHeight) - overscan)
  const endIndex = Math.min(items.length, Math.ceil((scrollTop - headerHeight + containerHeight) / itemHeight) + overscan)

  const visibleItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  )

  if (items.length === 0) {
    return <div ref={containerRef} style={{ overflow: 'auto', ...style }} className={className}>{header}{emptyState}{footer}</div>
  }

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      style={{ overflow: 'auto', WebkitOverflowScrolling: 'touch', ...style }}
      className={className}
    >
      {header && <div ref={el => { if (el) setHeaderHeight(el.offsetHeight) }}>{header}</div>}
      <div style={{ height: totalListHeight, position: 'relative' }}>
        {visibleItems.map((item, i) => {
          const index = startIndex + i
          return (
            <div
              key={getKey(item, index)}
              style={{
                position: 'absolute', top: index * itemHeight, left: 0, right: 0, height: itemHeight,
              }}
            >
              {renderItem(item, index)}
            </div>
          )
        })}
      </div>
      {footer && <div ref={el => { if (el) setFooterHeight(el.offsetHeight) }}>{footer}</div>}
    </div>
  )
}

export function useFlattenedGroups<T>(
  groups: Record<string, T[]>,
  groupOrder: string[]
): { flat: (T | { __group: string; count: number })[], groupHeights: number } {
  return useMemo(() => {
    const flat: (T | { __group: string; count: number })[] = []
    const groupHeight = 28
    let totalHeight = 0
    for (const key of groupOrder) {
      const items = groups[key]
      if (!items || items.length === 0) continue
      flat.push({ __group: key, count: items.length })
      totalHeight += groupHeight
      flat.push(...items)
      totalHeight += items.length * 56
    }
    return { flat, groupHeights: groupHeight }
  }, [groups, groupOrder])
}
