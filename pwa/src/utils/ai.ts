import { DB } from './storage'
import type { Invoice, InvoiceItem, Party, Item } from '../types'

export interface SmartSuggestion {
  itemId: string
  itemName: string
  sku: string
  suggestedQty: number
  suggestedRate: number
  unit: string
  score: number
  reason: string
}

export interface Forecast {
  month: string
  label: string
  itemId: string
  itemName: string
  unit: string
  predicted: number
  lowerBound: number
  upperBound: number
  historical: number[]
}

export interface CreditRiskScore {
  score: number
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  averageDelayDays: number
  totalOutstanding: number
  missedPayments: number
  onTimeRate: number
}

export interface CashFlowDay {
  date: string
  label: string
  predictedInflow: number
  predictedOutflow: number
  netFlow: number
  confidence: number
}

export interface BundleSuggestion {
  itemId: string
  itemName: string
  frequency: number
  confidence: number
}

export interface Anomaly {
  type: 'HIGH_AMOUNT' | 'LOW_AMOUNT' | 'PRICE_SPIKE' | 'UNUSUAL_QTY' | 'FREQUENT_CHANGE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  invoiceId?: string
  invoiceNo?: string
  itemName?: string
  message: string
  value: number
  expected: number
}

export interface ReminderInsight {
  dayOfWeek: number
  dayLabel: string
  timeOfDay: 'MORNING' | 'AFTERNOON' | 'EVENING'
  payProbability: number
}

