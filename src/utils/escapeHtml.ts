/**
 * HTML escaping utility — prevents XSS when interpolating user/data values into HTML strings.
 */

const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

/**
 * Escapes HTML special characters in a string to prevent XSS injection.
 * Safe for use inside HTML element content and attribute values.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return ''
  return String(str).replace(/[&<>"']/g, (ch) => escapeMap[ch] || ch)
}
