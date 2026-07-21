import React, { createContext, useContext } from 'react'
import { DB } from '../utils/storage'
import type { VerticalConfig, BusinessType } from '../verticals/types'
import { VERTICAL_MAP, defaultConfig } from '../verticals'

const VerticalContext = createContext<VerticalConfig>(defaultConfig)

export function VerticalProvider({ children }: { children: React.ReactNode }) {
  const profile = DB.businessProfile.get()
  const bizType = (profile as any).businessType as BusinessType | undefined
  const config = (bizType && VERTICAL_MAP[bizType]) || defaultConfig
  return <VerticalContext.Provider value={config}>{children}</VerticalContext.Provider>
}

export function useVertical() {
  return useContext(VerticalContext)
}

export function t(config: VerticalConfig, key: keyof VerticalConfig['terms'], fallback: string): string {
  return config.terms[key] ?? fallback
}