const HSN_MAP: { keywords: string[]; hsn: string; gstRate: number; category: string }[] = [
  { keywords: ['rice', 'chawal', 'grain', 'dhaan', 'paddy', 'wheat', 'gehu', 'atta', 'flour', 'aata'], hsn: '1006', gstRate: 5, category: 'Food Grains' },
  { keywords: ['dal', 'pulse', 'lentil', 'chana', 'moong', 'masoor', 'urad', 'toor', 'arhar'], hsn: '0713', gstRate: 5, category: 'Pulses' },
  { keywords: ['sugar', 'cheeni', 'shakkar', 'gur', 'jaggery'], hsn: '1701', gstRate: 5, category: 'Sugar' },
  { keywords: ['tea', 'chai', 'coffee', 'kaapi', 'chaha'], hsn: '0902', gstRate: 5, category: 'Beverages' },
  { keywords: ['milk', 'doodh', 'curd', 'dahi', 'butter', 'makkhan', 'ghee', 'paneer', 'cheese'], hsn: '0401', gstRate: 5, category: 'Dairy' },
  { keywords: ['soap', 'sabun', 'detergent', 'wash', 'cleaner', 'surf', 'nirma'], hsn: '3401', gstRate: 18, category: 'Cleaning' },
  { keywords: ['shampoo', 'conditioner', 'hair oil', 'tel', 'comb', 'kanghi'], hsn: '3305', gstRate: 18, category: 'Personal Care' },
  { keywords: ['paste', 'toothpaste', 'brush', 'manjan', 'dant'], hsn: '3306', gstRate: 18, category: 'Oral Care' },
  { keywords: ['biscuit', 'cookie', 'cracker', 'namkeen', 'chips', 'snack', 'wafers'], hsn: '1905', gstRate: 18, category: 'Snacks' },
  { keywords: ['oil', 'tel', 'cooking oil', 'refined', 'mustard', 'sarson', 'sunflower', 'palm'], hsn: '1507', gstRate: 5, category: 'Cooking Oil' },
  { keywords: ['spice', 'masala', 'turmeric', 'haldi', 'chilli', 'mirch', 'cumin', 'jeera', 'coriander', 'dhaniya', 'garam masala'], hsn: '0910', gstRate: 5, category: 'Spices' },
  { keywords: ['soya', 'sauce', 'vinegar', 'tomato sauce', 'ketchup'], hsn: '2103', gstRate: 12, category: 'Condiments' },
  { keywords: ['cold drink', 'soda', 'juice', 'ras', 'beverage', 'soft drink', 'coke', 'pepsi', 'sprite'], hsn: '2202', gstRate: 18, category: 'Beverages' },
  { keywords: ['cement', 'siment'], hsn: '2523', gstRate: 28, category: 'Construction' },
  { keywords: ['steel', 'saria', 'rod', 'tmt', 'angle', 'pipe'], hsn: '7214', gstRate: 18, category: 'Steel' },
  { keywords: ['paint', 'rang', 'color', 'primer', 'distemper'], hsn: '3208', gstRate: 18, category: 'Paint' },
  { keywords: ['plywood', 'ply', 'board', 'laminate', 'veneer'], hsn: '4412', gstRate: 18, category: 'Wood' },
  { keywords: ['wire', 'cable', 'switch', 'socket', 'fuse', 'breaker', 'mcb'], hsn: '8536', gstRate: 18, category: 'Electrical' },
  { keywords: ['mobile', 'phone', 'smartphone', 'charger', 'adapter', 'earphone', 'headphone'], hsn: '8517', gstRate: 18, category: 'Electronics' },
  { keywords: ['fan', 'pankha', 'cooler', 'ac', 'air conditioner', 'refrigerator', 'fridge', 'washing machine'], hsn: '8414', gstRate: 18, category: 'Appliances' },
  { keywords: ['bulb', 'light', 'lamp', 'led', 'tube', 'batten', 'panel'], hsn: '9405', gstRate: 18, category: 'Lighting' },
  { keywords: ['medicine', 'tablet', 'capsule', 'syrup', 'injection', 'cream', 'ointment'], hsn: '3003', gstRate: 12, category: 'Pharmaceuticals' },
  { keywords: ['book', 'kitab', 'copy', 'notebook', 'pen', 'kalam', 'pencil', 'eraser', 'rubber'], hsn: '4901', gstRate: 5, category: 'Stationery' },
  { keywords: ['furniture', 'table', 'chair', 'kursi', 'almirah', 'cabinet', 'sofa', 'bed'], hsn: '9401', gstRate: 18, category: 'Furniture' },
  { keywords: ['tile', 'floor', 'marble', 'granite', 'ceramic', 'vitrified'], hsn: '6907', gstRate: 18, category: 'Tiles' },
  { keywords: ['sand', 'bajri', 'gitti', 'stone', 'crush', 'aggregate'], hsn: '2505', gstRate: 5, category: 'Construction Material' },
  { keywords: ['brick', 'eet', 'flyash'], hsn: '6901', gstRate: 5, category: 'Bricks' },
  { keywords: ['cloth', 'kapda', 'fabric', 'textile', 'suit', 'saree', 'kurta', 'shirt'], hsn: '5208', gstRate: 5, category: 'Textiles' },
  { keywords: ['toy', 'khilona', 'game', 'doll'], hsn: '9503', gstRate: 18, category: 'Toys' },
  { keywords: ['petrol', 'diesel', 'fuel', 'lubricant', 'grease', 'mobil'], hsn: '2710', gstRate: 18, category: 'Fuel' },
  { keywords: ['battery', 'cell', 'dry cell', 'inverter battery'], hsn: '8507', gstRate: 18, category: 'Batteries' },
  { keywords: ['tyre', 'tire', 'tube', 'ribbed'], hsn: '4011', gstRate: 18, category: 'Automotive' },
  { keywords: ['plastic', 'polythene', 'bag', 'carry bag', 'container', 'bucket'], hsn: '3923', gstRate: 18, category: 'Plastics' },
  { keywords: ['paper', 'kagaj', 'cardboard', 'carton'], hsn: '4801', gstRate: 12, category: 'Paper' },
  { keywords: ['glass', 'khanch', 'mirror', 'sheesha'], hsn: '7005', gstRate: 18, category: 'Glass' },
  { keywords: ['shoe', 'juta', 'chappal', 'slipper', 'sandal', 'footwear'], hsn: '6402', gstRate: 5, category: 'Footwear' },
  { keywords: ['computer', 'laptop', 'printer', 'monitor', 'keyboard', 'mouse', 'hard disk'], hsn: '8471', gstRate: 18, category: 'Computers' },
  { keywords: ['camera', 'cctv', 'dvr', 'nvr', 'security'], hsn: '8525', gstRate: 18, category: 'Security' },
  { keywords: ['gold', 'sona', 'silver', 'chandi', 'jewellery', 'gahna'], hsn: '7108', gstRate: 3, category: 'Jewellery' },
  { keywords: ['pipe', 'pvc', 'cpvc', 'upvc', 'fitting', 'elbow', 'tee', 'coupler'], hsn: '3917', gstRate: 18, category: 'Plumbing' },
  { keywords: ['servic', 'repair', 'labour', 'labour', 'maintenance', 'fitting', 'installation', 'consult'], hsn: '9988', gstRate: 18, category: 'Services' },
]

function monthsBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00'), db = new Date(b + 'T00:00:00')
  return (db.getFullYear() - da.getFullYear()) * 12 + db.getMonth() - da.getMonth()
}

function dateStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function monthLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
}

function exponentialSmoothing(data: number[], alpha = 0.3): number[] {
  if (data.length === 0) return []
  const smoothed: number[] = [data[0]]
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i] + (1 - alpha) * smoothed[i - 1])
  }
  return smoothed
}

export function getSmartSuggestions(partyId: string, type: 'SALE' | 'PURCHASE'): SmartSuggestion[] {
  const invoices = DB.invoices.list()
    .filter(i => i.partyId === partyId && i.type === type)
    .sort((a, b) => b.date.localeCompare(a.date))

  const itemMap = new Map<string, { count: number; lastDate: string; qtys: number[]; rates: number[] }>()

  for (const inv of invoices) {
    for (const item of inv.items) {
      const existing = itemMap.get(item.itemId) || { count: 0, lastDate: '', qtys: [], rates: [] }
      existing.count++
      if (item.itemId && (!existing.lastDate || inv.date > existing.lastDate)) existing.lastDate = inv.date
      existing.qtys.push(item.quantity)
      existing.rates.push(item.rate)
      itemMap.set(item.itemId, existing)
    }
  }

  const today = new Date()
  const scored: SmartSuggestion[] = []
  const dbItems = DB.items.list()

  itemMap.forEach((data, itemId) => {
    const item = dbItems.find(i => i.id === itemId)
    if (!item || !item.isActive || !data.lastDate) return
    const daysSinceLast = Math.max(1, (today.getTime() - new Date(data.lastDate).getTime()) / 86400000)
    const recencyScore = Math.max(0, 1 - daysSinceLast / 365)
    const freqScore = Math.min(1, data.count / 20)
    const avgQty = data.qtys.reduce((s, v) => s + v, 0) / data.qtys.length
    const avgRate = data.rates.reduce((s, v) => s + v, 0) / data.rates.length
    const score = freqScore * 0.5 + recencyScore * 0.3 + Math.min(1, data.count / 10) * 0.2

    let reason = ''
    if (data.count > 10) reason = 'Frequently purchased'
    else if (daysSinceLast < 30) reason = 'Purchased recently'
    else if (data.count > 3) reason = 'Regular item'
    else reason = 'Previously purchased'

    scored.push({
      itemId, itemName: item.name, sku: item.sku,
      suggestedQty: Math.round(avgQty) || 1,
      suggestedRate: Math.round(avgRate) || (type === 'PURCHASE' ? item.purchasePrice : item.sellingPrice),
      unit: item.unit, score: Math.round(score * 100),
      reason,
    })
  })

  return scored.sort((a, b) => b.score - a.score).slice(0, 8)
}

