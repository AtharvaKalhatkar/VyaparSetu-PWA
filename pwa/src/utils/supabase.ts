import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 'https://koilfighpscphscmrrxs.supabase.co'
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvaWxmaWdocHNjcGhzY21ycnhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY4OTM0NTgsImV4cCI6MjEwMjQ2OTQ1OH0.zk4yJm32WKzEtetiYm9_lXV22PefxcFPYC9zw6u7sAE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})
