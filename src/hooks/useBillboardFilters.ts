/**
 * Hook لإدارة فلاتر البحث على اللوحات الإعلانية
 * يتولى حساب الخيارات، تطبيق الفلاتر، وإرجاع النتائج
 */

import { useState, useEffect, useMemo } from "react"
import i18n from "@/i18n"
import { Billboard } from "@/types"
import { parseExpiryDate } from "@/utils/dateUtils"

interface NearbyLocation {
  lat: number
  lng: number
  radius: number
}

interface UseBillboardFiltersReturn {
  // State
  searchTerm: string
  setSearchTerm: (v: string) => void
  selectedMunicipalities: string[]
  setSelectedMunicipalities: (v: string[]) => void
  selectedCities: string[]
  setSelectedCities: (v: string[]) => void
  selectedAreas: string[]
  setSelectedAreas: (v: string[]) => void
  selectedSizes: string[]
  setSelectedSizes: (v: string[]) => void
  selectedAvailability: string[]
  setSelectedAvailability: React.Dispatch<React.SetStateAction<string[]>>
  toggleAvailability: (v: string) => void
  excludeSoonFromAvailable: boolean
  setExcludeSoonFromAvailable: (v: boolean | ((prev: boolean) => boolean)) => void
  nearbyLocation: NearbyLocation | null
  setNearbyLocation: (v: NearbyLocation | null) => void

  // Computed
  filteredBillboards: Billboard[]
  filteredBillboardsForMap: Billboard[]
  municipalities: string[]
  cities: string[]
  areas: string[]
  sizes: string[]
  availabilityOptions: { value: string; label: string; count: number }[]
}

// تطبيع النص العربي: توحيد الهمزات والألف والياء والتاء المربوطة وإزالة التشكيل والتطويل
const normalizeArabic = (s: string): string =>
  (s || "")
    .toString()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "") // تشكيل + تطويل
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()