export function getDemandForecast(): Forecast[] {
  const invoices = DB.invoices.list().filter(i => i.type === 'SALE')
  const items = DB.items.list().filter(i => i.isActive)

  const monthlyMap = new Map<string, Map<string, number>>()
  for (const inv of invoices) {
    const key = inv.date.slice(0, 7)
    if (!monthlyMap.has(key)) monthlyMap.set(key, new Map())
    const itemMap = monthlyMap.get(key)!
    for (const item of inv.items) {
      if (item.itemId) itemMap.set(item.itemId, (itemMap.get(item.itemId) || 0) + item.quantity)
    }
  }

  const sortedMonths = Array.from(monthlyMap.keys()).sort()
  if (sortedMonths.length < 2) return []

  const forecasts: Forecast[] = []

  for (const item of items.slice(0, 20)) {
    const historical: number[] = sortedMonths.map(m => monthlyMap.get(m)?.get(item.id) || 0)
    const lastNonZero = historical.filter(v => v > 0).length
    if (lastNonZero < 2) continue

    const smoothed = exponentialSmoothing(historical)
    const lastSmoothed = smoothed[smoothed.length - 1]
    const trend = smoothed.length >= 3 ? (smoothed[smoothed.length - 1] - smoothed[smoothed.length - 3]) / 2 : 0
    const nextVal = Math.max(0, Math.round(lastSmoothed + trend * 0.5))

    const lastMonth = sortedMonths[sortedMonths.length - 1]
    const [y, m] = lastMonth.split('-').map(Number)
    const nextMonth = dateStr(m === 12 ? y + 1 : y, m === 12 ? 0 : m)

    if (nextVal > 0) {
      forecasts.push({
        month: nextMonth,
        label: monthLabel(nextMonth),
        itemId: item.id,
        itemName: item.name,
        unit: item.unit,
        predicted: nextVal,
        lowerBound: Math.max(0, Math.round(nextVal * 0.6)),
        upperBound: Math.round(nextVal * 1.4),
        historical,
      })
    }
  }

  return forecasts.sort((a, b) => b.predicted - a.predicted).slice(0, 10)
}

export function suggestHsnAndGst(itemName: string): { hsn: string; gstRate: number; category: string } {
  const name = itemName.toLowerCase().trim()
  if (!name) return { hsn: '', gstRate: 18, category: '' }

  let best: { hsn: string; gstRate: number; category: string } | null = null
  let bestScore = 0

  for (const entry of HSN_MAP) {
    const matchCount = entry.keywords.filter(k => name.includes(k)).length
    if (matchCount > 0) {
      const score = matchCount / entry.keywords.length
      const exactBonus = entry.keywords.some(k => name === k || name.startsWith(k + ' ') || name.endsWith(' ' + k)) ? 0.3 : 0
      const totalScore = score + exactBonus
      if (totalScore > bestScore) {
        bestScore = totalScore
        best = { hsn: entry.hsn, gstRate: entry.gstRate, category: entry.category }
      }
    }
  }

  return best || { hsn: '', gstRate: 18, category: '' }
}

export function calculateCreditRisk(partyId: string): CreditRiskScore {
  const invoices = DB.invoices.list().filter(i => i.partyId === partyId)
  const ledger = DB.ledger.forParty(partyId)
  const parties = DB.parties.list()
  const party = parties.find(p => p.id === partyId)

  if (invoices.length === 0) {
    return { score: 0, level: 'LOW', averageDelayDays: 0, totalOutstanding: 0, missedPayments: 0, onTimeRate: 1 }
  }

  const payments = ledger.filter(e => e.type === 'RECEIPT' || e.type === 'PAYMENT')
  const paidInvoices = invoices.filter(i => i.paymentStatus === 'PAID')
  let totalDelay = 0, delayedCount = 0

  for (const inv of paidInvoices) {
    const payment = payments.find(p => p.reference === inv.invoiceNo)
    if (payment) {
      const dueDate = inv.dueDate || inv.date
      const delay = (new Date(payment.date).getTime() - new Date(dueDate).getTime()) / 86400000
      if (delay > 0) { totalDelay += delay; delayedCount++ }
    }
  }

  const avgDelay = delayedCount > 0 ? Math.round(totalDelay / delayedCount) : 0
  const totalOutstanding = invoices.filter(i => i.paymentStatus !== 'PAID').reduce((s, i) => s + i.dueAmount, 0)
  const overdueCount = invoices.filter(i => {
    if (i.paymentStatus === 'PAID') return false
    const due = new Date(i.dueDate || i.date)
    return due < new Date()
  }).length

  const onTimeRate = paidInvoices.length > 0 ? (paidInvoices.length - delayedCount) / paidInvoices.length : 1

  let score = 0
  score += Math.min(30, avgDelay * 2)
  score += Math.min(30, overdueCount * 10)
  score += Math.min(20, totalOutstanding > 0 ? Math.round(totalOutstanding / 10000) * 2 : 0)
  score += Math.max(0, (1 - onTimeRate) * 20)
  score = Math.min(100, Math.round(score))

  let level: CreditRiskScore['level'] = 'LOW'
  if (score >= 70) level = 'CRITICAL'
  else if (score >= 50) level = 'HIGH'
  else if (score >= 25) level = 'MEDIUM'

  return { score, level, averageDelayDays: avgDelay, totalOutstanding, missedPayments: overdueCount, onTimeRate }
}

