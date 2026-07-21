import React, { useState } from 'react'
import { Colors, Spacing, BorderRadius } from '../theme'
import { s } from '../utils/styles'
import { Icons } from '../utils/Icons'
import { useToast } from '../utils/smooth'
import { DB } from '../utils/storage'
import { generateId } from '../utils/formatting'

export function BackupRestore() {
  const { toast } = useToast()
  const [importing, setImporting] = useState(false)

  const handleExport = () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('vs_'))
    const data: Record<string, any> = {}
    keys.forEach(k => {
      try { data[k] = JSON.parse(localStorage.getItem(k) || '') }
      catch { data[k] = localStorage.getItem(k) }
    })
    const blob = new Blob([JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), data }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `vyapar-setu-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast('Backup downloaded successfully!', 'success')
    DB.auditLogs.save({ id: generateId(), entity: 'SYSTEM', entityId: '', action: 'CREATE', user: 'Admin', timestamp: new Date().toISOString(), description: 'Data backup exported' })
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const text = await file.text()
        const backup = JSON.parse(text)
        if (!backup.data || !backup.version) { toast('Invalid backup file', 'error'); setImporting(false); return }
        if (!confirm('This will OVERWRITE all current data. Continue?')) { setImporting(false); return }
        Object.entries(backup.data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value))
        })
        toast(`Restored ${Object.keys(backup.data).length} data sets! Please refresh the app.`, 'success')
        DB.auditLogs.save({ id: generateId(), entity: 'SYSTEM', entityId: '', action: 'CREATE', user: 'Admin', timestamp: new Date().toISOString(), description: 'Data backup imported' })
      } catch { toast('Failed to import backup', 'error') }
      setImporting(false)
    }
    input.click()
  }

  return (
    <div style={{ padding: Spacing.lg, paddingBottom: 80 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: Colors.textPrimary, marginBottom: Spacing.xs }}>Backup & Restore</div>
      <div style={{ fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.lg }}>Export your data to a file or restore from a previous backup</div>

      <div style={{ ...s.card, marginBottom: Spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: Spacing.md }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.successLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.success }}><Icons.Download size={22} /></div>
          <div><div style={{ fontWeight: 600, fontSize: 15, color: Colors.textPrimary }}>Export Backup</div><div style={{ fontSize: 12, color: Colors.textSecondary }}>Download all your data as a JSON file</div></div>
        </div>
        <button onClick={handleExport} style={s.primaryBtn}><Icons.Download size={16} /> Export Data</button>
      </div>

      <div style={{ ...s.card, marginBottom: Spacing.lg }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: Spacing.md }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.warningLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: Colors.warning }}><Icons.Upload size={22} /></div>
          <div><div style={{ fontWeight: 600, fontSize: 15, color: Colors.textPrimary }}>Import Backup</div><div style={{ fontSize: 12, color: Colors.textSecondary }}>Restore data from a previous backup file</div></div>
        </div>
        <button onClick={handleImport} disabled={importing} style={importing ? s.primaryBtnDisabled : { ...s.primaryBtn, backgroundColor: Colors.warning }}><Icons.Upload size={16} /> {importing ? 'Restoring...' : 'Restore Data'}</button>
      </div>

      <div style={{ ...s.card, backgroundColor: Colors.primaryLight, borderColor: Colors.primary + '30' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: Colors.primary, marginBottom: Spacing.sm }}>⚠️ Important</div>
        <div style={{ fontSize: 12, color: Colors.textSecondary, lineHeight: 1.5 }}>
          • Backup includes all companies, invoices, items, parties, expenses & settings<br />
          • Import will OVERWRITE all existing data<br />
          • Always keep backups in a safe location
        </div>
      </div>
    </div>
  )
}
