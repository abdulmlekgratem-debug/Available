import { Billboard } from '@/types'
import { getDaysRemaining, parseExpiryDate } from './dateUtils'
export const UPCOMING_DAYS = 20
export function availabilityStatus(b: Billboard): 'available' | 'soon' | 'booked' {
  const days = getDaysRemaining(b.expiryDate)
  if (days !== null) return days <= 0 ? 'available' : days <= UPCOMING_DAYS ? 'soon' : 'booked'
  return b.status === 'متاح' ? 'available' : 'booked'
}
export function matchesAvailability(b: Billboard, period: string, strict = false): boolean {
  const status = availabilityStatus(b)
  if (period === 'all') return true
  if (period === 'available-now') return status === 'available'
  if (period === 'available') return status === 'available' || (!strict && status === 'soon')
  if (period === 'soon') return status === 'soon'
  if (period === 'booked') return status === 'booked'
  if (period.startsWith('month-')) {
    const expiry = parseExpiryDate(b.expiryDate)
    const [, month, year] = period.split('-')
    return status === 'booked' && !!expiry && expiry.getMonth() + 1 === Number(month) && expiry.getFullYear() === Number(year)
  }
  return false
}
