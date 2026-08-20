import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Colors, Spacing, BorderRadius, Shadows } from '../theme'
import { Icons } from '../utils/Icons'
import { DB } from '../utils/storage'
import { formatCurrency, generateId } from '../utils/formatting'
import { useToast } from '../utils/smooth'
import { toBaseQty } from '../utils/invoiceOps'

interface Agent {
  id: string
  name: string
  role: string
  avatar: string
  status: 'IDLE' | 'WORKING' | 'DONE' | 'NEEDS_INPUT'
  activeTask?: string
  color: string
}

interface AgentLog {
  id: string
  timestamp: string
  agentName: string
  agentRole: string
  avatar: string
  message: string
  type: 'INFO' | 'ACTION' | 'SUCCESS' | 'WARNING'
}

interface TaskResult {
  id: string
  title: string
  summary: string
  details?: any
  actionType?: 'CREATE_PO' | 'WHATSAPP_REMINDERS' | 'VIEW_REPORT' | 'ADJUST_STOCK'
  actionLabel?: string
  data?: any
}

export function AiOfficeTeam({ navigate }: { navigate: (page: string, params?: Record<string, string>) => void }) {
  const { toast } = useToast()
  const [customTask, setCustomTask] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [activeAgentId, setActiveAgentId] = useState<string | null>(null)
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [result, setResult] = useState<TaskResult | null>(null)
  const logEndRef = useRef<HTMLDivElement>(null)

  // Real DB Data for Agents to inspect
  const items = useMemo(() => DB.items.list(), [])
  const parties = useMemo(() => DB.parties.list(), [])
  const invoices = useMemo(() => DB.invoices.list(), [])

  // Virtual Office Team Members
  const [agents, setAgents] = useState<Agent[]>([
    { id: 'inv', name: 'Vikram Patel', role: 'Inventory & Reorder Mgr', avatar: '📦', status: 'IDLE', color: '#059669' },
    { id: 'sales', name: 'Rajesh Kumar', role: 'Sales & Margin Specialist', avatar: '📊', status: 'IDLE', color: '#0D9488' },
    { id: 'tax', name: 'Priya Sharma', role: 'GST & Compliance Officer', avatar: '📜', status: 'IDLE', color: '#7C3AED' },
    { id: 'coll', name: 'Ananya Verma', role: 'Collections & Ledger Mgr', avatar: '👤', status: 'IDLE', color: '#D97706' },
    { id: 'exec', name: 'Office Manager AI', role: 'Team Lead & Orchestrator', avatar: '🤖', status: 'IDLE', color: '#2563EB' },
  ])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const addLog = (agentName: string, agentRole: string, avatar: string, message: string, type: 'INFO' | 'ACTION' | 'SUCCESS' | 'WARNING' = 'INFO') => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, { id: generateId(), timestamp: time, agentName, agentRole, avatar, message, type }])
  }

  // Multi-Agent Task Execution Simulator
  const runAgentTask = async (taskType: string, inputPrompt?: string) => {
    if (isExecuting) return
    setIsExecuting(true)
    setLogs([])
    setResult(null)

    // Reset Agent statuses
    setAgents(prev => prev.map(a => ({ ...a, status: 'WORKING', activeTask: 'Receiving instructions...' })))

    const mgr = agents.find(a => a.id === 'exec')!
    addLog(mgr.name, mgr.role, mgr.avatar, `Received multi-agent task directive: "${inputPrompt || taskType}"`, 'INFO')

    await new Promise(r => setTimeout(r, 600))

    if (taskType.includes('STOCK') || taskType.includes('LOW')) {
      // Inventory Task
      setActiveAgentId('inv')
      const invAgent = agents.find(a => a.id === 'inv')!
      addLog(invAgent.name, invAgent.role, invAgent.avatar, `Scanning database inventory across ${items.length} product SKUs...`, 'INFO')

      await new Promise(r => setTimeout(r, 800))

      const lowStockItems = items.filter(i => i.currentStock <= (i.minStockLevel || 10))
      if (lowStockItems.length > 0) {
        addLog(invAgent.name, invAgent.role, invAgent.avatar, `Found ${lowStockItems.length} items below minimum reorder threshold: ${lowStockItems.map(i => i.name).join(', ')}`, 'WARNING')
        
        await new Promise(r => setTimeout(r, 700))
        const salesAgent = agents.find(a => a.id === 'sales')!
        addLog(salesAgent.name, salesAgent.role, salesAgent.avatar, `Calculating recommended reorder quantities based on past sales velocity...`, 'INFO')

        await new Promise(r => setTimeout(r, 800))
        const taxAgent = agents.find(a => a.id === 'tax')!
        addLog(taxAgent.name, taxAgent.role, taxAgent.avatar, `Applying HSN codes and 18% GST tax estimates for supplier purchase order...`, 'INFO')

        await new Promise(r => setTimeout(r, 700))
        addLog(mgr.name, mgr.role, mgr.avatar, `Task complete! Generated recommended Purchase Order for ${lowStockItems.length} items.`, 'SUCCESS')

        setResult({
          id: generateId(),
          title: '📦 Low Stock Purchase Order Ready',
          summary: `Drafted reorder plan for ${lowStockItems.length} low-stock items.`,
          details: lowStockItems.map(i => ({ name: i.name, stock: i.currentStock, unit: i.unit, reorderQty: 50, estCost: (i.purchasePrice || 0) * 50 })),
          actionType: 'CREATE_PO',
          actionLabel: 'Create Draft Purchase Invoice',
          data: lowStockItems,
        })
      } else {
        addLog(invAgent.name, invAgent.role, invAgent.avatar, `All ${items.length} items are healthy with stock above minimum thresholds!`, 'SUCCESS')
        setResult({
          id: generateId(),
          title: '✅ Inventory Health Good',
          summary: 'No immediate reorders required. All items have adequate stock levels.',
        })
      }
    } else if (taskType.includes('PAYMENT') || taskType.includes('OVERDUE') || taskType.includes('REMINDER')) {
      // Collections Task
      setActiveAgentId('coll')
      const collAgent = agents.find(a => a.id === 'coll')!
      addLog(collAgent.name, collAgent.role, collAgent.avatar, `Auditing customer party ledgers for unpaid balances...`, 'INFO')

      await new Promise(r => setTimeout(r, 900))

      const overdueParties = parties.map(p => {
        const partyDueInvoices = invoices.filter(i => i.partyId === p.id && (i.dueAmount || 0) > 0)
        const totalDue = (p.openingBalance || 0) + partyDueInvoices.reduce((s, i) => s + (i.dueAmount || 0), 0)
        return { ...p, totalDue }
      }).filter(p => p.totalDue > 0)

      if (overdueParties.length > 0) {
        addLog(collAgent.name, collAgent.role, collAgent.avatar, `Found ${overdueParties.length} parties with pending balance totaling ${formatCurrency(overdueParties.reduce((s, p) => s + p.totalDue, 0))}`, 'WARNING')

        await new Promise(r => setTimeout(r, 700))
        const taxAgent = agents.find(a => a.id === 'tax')!
        addLog(taxAgent.name, taxAgent.role, taxAgent.avatar, `Cross-referencing payment terms & GST ledger status for overdue invoices...`, 'INFO')

        await new Promise(r => setTimeout(r, 800))
        addLog(mgr.name, mgr.role, mgr.avatar, `Drafted payment reminder messages with UPI payment links for ${overdueParties.length} customers.`, 'SUCCESS')

        setResult({
          id: generateId(),
          title: '📜 WhatsApp Payment Reminders Prepared',
          summary: `${overdueParties.length} customers owe a total of ${formatCurrency(overdueParties.reduce((s, p) => s + p.totalDue, 0))}.`,
          details: overdueParties.map(p => ({ name: p.name, phone: p.phone, due: p.totalDue })),
          actionType: 'WHATSAPP_REMINDERS',
          actionLabel: 'Open Payment Reminders Page',
        })
      } else {
        addLog(collAgent.name, collAgent.role, collAgent.avatar, `Zero overdue balances found. All party accounts are settled!`, 'SUCCESS')
        setResult({
          id: generateId(),
          title: '✅ All Ledgers Clear',
          summary: 'No pending customer debts found.',
        })
      }
    } else if (taskType.includes('PROFIT') || taskType.includes('MARGIN') || taskType.includes('AUDIT')) {
      // Sales & Margin Task
      setActiveAgentId('sales')
      const salesAgent = agents.find(a => a.id === 'sales')!
      addLog(salesAgent.name, salesAgent.role, salesAgent.avatar, `Analyzing bill-wise profitability across ${invoices.length} invoices...`, 'INFO')

      await new Promise(r => setTimeout(r, 900))

      let totalRevenue = 0
      let totalCost = 0
      const saleInvoices = invoices.filter(i => i.type === 'SALE' || i.docType === 'SALE')

      saleInvoices.forEach(inv => {
        totalRevenue += (inv.grandTotal || 0)
        inv.items?.forEach(li => {
          const dbItem = items.find(a => a.id === li.itemId)
          if (dbItem) {
            const baseQty = toBaseQty(dbItem, li.quantity, li.unit)
            totalCost += baseQty * (dbItem.purchasePrice || 0)
          }
        })
      })

      const netProfit = totalRevenue - totalCost
      addLog(salesAgent.name, salesAgent.role, salesAgent.avatar, `Total Sales Revenue: ${formatCurrency(totalRevenue)} | Total Cost Price: ${formatCurrency(totalCost)}`, 'INFO')

      await new Promise(r => setTimeout(r, 700))
      addLog(mgr.name, mgr.role, mgr.avatar, `Bill-wise profit audit completed! Net Profit: ${formatCurrency(netProfit)} (Margin: ${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%)`, 'SUCCESS')

      setResult({
        id: generateId(),
        title: '📊 Business Profit Audit Report',
        summary: `Analyzed ${saleInvoices.length} sales invoices. Total Net Profit: ${formatCurrency(netProfit)}.`,
        details: [
          { label: 'Total Revenue', value: formatCurrency(totalRevenue) },
          { label: 'Total Cost Price', value: formatCurrency(totalCost) },
          { label: 'Net Profit', value: formatCurrency(netProfit) },
          { label: 'Net Profit Margin', value: `${totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0}%` },
        ],
        actionType: 'VIEW_REPORT',
        actionLabel: 'Open Full Profit & Loss Report',
      })
    } else {
      // General Task
      setActiveAgentId('exec')
      addLog(mgr.name, mgr.role, mgr.avatar, `Delegating instruction to specialized AI staff...`, 'INFO')
      await new Promise(r => setTimeout(r, 800))
      addLog(mgr.name, mgr.role, mgr.avatar, `Completed analysis for "${inputPrompt || taskType}". All business systems aligned!`, 'SUCCESS')
      setResult({
        id: generateId(),
        title: '🤖 Task Execution Complete',
        summary: `Processed custom directive: "${inputPrompt || taskType}".`,
      })
    }

    setAgents(prev => prev.map(a => ({ ...a, status: 'DONE', activeTask: undefined })))
    setIsExecuting(false)
  }

  const handleAction = () => {
    if (!result?.actionType) return
    if (result.actionType === 'CREATE_PO') {
      navigate('purchase')
      toast('Opened New Purchase order screen with pre-filled low stock items!', 'info')
    } else if (result.actionType === 'WHATSAPP_REMINDERS') {
      navigate('reminders')
    } else if (result.actionType === 'VIEW_REPORT') {
      navigate('profitloss')
    }
  }

  return (
    <div style={{ padding: Spacing.md, backgroundColor: Colors.background, minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, padding: '16px 20px', borderRadius: BorderRadius.lg, border: `1px solid ${Colors.border}`, ...Shadows.sm }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #7C3AED, #2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
            🤖
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900, color: Colors.textPrimary }}>VIRTUAL AI OFFICE TEAM</div>
            <div style={{ fontSize: 12, color: Colors.textSecondary }}>Autonomous multi-agent workforce managing sales, tax, inventory & debt collections</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: Colors.primaryLight, padding: '6px 14px', borderRadius: BorderRadius.round, border: `1px solid ${Colors.primary}30` }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: Colors.success }}></span>
          <span style={{ fontSize: 12, fontWeight: 800, color: Colors.primary }}>5 Agents Active</span>
        </div>
      </div>

      {/* 🏢 TEAM DESKS GRID */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: Colors.textSecondary, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
          OFFICE TEAM MEMBERS & LIVE STATUS
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
          {agents.map(agent => (
            <div
              key={agent.id}
              style={{
                backgroundColor: Colors.surface, border: activeAgentId === agent.id ? `2px solid ${agent.color}` : `1px solid ${Colors.border}`,
                borderRadius: BorderRadius.md, padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
                transition: 'all 0.2s ease', ...Shadows.sm,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 28 }}>{agent.avatar}</span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6,
                  backgroundColor: agent.status === 'WORKING' ? '#FEF3C7' : agent.status === 'DONE' ? Colors.successLight : '#F1F5F9',
                  color: agent.status === 'WORKING' ? Colors.warning : agent.status === 'DONE' ? Colors.success : Colors.textSecondary,
                }}>
                  {agent.status}
                </span>
              </div>

              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary }}>{agent.name}</div>
                <div style={{ fontSize: 11, color: Colors.textSecondary, fontWeight: 600 }}>{agent.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ⚡ TASK DISPATCHER & QUICK PRESETS */}
      <div style={{ backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 16, border: `1px solid ${Colors.border}`, ...Shadows.sm }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: Colors.textPrimary, marginBottom: 10 }}>
          ⚡ Assign Directive to Office Team
        </div>

        {/* Quick Presets */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            disabled={isExecuting}
            onClick={() => runAgentTask('LOW_STOCK', 'Scan low stock items and draft Purchase Order')}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${Colors.border}`, backgroundColor: Colors.background, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: Colors.textPrimary }}
          >
            📦 Scan Low Stock & Draft Purchase Order
          </button>

          <button
            disabled={isExecuting}
            onClick={() => runAgentTask('REMINDERS', 'Find overdue payment balances & draft WhatsApp reminders')}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${Colors.border}`, backgroundColor: Colors.background, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: Colors.textPrimary }}
          >
            📜 Audit Debtors & Draft WhatsApp Reminders
          </button>

          <button
            disabled={isExecuting}
            onClick={() => runAgentTask('PROFIT', 'Audit sales invoices and compute net profit margin')}
            style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${Colors.border}`, backgroundColor: Colors.background, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: Colors.textPrimary }}
          >
            📊 Audit Bill-Wise Profit Margins
          </button>
        </div>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            value={customTask}
            onChange={e => setCustomTask(e.target.value)}
            placeholder="Or write custom directive (e.g. Check DAP 50kg stock and calculate profit)..."
            style={{ flex: 1, backgroundColor: Colors.background, border: `1px solid ${Colors.border}`, borderRadius: 8, padding: '10px 14px', fontSize: 13, color: Colors.textPrimary, outline: 'none' }}
          />
          <button
            disabled={isExecuting || !customTask.trim()}
            onClick={() => { runAgentTask('CUSTOM', customTask); setCustomTask('') }}
            style={{
              padding: '10px 20px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
              color: '#fff', fontWeight: 800, fontSize: 13, cursor: isExecuting ? 'not-allowed' : 'pointer', opacity: isExecuting ? 0.6 : 1,
            }}
          >
            {isExecuting ? 'Team Working...' : 'Assign Task 🚀'}
          </button>
        </div>
      </div>

      {/* 📜 LIVE AGENT WORKSTREAM LOG & RESULT CARD */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>

        {/* Left: Workstream Terminal Log */}
        <div style={{ flex: 1.2, minWidth: 320, backgroundColor: '#0F172A', borderRadius: BorderRadius.lg, padding: 16, border: '1px solid #334155', minHeight: 300, maxHeight: 420, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#38BDF8', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid #334155', paddingBottom: 8 }}>
            <Icons.Document size={16} /> LIVE MULTI-AGENT WORKSTREAM LOG
          </div>

          {logs.length === 0 ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#64748B', fontSize: 13 }}>
              Select a task preset above or assign a directive to see the AI staff work in real-time.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {logs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 10, fontSize: 12 }}>
                  <span style={{ color: '#64748B', fontFamily: 'monospace', fontSize: 11 }}>[{log.timestamp}]</span>
                  <span style={{ fontSize: 14 }}>{log.avatar}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 800, color: '#F8FAFC' }}>{log.agentName}</span>
                    <span style={{ color: '#94A3B8', marginLeft: 6, fontSize: 11 }}>({log.agentRole})</span>
                    <div style={{ color: log.type === 'SUCCESS' ? '#34D399' : log.type === 'WARNING' ? '#FBBF24' : '#CBD5E1', marginTop: 2, lineHeight: 1.4 }}>
                      {log.message}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>

        {/* Right: Deliverable / Output Action Card */}
        {result && (
          <div style={{ flex: 1, minWidth: 300, backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: 20, border: `2px solid ${Colors.primary}`, ...Shadows.md, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: Colors.textPrimary, marginBottom: 4 }}>
                {result.title}
              </div>
              <div style={{ fontSize: 13, color: Colors.textSecondary, marginBottom: 14 }}>
                {result.summary}
              </div>

              {/* Details table or list */}
              {result.details && Array.isArray(result.details) && (
                <div style={{ backgroundColor: Colors.background, borderRadius: 10, padding: 12, border: `1px solid ${Colors.border}`, maxHeight: 180, overflowY: 'auto', marginBottom: 14 }}>
                  {result.details.map((d: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '6px 0', borderBottom: idx < result.details.length - 1 ? `1px solid ${Colors.border}` : 'none' }}>
                      <span style={{ fontWeight: 700, color: Colors.textPrimary }}>{d.name || d.label}</span>
                      <span style={{ color: Colors.primary, fontWeight: 800 }}>{d.value || `${d.stock} ${d.unit} (Reorder: ${d.reorderQty})`}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {result.actionLabel && (
              <button
                onClick={handleAction}
                style={{
                  width: '100%', padding: '13px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  color: '#fff', fontSize: 14, fontWeight: 900, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(5,150,105,0.3)',
                }}
              >
                ⚡ {result.actionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
