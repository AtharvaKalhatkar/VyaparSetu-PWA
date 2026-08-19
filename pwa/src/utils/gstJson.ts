import { DB } from './storage'
import type { Invoice, Party } from '../types'

export interface Gstr1B2bInvoice {
  inum: string
  idt: string
  val: number
  pos: string
  rchrg: string
  inv_typ: string
  itms: {
    num: number
    itm_det: {
      txval: number
      rt: number
      iamt: number
      camt: number
      samt: number
      csamt: number
    }
  }[]
}

export interface Gstr1B2bSection {
  ctin: string
  inv: Gstr1B2bInvoice[]
}

export interface Gstr1B2csItem {
  sply_ty: 'INTRA' | 'INTER'
  rt: number
  typ: 'OE'
  pos: string
  txval: number
  iamt: number
  camt: number
  samt: number
  csamt: number
}

export interface Gstr1HsnItem {
  num: number
  hsn_sc: string
  desc: string
  uqc: string
  qty: number
  val: number
  txval: number
  iamt: number
  camt: number
  samt: number
  csamt: number
}

export interface Gstr1GovtPayload {
  gstin: string
  fp: string // MMYYYY e.g., "082026"
  gt: number
  cur_gt: number
  b2b: Gstr1B2bSection[]
  b2cs: Gstr1B2csItem[]
  hsn: {
    data: Gstr1HsnItem[]
  }
}

function formatDateGovt(isoDate: string): string {
  // YYYY-MM-DD to DD-MM-YYYY
  const parts = isoDate.split('-')
  if (parts.length !== 3) return isoDate
  return `${parts[2]}-${parts[1]}-${parts[0]}`
}

function formatPeriodGovt(yearMonth: string): string {
  // YYYY-MM to MMYYYY
  const [y, m] = yearMonth.split('-')
  return `${m}${y}`
}

export function generateGstr1Json(monthStr: string): Gstr1GovtPayload {
  const profile = DB.businessProfile.get()
  const gstin = profile.gstin || '29ABCDE1234F1Z5'
  const stateCode = gstin.slice(0, 2) || '29'

  const [y, m] = monthStr.split('-').map(Number)
  const monthStart = `${y}-${String(m).padStart(2, '0')}-01`
  const monthEnd = new Date(y, m, 0).toISOString().split('T')[0]

  const sales = DB.invoices.list().filter(i => (i.type === 'SALE' || i.docType === 'SALE') && i.date >= monthStart && i.date <= monthEnd)
  const parties = DB.parties.list()
  const partyMap = new Map<string, Party>(parties.map(p => [p.id, p]))

  const b2bMap = new Map<string, Gstr1B2bInvoice[]>()
  const b2csMap = new Map<string, Gstr1B2csItem>()
  const hsnMap = new Map<string, Gstr1HsnItem>()

  let grandTotalSales = 0

  sales.forEach(inv => {
    grandTotalSales += inv.grandTotal
    const party = partyMap.get(inv.partyId)
    const partyGstin = party?.gstin?.trim()
    const isB2B = !!partyGstin

    const partyState = isB2B ? partyGstin.slice(0, 2) : stateCode
    const isInterState = partyState !== stateCode

    // Items processing
    inv.items.forEach((item, idx) => {
      const lineTaxable = Math.round((item.amount - (item.discountAmount || 0)) * 100) / 100
      const lineTax = Math.round((lineTaxable * item.gstRate) / 100 * 100) / 100

      const iamt = isInterState ? lineTax : 0
      const camt = !isInterState ? Math.round((lineTax / 2) * 100) / 100 : 0
      const samt = !isInterState ? Math.round((lineTax / 2) * 100) / 100 : 0

      if (isB2B) {
        // B2B Section
        if (!b2bMap.has(partyGstin)) b2bMap.set(partyGstin, [])
        const existingPartyInvs = b2bMap.get(partyGstin)!
        let existingInv = existingPartyInvs.find(i => i.inum === inv.invoiceNo)

        if (!existingInv) {
          existingInv = {
            inum: inv.invoiceNo,
            idt: formatDateGovt(inv.date),
            val: inv.grandTotal,
            pos: partyState,
            rchrg: 'N',
            inv_typ: 'R',
            itms: [],
          }
          existingPartyInvs.push(existingInv)
        }

        existingInv.itms.push({
          num: idx + 1,
          itm_det: {
            txval: lineTaxable,
            rt: item.gstRate,
            iamt,
            camt,
            samt,
            csamt: 0,
          },
        })
      } else {
        // B2C Small Section
        const key = `${isInterState ? 'INTER' : 'INTRA'}_${item.gstRate}_${partyState}`
        const existing = b2csMap.get(key)
        if (existing) {
          existing.txval += lineTaxable
          existing.iamt += iamt
          existing.camt += camt
          existing.samt += samt
        } else {
          b2csMap.set(key, {
            sply_ty: isInterState ? 'INTER' : 'INTRA',
            rt: item.gstRate,
            typ: 'OE',
            pos: partyState,
            txval: lineTaxable,
            iamt,
            camt,
            samt,
            csamt: 0,
          })
        }
      }

      // HSN Summary
      const hsnCode = item.sku || '9988'
      const existingHsn = hsnMap.get(hsnCode)
      if (existingHsn) {
        existingHsn.qty += item.quantity
        existingHsn.val += item.amount
        existingHsn.txval += lineTaxable
        existingHsn.iamt += iamt
        existingHsn.camt += camt
        existingHsn.samt += samt
      } else {
        hsnMap.set(hsnCode, {
          num: hsnMap.size + 1,
          hsn_sc: hsnCode,
          desc: item.itemName,
          uqc: item.unit || 'OTH',
          qty: item.quantity,
          val: item.amount,
          txval: lineTaxable,
          iamt,
          camt,
          samt,
          csamt: 0,
        })
      }
    })
  })

  const b2b: Gstr1B2bSection[] = Array.from(b2bMap.entries()).map(([ctin, inv]) => ({
    ctin,
    inv,
  }))

  const b2cs = Array.from(b2csMap.values()).map(item => ({
    ...item,
    txval: Math.round(item.txval * 100) / 100,
    iamt: Math.round(item.iamt * 100) / 100,
    camt: Math.round(item.camt * 100) / 100,
    samt: Math.round(item.samt * 100) / 100,
  }))

  const hsnData = Array.from(hsnMap.values()).map((h, i) => ({
    ...h,
    num: i + 1,
    txval: Math.round(h.txval * 100) / 100,
    val: Math.round(h.val * 100) / 100,
    iamt: Math.round(h.iamt * 100) / 100,
    camt: Math.round(h.camt * 100) / 100,
    samt: Math.round(h.samt * 100) / 100,
  }))

  return {
    gstin,
    fp: formatPeriodGovt(monthStr),
    gt: Math.round(grandTotalSales * 100) / 100,
    cur_gt: Math.round(grandTotalSales * 100) / 100,
    b2b,
    b2cs,
    hsn: {
      data: hsnData,
    },
  }
}

export function downloadGstr1Json(monthStr: string) {
  const data = generateGstr1Json(monthStr)
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `GSTR1_${data.gstin}_${data.fp}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