export function predictCashFlow(days: number = 30): CashFlowDay[] {
  const today = new Date()
  const daily: CashFlowDay[] = []

  const invoices = DB.invoices.list()
  const expenses = DB.expenses.list()
  const ledger = DB.ledger.list()

  for (let d = 0; d < days; d++) {
    const date = new Date(today.getTime() + d * 86400000)
    const dateStr = date.toISOString().split('T')[0]
    const dayLabel = date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

    const dueInflows = invoices
      .filter(i => i.type === 'SALE' && i.paymentStatus !== 'PAID' && (i.dueDate === dateStr || i.date === dateStr))
      .reduce((s, i) => s + i.dueAmount, 0)

    const dueOutflows = invoices
      .filter(i => i.type === 'PURCHASE' && i.paymentStatus !== 'PAID' && (i.dueDate === dateStr || i.date === dateStr))
      .reduce((s, i) => s + i.dueAmount, 0)

    const todayExpenses = expenses.filter(e => e.date === dateStr).reduce((s, e) => s + e.amount, 0)

    const predictedInflow = Math.round(dueInflows * 0.7)
    const predictedOutflow = Math.round(dueOutflows + todayExpenses)
    const confidence = d < 7 ? 0.8 : d < 15 ? 0.6 : 0.4

    daily.push({
      date: dateStr, label: dayLabel,
      predictedInflow, predictedOutflow,
      netFlow: predictedInflow - predictedOutflow,
      confidence,
    })
  }

  return daily
}

export function getBundleRecommendations(selectedItemIds: string[], type: 'SALE' | 'PURCHASE' = 'SALE', maxResults: number = 5): BundleSuggestion[] {
  const invoices = DB.invoices.list().filter(i => i.type === type)
  if (invoices.length === 0 || selectedItemIds.length === 0) return []

  const coOccurrence = new Map<string, { count: number; total: number }>()
  const itemFreq = new Map<string, number>()

  for (const inv of invoices) {
    const itemIds = new Set(inv.items.filter(i => i.itemId).map(i => i.itemId))
    for (const id of itemIds) itemFreq.set(id, (itemFreq.get(id) || 0) + 1)

    const selectedInInv = selectedItemIds.filter(id => itemIds.has(id))
    if (selectedInInv.length === 0) continue

    for (const candidate of itemIds) {
      if (selectedItemIds.includes(candidate)) continue
      const prev = coOccurrence.get(candidate) || { count: 0, total: 0 }
      prev.count += selectedInInv.length
      prev.total++
      coOccurrence.set(candidate, prev)
    }
  }

  const dbItems = DB.items.list().filter(i => i.isActive)
  const results: BundleSuggestion[] = []

  coOccurrence.forEach((data, itemId) => {
    const item = dbItems.find(i => i.id === itemId)
    if (!item) return
    const freq = itemFreq.get(itemId) || 1
    const confidence = Math.min(1, data.total / selectedItemIds.length / 3)
    const lift = data.total / (freq / invoices.length)
    if (confidence > 0.05 && lift > 0.5) {
      results.push({
        itemId, itemName: item.name,
        frequency: data.total,
        confidence: Math.round(confidence * 100),
      })
    }
  })

  return results.sort((a, b) => b.confidence - a.confidence).slice(0, maxResults)
}

