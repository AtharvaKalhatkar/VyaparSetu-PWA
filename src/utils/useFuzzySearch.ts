import { useMemo } from 'react'

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 0)
}

function scoreItem(query: string, text: string): number {
  if (!query || !text) return 0
  const q = query.toLowerCase()
  const t = text.toLowerCase()
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.includes(q)) return 60
  const queryTokens = tokenize(query)
  const textTokens = tokenize(text)
  let score = 0
  for (const qt of queryTokens) {
    for (const tt of textTokens) {
      if (tt === qt) score += 30
      else if (tt.startsWith(qt)) score += 20
      else if (tt.includes(qt)) score += 10
      else {
        let qi = 0
        for (let ti = 0; ti < tt.length && qi < qt.length; ti++) {
          if (tt[ti] === qt[qi]) qi++
        }
        if (qi === qt.length) score += 8
      }
    }
  }
  return score
}

export function useFuzzySearch<T extends object>(
  items: T[],
  query: string,
  fields: (keyof T)[],
  threshold = 5,
  maxResults = 200
): T[] {
  return useMemo(() => {
    if (!query.trim()) return items.slice(0, maxResults)
    const scored = items.map(item => {
      let score = 0
      for (const field of fields) {
        const val = (item as any)[field]
        if (val != null) {
          score += scoreItem(query, String(val))
        }
      }
      return { item, score }
    })
    return scored
      .filter(s => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, maxResults)
      .map(s => s.item)
  }, [items, query, fields, threshold, maxResults])
}
