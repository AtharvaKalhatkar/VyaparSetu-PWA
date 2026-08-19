import { supabase } from './supabase'

/**
 * Cloud Multi-Device Synchronization Engine for Vyapar Setu
 * Synchronizes local data between PC, Mobile, and Web clients.
 */

export function getAccountSyncKey(businessName?: string): string {
  const name = businessName || localStorage.getItem('vs_businessName') || 'default_business'
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `vs_account_${slug}`
}

/**
 * Collect all business keys starting with vs_
 */
export function getLocalBusinessSnapshot(): Record<string, any> {
  const snapshot: Record<string, any> = {}
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('vs_')) {
      try {
        snapshot[key] = JSON.parse(localStorage.getItem(key) || '')
      } catch {
        snapshot[key] = localStorage.getItem(key)
      }
    }
  }
  return snapshot
}

/**
 * Restore a snapshot into localStorage
 */
export function applyBusinessSnapshot(snapshot: Record<string, any>): number {
  let count = 0
  Object.entries(snapshot).forEach(([key, val]) => {
    if (key.startsWith('vs_')) {
      localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val))
      count++
    }
  })
  return count
}

/**
 * Push current device data to Supabase Cloud
 */
export async function pushDataToCloud(businessName?: string): Promise<boolean> {
  try {
    const syncKey = getAccountSyncKey(businessName)
    const data = getLocalBusinessSnapshot()
    const payload = {
      account_key: syncKey,
      updated_at: new Date().toISOString(),
      payload: data,
    }

    const { error } = await supabase
      .from('vs_cloud_sync')
      .upsert([payload], { onConflict: 'account_key' })

    if (error) {
      console.warn('Supabase table vs_cloud_sync upsert notice:', error.message)
      // Store secondary local backup fallback
      localStorage.setItem(`vs_cloud_backup_${syncKey}`, JSON.stringify(payload))
      return false
    }
    return true
  } catch (err) {
    console.error('Cloud sync push error:', err)
    return false
  }
}

/**
 * Pull latest data from Supabase Cloud onto device
 */
export async function pullDataFromCloud(businessName?: string): Promise<{ success: boolean; restoredCount: number }> {
  try {
    const syncKey = getAccountSyncKey(businessName)
    const { data, error } = await supabase
      .from('vs_cloud_sync')
      .select('payload, updated_at')
      .eq('account_key', syncKey)
      .single()

    if (error || !data || !data.payload) {
      // Try local cloud backup fallback
      const cached = localStorage.getItem(`vs_cloud_backup_${syncKey}`)
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed && parsed.payload) {
          const count = applyBusinessSnapshot(parsed.payload)
          return { success: true, restoredCount: count }
        }
      }
      return { success: false, restoredCount: 0 }
    }

    const count = applyBusinessSnapshot(data.payload)
    return { success: true, restoredCount: count }
  } catch (err) {
    console.error('Cloud sync pull error:', err)
    return { success: false, restoredCount: 0 }
  }
}

/**
 * Execute automatic 2-way sync on Login / App Launch
 */
export async function syncAccountOnLogin(businessName: string): Promise<number> {
  if (!businessName) return 0
  // First attempt to pull remote records from PC
  const pullResult = await pullDataFromCloud(businessName)
  // Then push latest merged state
  await pushDataToCloud(businessName)
  return pullResult.restoredCount
}