export function useBillboardFilters(billboards: Billboard[]): UseBillboardFiltersReturn {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedMunicipalities, setSelectedMunicipalities] = useState<string[]>([])
  const [selectedCities, setSelectedCities] = useState<string[]>([])
  const [selectedAreas, setSelectedAreas] = useState<string[]>([])
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedAvailability, setSelectedAvailability] = useState<string[]>(["available"])
  const [excludeSoonFromAvailable, setExcludeSoonFromAvailable] = useState<boolean>(false)
  const [nearbyLocation, setNearbyLocation] = useState<NearbyLocation | null>(null)

  const toggleAvailability = (period: string) => {
    if (period === "all") {
      setSelectedAvailability(["all"])
      return
    }
    setSelectedAvailability(prev => {
      if (prev.includes("all") || prev.length === 0) {
        return [period]
      }
      if (prev.includes(period)) {
        const next = prev.filter(p => p !== period)
        return next.length === 0 ? ["all"] : next
      }
      return [...prev.filter(p => p !== "all"), period]
    })
  }

  // Unique filter options
  const municipalities = useMemo(
    () => Array.from(new Set(billboards.map(b => b.municipality).filter(Boolean))),
    [billboards]
  )
  const cities = useMemo(
    () => Array.from(new Set(billboards.map(b => b.city).filter(Boolean))),
    [billboards]
  )
  const areas = useMemo(
    () => Array.from(new Set(billboards.map(b => b.area).filter(Boolean))),
    [billboards]
  )
  const sizes = useMemo(
    () => Array.from(new Set(billboards.map(b => b.size).filter(Boolean))),
    [billboards]
  )

  // Apply filters except availability (used for the map which has its own status filter)
  const filteredBillboardsForMap = useMemo(() => {
    let filtered = billboards

    if (searchTerm) {
      const tokens = normalizeArabic(searchTerm).split(" ").filter(Boolean)
      filtered = filtered.filter(b => {
        const haystack = normalizeArabic(
          [b.name, b.location, b.landmark, b.municipality, b.city, b.area, b.billboardType, b.size, b.level, b.id]
            .filter(Boolean)
            .join(" ")
        )
        return tokens.every(t => haystack.includes(t))
      })
    }

    if (selectedMunicipalities.length > 0) {
      filtered = filtered.filter(b => selectedMunicipalities.includes(b.municipality))
    }
    if (selectedCities.length > 0) {
      filtered = filtered.filter(b => selectedCities.includes(b.city))
    }
    if (selectedAreas.length > 0) {
      filtered = filtered.filter(b => selectedAreas.includes(b.area))
    }
    if (selectedSizes.length > 0) {
      filtered = filtered.filter(b => selectedSizes.includes(b.size))
    }

    if (nearbyLocation) {
      const { lat: userLat, lng: userLng, radius } = nearbyLocation
      filtered = filtered.filter(b => {
        const coords = b.coordinates.split(',').map(c => parseFloat(c.trim()))
        if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return false
        const R = 6371
        const dLat = (coords[0] - userLat) * Math.PI / 180
        const dLng = (coords[1] - userLng) * Math.PI / 180
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(userLat * Math.PI / 180) * Math.cos(coords[0] * Math.PI / 180) * Math.sin(dLng / 2) ** 2
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) <= radius
      })
    }

    return filtered
  }, [billboards, searchTerm, selectedMunicipalities, selectedCities, selectedAreas, selectedSizes, nearbyLocation])

  // Availability options with counts based on active filtered billboards pool
  const availabilityOptions = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const options: { value: string; label: string; count: number }[] = []

    const tenDaysDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
    const thirtyDaysDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // متاح الآن: إما متاح حصراً (إذا تم تفعيل استثناء قريباً) أو متاح + متبقي 10 أيام أو أقل
    const availableCount = filteredBillboardsForMap.filter(b => {
      const expiry = parseExpiryDate(b.expiryDate)
      if (excludeSoonFromAvailable) {
        return b.status === "متاح" && (!expiry || expiry <= now)
      }
      if (b.status === "متاح") return true
      return expiry && expiry <= tenDaysDate
    }).length
    options.push({ value: "available", label: `${i18n.t('status.available')} (${availableCount})`, count: availableCount })

    // قريباً: متبقي من 11 إلى 30 يوماً
    const soonCount = filteredBillboardsForMap.filter(b => {
      if (b.status === "متاح") return false
      const expiry = parseExpiryDate(b.expiryDate)
      return expiry && expiry > tenDaysDate && expiry <= thirtyDaysDate
    }).length
    options.push({ value: "soon", label: `${i18n.t('status.soon')} (${soonCount})`, count: soonCount })

    const monthNames = (i18n.t('months', { returnObjects: true }) as string[]) || ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    for (let i = 1; i <= 12; i++) {
      const targetMonth = (currentMonth + i) % 12
      const targetYear = currentYear + Math.floor((currentMonth + i) / 12)
      const monthStart = new Date(targetYear, targetMonth, 1)
      const monthEnd = new Date(targetYear, targetMonth + 1, 0)
      const monthCount = filteredBillboardsForMap.filter(b => {
        if (b.status === "متاح") return false
        const expiry = parseExpiryDate(b.expiryDate)
        if (expiry && expiry <= thirtyDaysDate) return false
        return expiry && expiry >= monthStart && expiry <= monthEnd
      }).length
      if (monthCount > 0) {
        options.push({
          value: `month-${targetMonth + 1}-${targetYear}`,
          label: `${monthNames[targetMonth]} ${targetYear} (${monthCount})`,
          count: monthCount,
        })
      }
    }
    return options
  }, [filteredBillboardsForMap, i18n.language, excludeSoonFromAvailable])

  // Apply all filters (availability on top of the base filters already in filteredBillboardsForMap)
  const filteredBillboards = useMemo(() => {
    let filtered = filteredBillboardsForMap

    const isAllAvailability = selectedAvailability.includes("all") || selectedAvailability.length === 0
    if (!isAllAvailability) {
      const now = new Date()
      const tenDaysDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
      const thirtyDaysDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      
      filtered = filtered.filter(b => {
        return selectedAvailability.some(period => {
          const expiry = parseExpiryDate(b.expiryDate)
          if (period === "available") {
            if (excludeSoonFromAvailable) {
              return b.status === "متاح" && (!expiry || expiry <= now)
            }
            return b.status === "متاح" || (expiry && expiry <= tenDaysDate)
          }
          if (b.status === "متاح") return false
          if (!expiry) return false
          if (period === "soon") {
            return expiry > tenDaysDate && expiry <= thirtyDaysDate
          }
          if (period.startsWith("month-")) {
            if (expiry <= thirtyDaysDate) return false
            const parts = period.split("-")
            const targetMonth = parseInt(parts[1]) - 1
            const targetYear = parseInt(parts[2])
            const monthStart = new Date(targetYear, targetMonth, 1)
            const monthEnd = new Date(targetYear, targetMonth + 1, 0)
            return expiry >= monthStart && expiry <= monthEnd
          }
          return false
        })
      })
    }

    return filtered
  }, [filteredBillboardsForMap, selectedAvailability, excludeSoonFromAvailable])

  return {
    searchTerm, setSearchTerm,
    selectedMunicipalities, setSelectedMunicipalities,
    selectedCities, setSelectedCities,
    selectedAreas, setSelectedAreas,
    selectedSizes, setSelectedSizes,
    selectedAvailability, setSelectedAvailability,
    toggleAvailability,
    excludeSoonFromAvailable, setExcludeSoonFromAvailable,
    nearbyLocation, setNearbyLocation,
    filteredBillboards,
    filteredBillboardsForMap,
    municipalities, cities, areas, sizes,
    availabilityOptions,
  }
}
