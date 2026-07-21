import React, { useState, useRef } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { s } from '../utils/styles'
import { DB } from '../utils/storage'
import { formatCurrency, formatDate, generateId } from '../utils/formatting'
import { Icons } from '../utils/Icons'
import * as XLSX from 'xlsx'

type ExportEntity = 'invoices' | 'parties' | 'items' | 'expenses' | 'employees' | 'leads' | 'units' | 'stockAdjustments' | 'bankAccounts'

interface ImportPreview {
  invoices: number; parties: number; items: number; expenses: number
  employees: number; leads: number; units: number; stockAdjustments: number
  bankAccounts: number; bankTransactions: number
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function toCSV<T>(data: T[], headers: string[], mapper: (item: T) => string[]): string {
  const rows = data.map(mapper)
  return [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n')
}

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let curRow: string[] = []; let cur = ''; let inQ = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]; const next = text[i + 1]
    if (ch === '\r') continue
    if (ch === '"') { if (inQ && next === '"') { cur += '"'; i++ } else inQ = !inQ; continue }
    if ((ch === ',' || ch === '\t') && !inQ) { curRow.push(cur.trim()); cur = ''; continue }
    if (ch === '\n' && !inQ) { curRow.push(cur.trim()); rows.push(curRow); curRow = []; cur = ''; continue }
    cur += ch
  }
  if (cur || curRow.length > 0) { curRow.push(cur.trim()); rows.push(curRow) }
  return rows.filter(r => r.length > 0 && r.some(c => c.length > 0))
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function DataExport() {
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)
  const xlsxRef = useRef<HTMLInputElement>(null)
  const [importData, setImportData] = useState<any>(null)
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [importError, setImportError] = useState('')
  const [clearStep, setClearStep] = useState(0)
  const [bulkItems, setBulkItems] = useState<{ name: string; sku: string; sellingPrice: number; purchasePrice: number; unit: string; gstRate: number; currentStock: number; category: string }[]>([])
  const [bulkImporting, setBulkImporting] = useState(false)
  const [bulkResult, setBulkResult] = useState('')

  const handleExportCSV = (entity: ExportEntity, label: string) => {
    switch (entity) {
      case 'invoices': {
        const data = DB.invoices.list()
        const csv = toCSV(data, ['ID', 'Invoice No', 'Doc Type', 'Party', 'Date', 'Grand Total', 'Status', 'Paid', 'Due'],
          i => [i.id, i.invoiceNo, i.docType, i.partyName, i.date, String(i.grandTotal), i.paymentStatus, String(i.paidAmount), String(i.dueAmount)])
        downloadFile(csv, `${label}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
        break
      }
      case 'parties': {
        const data = DB.parties.list()
        const csv = toCSV(data, ['ID', 'Name', 'Phone', 'Email', 'GSTIN', 'Type', 'Opening Balance', 'Balance Type'],
          p => [p.id, p.name, p.phone, p.email || '', p.gstin || '', p.type, String(p.openingBalance), p.balanceType])
        downloadFile(csv, `${label}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
        break
      }
      case 'items': {
        const data = DB.items.list()
        const csv = toCSV(data, ['ID', 'Name', 'SKU', 'Category', 'Unit', 'Selling Price', 'Purchase Price', 'Stock', 'GST Rate'],
          i => [i.id, i.name, i.sku, i.category || '', i.unit, String(i.sellingPrice), String(i.purchasePrice), String(i.currentStock), String(i.gstRate)])
        downloadFile(csv, `${label}_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
        break
      }
    }
  }

  const handleExportAll = () => {
    const all = {
      invoices: DB.invoices.list(),
      parties: DB.parties.list(),
      items: DB.items.list(),
      expenses: DB.expenses.list(),
      employees: DB.employees.list(),
      leads: DB.crm.list(),
      units: DB.units.list(),
      stockAdjustments: DB.stockAdjustments.list(),
      bankAccounts: DB.bankAccounts.list(),
      bankTransactions: DB.bankTransactions.list(),
      settings: DB.settings.get(),
      businessProfile: DB.businessProfile.get(),
    }
    const json = JSON.stringify(all, null, 2)
    downloadFile(json, `vyapar_backup_${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError('')
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        const keys = ['invoices', 'parties', 'items', 'expenses', 'employees', 'leads', 'units', 'stockAdjustments', 'bankAccounts', 'bankTransactions']
        const missing = keys.filter(k => !Array.isArray(data[k]))
        if (missing.length > 0 && !data.settings && !data.businessProfile) {
          setImportError('Invalid backup file format')
          return
        }
        setImportData(data)
        setPreview({
          invoices: data.invoices?.length || 0,
          parties: data.parties?.length || 0,
          items: data.items?.length || 0,
          expenses: data.expenses?.length || 0,
          employees: data.employees?.length || 0,
          leads: data.leads?.length || 0,
          units: data.units?.length || 0,
          stockAdjustments: data.stockAdjustments?.length || 0,
          bankAccounts: data.bankAccounts?.length || 0,
          bankTransactions: data.bankTransactions?.length || 0,
        })
      } catch {
        setImportError('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const downloadSampleCSV = () => {
    const csv = 'Name,SKU,Selling Price,Purchase Price,Unit,GST Rate,Stock,Category\n"Sample Item 1","SKU001",100,80,Pcs,18,50,Category1\n"Sample Item 2","SKU002",200,150,Kg,12,30,Category2'
    downloadFile(csv, 'sample_items_import.csv', 'text/csv')
  }

  const handleBulkCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const rows = parseCSV(reader.result as string)
        if (rows.length < 2) { setBulkResult('File is empty'); return }
        const headers = rows[0].map(h => h.toLowerCase().replace(/[^a-z]/g, ''))
        const items = rows.slice(1).map(row => {
          const get = (key: string) => { const idx = headers.indexOf(key); return idx >= 0 && idx < row.length ? row[idx] : '' }
          return {
            name: get('name') || 'Imported Item',
            sku: get('sku') || 'SKU-' + Date.now().toString(36).toUpperCase(),
            sellingPrice: parseFloat(get('sellingprice')) || 0,
            purchasePrice: parseFloat(get('purchaseprice')) || 0,
            unit: get('unit') || 'Pcs',
            gstRate: parseFloat(get('gstrate')) || 0,
            currentStock: parseInt(get('stock')) || 0,
            category: get('category') || '',
          }
        }).filter(i => i.sellingPrice > 0 || i.name !== 'Imported Item')
        setBulkItems(items)
        setBulkResult(`Found ${items.length} items. Click "Import All" to add them to inventory.`)
      } catch { setBulkResult('Error parsing CSV file') }
    }
    reader.readAsText(file)
  }

  const handleBulkImport = () => {
    bulkItems.forEach(item => {
      DB.items.save({
        id: generateId(), name: item.name, sku: item.sku || 'SKU-' + Date.now().toString(36).toUpperCase(),
        unit: item.unit, sellingPrice: item.sellingPrice, purchasePrice: item.purchasePrice,
        gstRate: item.gstRate, currentStock: item.currentStock, minStockLevel: 10, isActive: true,
        category: item.category || undefined, barcode: undefined,
      })
    })
    setBulkResult(`✅ ${bulkItems.length} items imported successfully!`)
    setBulkItems([]); if (csvRef.current) csvRef.current.value = ''; if (xlsxRef.current) xlsxRef.current.value = ''
  }

  const handleBulkJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        const items = Array.isArray(data) ? data : (data.items || [])
        if (items.length === 0) { setBulkResult('No items found in JSON'); return }
        const mapped = items.map((i: any) => ({
          name: i.name || 'Imported Item',
          sku: i.sku || i.SKU || 'SKU-' + Date.now().toString(36).toUpperCase(),
          sellingPrice: i.sellingPrice || i.selling_price || i.price || 0,
          purchasePrice: i.purchasePrice || i.purchase_price || i.cost || 0,
          unit: i.unit || 'Pcs',
          gstRate: i.gstRate || i.gst_rate || i.tax || 0,
          currentStock: i.currentStock || i.stock || i.quantity || 0,
          category: i.category || '',
        }))
        setBulkItems(mapped)
        setBulkResult(`Found ${mapped.length} items. Click "Import All" to add them.`)
      } catch { setBulkResult('Error parsing JSON file') }
    }
    reader.readAsText(file)
  }

  const handleBulkExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const wb = XLSX.read(reader.result as ArrayBuffer, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' })
        if (json.length === 0) { setBulkResult('Excel file is empty'); return }
        const headers = Object.keys(json[0]).map(h => h.toLowerCase().replace(/[^a-z]/g, ''))
        const get = (row: any, keys: string[]) => { for (const k of keys) { const idx = headers.indexOf(k); if (idx >= 0) { const v = Object.values(row)[idx]; if (v !== '' && v !== undefined) return v } } return '' }
        const mapped = json.map((row: any) => ({
          name: String(get(row, ['name', 'itemname', 'item', 'product', 'productname', 'description']) || 'Imported Item'),
          sku: String(get(row, ['sku', 'itemcode', 'code', 'barcode']) || 'SKU-' + Date.now().toString(36).toUpperCase()),
          sellingPrice: parseFloat(String(get(row, ['sellingprice', 'sellingprice', 'price', 'rate', 'saleprice', 'mrp'])) || '0'),
          purchasePrice: parseFloat(String(get(row, ['purchaseprice', 'cost', 'buyingprice', 'purchaseprice', 'landingcost'])) || '0'),
          unit: String(get(row, ['unit', 'uom', 'measurementunit', 'units']) || 'Pcs'),
          gstRate: parseFloat(String(get(row, ['gstrate', 'gst', 'taxrate', 'tax', 'gstpercent', 'gstpercentage'])) || '0'),
          currentStock: parseFloat(String(get(row, ['stock', 'currentstock', 'quantity', 'qty', 'openingstock', 'inventory'])) || '0'),
          category: String(get(row, ['category', 'categories', 'group', 'type', 'productgroup']) || ''),
        }))
        setBulkItems(mapped)
        setBulkResult(`Found ${mapped.length} items from Excel. Click "Import All" to add them.`)
      } catch { setBulkResult('Error parsing Excel file. Ensure it has headers in the first row.') }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleRestore = () => {
    if (!importData) return
    const d = importData
    const save = (key: string, data: any) => {
      try { localStorage.setItem('vs_' + key, JSON.stringify(data)) } catch (e) { console.error('restore failed for', key, e) }
    }
    if (d.invoices) save('invoices', d.invoices)
    if (d.parties) save('parties', d.parties)
    if (d.items) save('items', d.items)
    if (d.expenses) save('expenses', d.expenses)
    if (d.employees) save('employees', d.employees)
    if (d.leads) save('crm', d.leads)
    if (d.units) save('units', d.units)
    if (d.stockAdjustments) save('stockAdj', d.stockAdjustments)
    if (d.bankAccounts) save('bankAccounts', d.bankAccounts)
    if (d.bankTransactions) save('bankTxns', d.bankTransactions)
    if (d.settings) save('settings', d.settings)
    if (d.businessProfile) save('bizProfile', d.businessProfile)
    setImportData(null); setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    alert('Data restored successfully!')
  }

  const handleClearAll = () => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith('vs_'))
      keys.forEach(k => localStorage.removeItem(k))
    } catch (e) { console.error('clear all failed', e) }
    setClearStep(0)
    alert('All data cleared successfully!')
  }

  let lastBackup: string | null = null
  try { lastBackup = localStorage.getItem('vs_lastBackup') } catch {}
  const backupTime = lastBackup ? Math.floor((Date.now() - parseInt(lastBackup)) / 3600000) : null

  const handleBackupNow = () => {
    handleExportAll()
    try { localStorage.setItem('vs_lastBackup', String(Date.now())) } catch (e) { console.error('failed to save backup timestamp', e) }
  }

  const sizeEstimate = (): string => {
    const all = {
      invoices: DB.invoices.list(), parties: DB.parties.list(), items: DB.items.list(),
      expenses: DB.expenses.list(), employees: DB.employees.list(), leads: DB.crm.list(),
      units: DB.units.list(), stockAdjustments: DB.stockAdjustments.list(),
      bankAccounts: DB.bankAccounts.list(), bankTransactions: DB.bankTransactions.list(),
    }
    return formatBytes(new Blob([JSON.stringify(all)]).size)
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      {/* Export Data */}
      <div style={{ ...s.card, marginBottom: Spacing.lg }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm, display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <Icons.Download size={18} color={Colors.primary} /> Export Data
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm }}>
          <div style={{ fontSize: 12, color: Colors.textSecondary }}>Estimated backup size: {sizeEstimate()}</div>
          <div style={{ fontSize: 11, color: backupTime !== null && backupTime < 24 ? Colors.success : backupTime !== null ? Colors.warning : Colors.textDisabled }}>
            {backupTime !== null ? `Last backup: ${backupTime < 1 ? '<1h' : `${backupTime}h`} ago` : 'Never backed up'}
          </div>
        </div>
        <button onClick={handleBackupNow} style={{ width: '100%', padding: '12px', backgroundColor: Colors.primary, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: Spacing.md, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Icons.Download size={16} /> Backup Now (Full JSON)
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: Spacing.sm, marginBottom: Spacing.sm }}>
          <button onClick={() => handleExportCSV('invoices', 'Invoices')} style={{ padding: '12px', backgroundColor: Colors.primary + '10', border: `1px solid ${Colors.primary}30`, borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 500, color: Colors.primary, cursor: 'pointer', textAlign: 'center' }}>Export Invoices (CSV)</button>
          <button onClick={() => handleExportCSV('parties', 'Parties')} style={{ padding: '12px', backgroundColor: Colors.success + '10', border: `1px solid ${Colors.success}30`, borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 500, color: Colors.success, cursor: 'pointer', textAlign: 'center' }}>Export Parties (CSV)</button>
          <button onClick={() => handleExportCSV('items', 'Items')} style={{ padding: '12px', backgroundColor: Colors.accent + '10', border: `1px solid ${Colors.accent}30`, borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 500, color: Colors.accent, cursor: 'pointer', textAlign: 'center' }}>Export Items (CSV)</button>
          <button onClick={handleExportAll} style={{ padding: '12px', backgroundColor: Colors.warning + '10', border: `1px solid ${Colors.warning}30`, borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 500, color: Colors.warning, cursor: 'pointer', textAlign: 'center' }}>Export All (JSON)</button>
        </div>
      </div>

      {/* Bulk Import Items */}
      <div style={{ ...s.card, marginBottom: Spacing.lg }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm, display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <Icons.Billing size={18} color={Colors.success} /> Bulk Import Items
        </div>
        <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>
          Import multiple products at once from a CSV or JSON file.
        </div>
        <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm }}>
          Supported formats: CSV, TSV, Excel (.xlsx / .xls), JSON
        </div>
        <div style={{ display: 'flex', gap: Spacing.sm, marginBottom: Spacing.md, flexWrap: 'wrap' }}>
          <button onClick={downloadSampleCSV} style={{ flex: 1, minWidth: 100, padding: '10px', backgroundColor: Colors.primary + '10', border: `1px solid ${Colors.primary}30`, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 500, color: Colors.primary, cursor: 'pointer', textAlign: 'center' }}>Download Sample</button>
          <label style={{ flex: 1, minWidth: 90, padding: '10px', backgroundColor: Colors.accent + '10', border: `1px solid ${Colors.accent}30`, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 500, color: Colors.accent, cursor: 'pointer', textAlign: 'center', display: 'block' }}>
            CSV/TSV
            <input ref={csvRef} type="file" accept=".csv,.tsv,.txt" onChange={handleBulkCSV} style={{ display: 'none' }} />
          </label>
          <label style={{ flex: 1, minWidth: 90, padding: '10px', backgroundColor: '#1B5E20' + '15', border: `1px solid #1B5E2030`, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 500, color: '#1B5E20', cursor: 'pointer', textAlign: 'center', display: 'block' }}>
            Excel
            <input ref={xlsxRef} type="file" accept=".xlsx,.xls" onChange={handleBulkExcel} style={{ display: 'none' }} />
          </label>
          <label style={{ flex: 1, minWidth: 90, padding: '10px', backgroundColor: Colors.warning + '10', border: `1px solid ${Colors.warning}30`, borderRadius: BorderRadius.sm, fontSize: 12, fontWeight: 500, color: Colors.warning, cursor: 'pointer', textAlign: 'center', display: 'block' }}>
            JSON
            <input type="file" accept=".json" onChange={handleBulkJSON} style={{ display: 'none' }} />
          </label>
        </div>
        {bulkResult && (
          <div style={{ fontSize: 13, color: bulkResult.includes('✅') ? Colors.success : Colors.textPrimary, marginBottom: Spacing.sm }}>{bulkResult}</div>
        )}
        {bulkItems.length > 0 && (
          <div style={{ backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md }}>
            <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.sm, maxHeight: 150, overflowY: 'auto' }}>
              {bulkItems.slice(0, 20).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', fontSize: 11 }}>
                  <span>{item.name}</span>
                  <span>{item.sku} · ₹{item.sellingPrice} · Stock: {item.currentStock}</span>
                </div>
              ))}
              {bulkItems.length > 20 && <div style={{ fontSize: 11, color: Colors.textDisabled, marginTop: 4 }}>...and {bulkItems.length - 20} more</div>}
            </div>
            <button onClick={handleBulkImport} style={{ ...s.primaryBtn, marginTop: Spacing.sm }}>
              Import All {bulkItems.length} Items
            </button>
          </div>
        )}
      </div>

      {/* Import / Restore */}
      <div style={{ ...s.card, marginBottom: Spacing.lg }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm, display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <Icons.Billing size={18} color={Colors.secondary} /> Import / Restore
        </div>
        <input ref={fileRef} type="file" accept=".json" onChange={handleFileChange} style={{ marginBottom: Spacing.md, fontSize: 13 }} />
        {importError && <div style={{ color: Colors.error, fontSize: 13, marginBottom: Spacing.sm }}>{importError}</div>}
        {preview && (
          <div style={{ backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.md }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: Colors.textPrimary, marginBottom: Spacing.sm }}>Preview - items to be restored:</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              <span>Invoices: {preview.invoices}</span>
              <span>Parties: {preview.parties}</span>
              <span>Items: {preview.items}</span>
              <span>Expenses: {preview.expenses}</span>
              <span>Employees: {preview.employees}</span>
              <span>Leads: {preview.leads}</span>
              <span>Units: {preview.units}</span>
              <span>Stock Adj: {preview.stockAdjustments}</span>
              <span>Bank Accounts: {preview.bankAccounts}</span>
              <span>Bank Txns: {preview.bankTransactions}</span>
            </div>
            <button onClick={handleRestore} style={{ ...s.primaryBtn, marginTop: Spacing.md }}>
              Restore Data ({preview.invoices + preview.parties + preview.items + preview.expenses + preview.employees + preview.leads + preview.units + preview.stockAdjustments + preview.bankAccounts + preview.bankTransactions} records)
            </button>
          </div>
        )}
      </div>

      {/* Clear Data */}
      <div style={{ ...s.card, borderColor: clearStep > 0 ? Colors.error : Colors.border }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: clearStep > 0 ? Colors.error : Colors.textPrimary, marginBottom: Spacing.sm, display: 'flex', alignItems: 'center', gap: Spacing.sm }}>
          <Icons.Delete size={18} color={clearStep > 0 ? Colors.error : Colors.textSecondary} /> Clear Data
        </div>
        <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md }}>
          This will permanently erase all your business data including invoices, parties, items, and settings.
        </div>
        {clearStep === 0 && (
          <button onClick={() => setClearStep(1)} style={{ padding: '12px', backgroundColor: Colors.error, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%' }}>
            Clear All Data
          </button>
        )}
        {clearStep === 1 && (
          <div>
            <div style={{ fontSize: 13, color: Colors.error, fontWeight: 600, marginBottom: Spacing.sm }}>
              Are you sure? This action cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: Spacing.sm }}>
              <button onClick={() => setClearStep(0)} style={{ flex: 1, padding: '12px', background: 'none', border: `1px solid ${Colors.border}`, borderRadius: BorderRadius.sm, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleClearAll} style={{ flex: 1, padding: '12px', backgroundColor: Colors.error, color: Colors.textLight, border: 'none', borderRadius: BorderRadius.sm, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Yes, Clear Everything</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