export function detectAnomalies(recentDays: number = 90): Anomaly[] {
  const anomalies: Anomaly[] = []
  const invoices = DB.invoices.list()
  const cutoff = new Date(Date.now() - recentDays * 86400000).toISOString().split('T')[0]
  const recentInvoices = invoices.filter(i => i.date >= cutoff)

  if (recentInvoices.length < 5) return anomalies

  const perPartyInvoices = new Map<string, Invoice[]>()
  for (const inv of recentInvoices) {
    if (!perPartyInvoices.has(inv.partyId)) perPartyInvoices.set(inv.partyId, [])
    perPartyInvoices.get(inv.partyId)!.push(inv)
  }

  perPartyInvoices.forEach((invList) => {
    const amounts = invList.map(i => i.grandTotal).sort((a, b) => a - b)
    const q1 = amounts[Math.floor(amounts.length * 0.25)]
    const q3 = amounts[Math.floor(amounts.length * 0.75)]
    const iqr = q3 - q1
    const upperFence = q3 + iqr * 2.5
    const lowerFence = Math.max(0, q1 - iqr * 1.5)

    for (const inv of invList) {
      const itemCount = inv.items.length
      if (inv.grandTotal > upperFence && iqr > 0) {
        anomalies.push({
          type: 'HIGH_AMOUNT', severity: inv.grandTotal > q3 + iqr * 4 ? 'HIGH' : 'MEDIUM',
          invoiceId: inv.id, invoiceNo: inv.invoiceNo, itemName: inv.partyName,
          message: `Unusually high invoice: ${inv.invoiceNo} (${inv.partyName}) — ₹${inv.grandTotal.toLocaleString('en-IN')}`,
          value: inv.grandTotal, expected: Math.round(q3),
        })
      }
    }
  })

  const itemPriceVariance = new Map<string, { rates: number[]; names: string[] }>()
  for (const inv of recentInvoices) {
    for (const item of inv.items) {
      if (!item.itemId) continue
      if (!itemPriceVariance.has(item.itemId)) itemPriceVariance.set(item.itemId, { rates: [], names: [] })
      const d = itemPriceVariance.get(item.itemId)!
      d.rates.push(item.rate)
      if (!d.names.includes(item.itemName)) d.names.push(item.itemName)
    }
  }

  itemPriceVariance.forEach((data, itemId) => {
    if (data.rates.length < 3) return
    const avg = data.rates.reduce((s, v) => s + v, 0) / data.rates.length
    const variance = data.rates.reduce((s, v) => s + (v - avg) ** 2, 0) / data.rates.length
    const stdDev = Math.sqrt(variance)
    const cv = avg > 0 ? stdDev / avg : 0

    if (cv > 0.5 && avg > 0) {
      const maxRate = Math.max(...data.rates)
      const minRate = Math.min(...data.rates)
      const spikePct = avg > 0 ? Math.round((maxRate - minRate) / avg * 100) : 0
      anomalies.push({
        type: 'PRICE_SPIKE', severity: spikePct > 100 ? 'HIGH' : 'MEDIUM',
        itemName: data.names[0],
        message: `Price variation of ${spikePct}% detected for "${data.names[0]}" — ₹${minRate} to ₹${maxRate}`,
        value: maxRate, expected: Math.round(avg),
      })
    }
  })

  return anomalies.slice(0, 10)
}

export function getOptimalReminderTime(partyId: string): ReminderInsight {
  const payments = DB.ledger.list().filter(e => (e.type === 'RECEIPT' || e.type === 'PAYMENT') && e.partyId === partyId)

  if (payments.length < 2) {
    return { dayOfWeek: 1, dayLabel: 'Monday', timeOfDay: 'MORNING', payProbability: 0.5 }
  }

  const dayCounts = new Array(7).fill(0)
  for (const p of payments) {
    const d = new Date(p.date + 'T00:00:00')
    dayCounts[d.getDay()]++
  }

  const bestDay = dayCounts.indexOf(Math.max(...dayCounts))
  const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

  const morning = payments.filter(p => p.type === 'RECEIPT').length
  const prob = Math.min(1, payments.length / 20)

  return {
    dayOfWeek: bestDay,
    dayLabel: dayLabels[bestDay],
    timeOfDay: 'MORNING',
    payProbability: Math.round(prob * 100),
  }
}
