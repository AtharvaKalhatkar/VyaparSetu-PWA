import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/VyaparSetu-PWA/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Vyapar Setu — GST Accounting & Business Management',
        short_name: 'Vyapar Setu',
        description: 'GST invoicing, inventory, accounting & business management for Indian businesses. GSTR-1/3B, stock management, billing & more.',
        theme_color: '#2B5DC2',
        background_color: '#F5F6FA',
        display: 'standalone',
        start_url: '/VyaparSetu-PWA/',
        icons: [
          { src: '/logo.png', sizes: '192x192', type: 'image/png' },
          { src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
  server: { port: 5173, open: true },
})
