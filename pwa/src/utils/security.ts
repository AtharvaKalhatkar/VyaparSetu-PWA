/**
 * Security & Data Hashing Utilities for Vyapar Setu
 */

/**
 * SHA-256 hash for employee PIN storage
 */
export async function hashPin(pin: string): Promise<string> {
  if (!pin.trim()) return ''
  const encoder = new TextEncoder()
  const data = encoder.encode(pin.trim() + '_vs_salt_2026')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Basic HTML sanitizer to prevent DOM XSS injection in raw print frames
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
}
