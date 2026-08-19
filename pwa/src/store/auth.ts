import { useState, useCallback } from 'react'
import { DB } from '../utils/storage'
import { syncAccountOnLogin } from '../utils/cloudSync'

export function useAuth() {
  const [loggedIn, setLoggedIn] = useState(localStorage.getItem('vs_loggedIn') === 'true')
  const [userName, setUserName] = useState(localStorage.getItem('vs_userName') || '')
  const [businessName, setBusinessName] = useState(localStorage.getItem('vs_businessName') || '')
  const [userRole, setUserRole] = useState<'ADMIN' | 'SALES' | 'VIEWER'>((localStorage.getItem('vs_userRole') as any) || 'ADMIN')

  const login = useCallback((name: string, biz: string, bizType?: string, role?: 'ADMIN' | 'SALES' | 'VIEWER') => {
    localStorage.setItem('vs_loggedIn', 'true')
    localStorage.setItem('vs_userName', name)
    localStorage.setItem('vs_businessName', biz)
    const finalRole = role || 'ADMIN'
    localStorage.setItem('vs_userRole', finalRole)
    if (bizType && bizType !== '__EMPLOYEE__') {
      const profile = DB.businessProfile.get()
      DB.businessProfile.save({ ...profile, businessName: biz, ownerName: name, businessType: bizType as any })
    }
    setLoggedIn(true); setUserName(name); setBusinessName(biz); setUserRole(finalRole)
    syncAccountOnLogin(biz).then(count => {
      if (count > 0) {
        console.log(`Successfully synced ${count} cloud records for ${biz}`)
        window.location.reload()
      }
    })
  }, [])

  const setRole = useCallback((role: 'ADMIN' | 'SALES' | 'VIEWER') => {
    localStorage.setItem('vs_userRole', role)
    setUserRole(role)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('vs_loggedIn')
    localStorage.removeItem('vs_userName')
    localStorage.removeItem('vs_businessName')
    localStorage.removeItem('vs_userRole')
    setLoggedIn(false); setUserName(''); setBusinessName(''); setUserRole('ADMIN')
  }, [])

  return { loggedIn, userName, businessName, userRole, login, logout, setRole }
}
