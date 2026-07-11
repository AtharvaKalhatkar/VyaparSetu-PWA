import { DB } from './storage'

export function formatCurrency(n: number): string {
  if (!isFinite(n)) return '₹0.00'
  const sym = DB.settings.get().currencySymbol || '₹'
  const abs = Math.abs(n)
  const formatted = abs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return (n < 0 ? '-' : '') + sym + formatted
}

export function formatDate(d: string): string {
  if (!d) return ''
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatPhone(p: string): string {
  if (!p || p.length < 10) return p || ''
  return p.slice(0, 5) + ' ' + p.slice(5, 10)
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10).padEnd(8, '0')
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function nextInvoiceNo(existingNos: string[], prefix: string): string {
  let max = 0
  existingNos.forEach(no => {
    const match = no.match(new RegExp('^' + prefix + '-(\\d+)$'))
    if (match) { const n = parseInt(match[1], 10); if (n > max) max = n }
  })
  return prefix + '-' + String(max + 1).padStart(3, '0')
}

export function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening'
}
