/**
 * خدمة تحميل Google Sheets مرة واحدة - Unified Sheet Loader
 * يتم تحميل الملف مرة واحدة فقط ثم تُقرأ الصفحات منه
 */

import type * as XLSX from 'xlsx'
const loadXlsx = () => import('xlsx')

const SHEET_URL = import.meta.env.VITE_SHEET_CSV_URL || "https://docs.google.com/spreadsheets/d/1adhOR9DcIiu4Q63EH--TdMinnUU3QtEp/export?format=csv&gid=0"
const XLSX_URL = import.meta.env.VITE_SHEET_XLSX_URL || "https://docs.google.com/spreadsheets/d/1adhOR9DcIiu4Q63EH--TdMinnUU3QtEp/export?format=xlsx"

const CACHE_KEY = 'gf_wb_v2'
const CACHE_TTL = 30 * 60 * 1000 // 30 دقيقة

// workbook محمّل في الذاكرة للجلسة الحالية
let cachedWorkbook: XLSX.WorkBook | null = null
let loadPromise: Promise<XLSX.WorkBook> | null = null

interface CachedData {
  timestamp: number
  type: 'csv' | 'xlsx'
  data: string // CSV text or base64-encoded XLSX
}

/**
 * محاولة قراءة workbook من sessionStorage
 */
async function getFromCache(): Promise<XLSX.WorkBook | null> {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached: CachedData = JSON.parse(raw)
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      sessionStorage.removeItem(CACHE_KEY)
      return null
    }
    if (cached.type === 'csv') {
      return (await loadXlsx()).read(cached.data, { type: 'string' })
    }
    // XLSX as base64
    return (await loadXlsx()).read(cached.data, { type: 'base64' })
  } catch {
    return null
  }
}

/**
 * حفظ البيانات في sessionStorage
 */
function saveToCache(type: 'csv' | 'xlsx', data: string) {
  try {
    const cached: CachedData = { timestamp: Date.now(), type, data }
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(cached))
  } catch {
    // تجاهل أخطاء storage (حجم كبير مثلاً)
  }
}

/**
 * تحويل ArrayBuffer إلى base64
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * تحميل workbook من الإنترنت (XLSX مباشرة - يحتوي جميع الصفحات)
 */
async function fetchWorkbook(): Promise<XLSX.WorkBook> {
  // 1) محاولة XLSX أولاً (يحتوي جميع الصفحات)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20000)
    const res = await fetch(XLSX_URL, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      if (buffer.byteLength > 500) {
        // حفظ كـ base64 في sessionStorage
        saveToCache('xlsx', arrayBufferToBase64(buffer))
        return (await loadXlsx()).read(buffer, { type: 'array' })
      }
    }
  } catch {
    // فشل XLSX
  }

  // 2) محاولة CSV كبديل (صفحة واحدة فقط)
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)
    const res = await fetch(SHEET_URL, { signal: controller.signal })
    clearTimeout(timeout)
    if (res.ok) {
      const csvText = await res.text()
      if (csvText.length > 100) {
        saveToCache('csv', csvText)
        return (await loadXlsx()).read(csvText, { type: 'string' })
      }
    }
  } catch {
    // فشل CSV
  }

  // 3) ملف محلي كآخر ملاذ
  let res: Response | null = null
  try {
    res = await fetch('./billboards.xlsx')
  } catch {}
  if (!res || !res.ok) {
    try {
      res = await fetch('/billboards.xlsx')
    } catch {}
  }
  if (!res || !res.ok) throw new Error('فشل تحميل البيانات من جميع المصادر')
  const buffer = await res.arrayBuffer()
  return (await loadXlsx()).read(buffer, { type: 'array' })
}

/**
 * الحصول على workbook (مع caching وتحميل مرة واحدة)
 */
export async function getWorkbook(): Promise<XLSX.WorkBook> {
  // 1. من الذاكرة
  if (cachedWorkbook) return cachedWorkbook

  // 2. منع تحميل متزامن
  if (loadPromise) return loadPromise

  loadPromise = (async () => {
  // 3. من sessionStorage
  const fromCache = await getFromCache()
  if (fromCache) {
    cachedWorkbook = fromCache
    return fromCache
  }

  return fetchWorkbook()
  })().then(wb => { cachedWorkbook = wb; return wb })
    .finally(() => { loadPromise = null })

  return loadPromise
}

/**
 * الحصول على صفحة معينة من workbook
 */
export async function getSheet(index: number | string): Promise<any[]> {
  const wb = await getWorkbook()
  const sheetName = typeof index === 'string'
    ? wb.SheetNames.find(name => name.trim() === index.trim())
    : wb.SheetNames[index]
  if (!sheetName) return []
  const ws = wb.Sheets[sheetName]
  return (await loadXlsx()).utils.sheet_to_json(ws, { defval: '' })
}

/**
 * مسح الكاش (عند الحاجة للتحديث)
 */
export function clearWorkbookCache() {
  cachedWorkbook = null
  loadPromise = null
  try { sessionStorage.removeItem(CACHE_KEY) } catch {}
}
