/**
 * Hook لتحميل بيانات اللوحات الإعلانية
 * يتولى جلب البيانات والتعامل مع حالات التحميل والخطأ
 */

import { useState, useEffect } from "react"
import { Billboard } from "@/types"
import { loadBillboardsFromExcel } from "@/services/billboardService"
import { loadPricingFromExcel, clearPricingCache } from "@/services/pricingService"
import { clearWorkbookCache } from '@/services/sheetLoader'

interface UseBillboardDataReturn {
  billboards: Billboard[]
  loading: boolean
  loadError: boolean
  reload: () => void
}

const CACHE_KEY = 'gf_catalog_v1'
const CACHE_TTL = 5 * 60 * 1000
function readCatalog(): Billboard[] {
  try {
    const cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null')
    return cached && Date.now() - cached.timestamp < CACHE_TTL && Array.isArray(cached.data) ? cached.data : []
  } catch { return [] }
}

export function useBillboardData(): UseBillboardDataReturn {
  const [billboards, setBillboards] = useState<Billboard[]>(readCatalog)
  const [loading, setLoading] = useState(() => readCatalog().length === 0)
  const [loadError, setLoadError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    // Prices share the workbook request but must not delay rendering the catalog.
    void loadPricingFromExcel().catch(() => {})
    const cached = reloadKey === 0 ? readCatalog() : []
    if (cached.length) {
      setBillboards(cached)
      setLoading(false)
      return () => { active = false }
    }
    setLoading(true)
    setLoadError(false)
    void loadBillboardsFromExcel().then(data => {
      if (!active) return
      if (data.length) {
        setBillboards(data)
        try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data })) } catch {}
      } else setLoadError(true)
    }).catch(() => { if (active) setLoadError(true) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reloadKey])

  const reload = () => {
    try { sessionStorage.removeItem(CACHE_KEY) } catch {}
    clearWorkbookCache()
    clearPricingCache()
    setReloadKey(k => k + 1)
  }
  return { billboards, loading, loadError, reload }
}
