/**
 * Hook لإدارة فلاتر البحث على اللوحات الإعلانية
 * يتولى حساب الخيارات، تطبيق الفلاتر، وإرجاع النتائج
 */

import { useState, useMemo } from "react"
import i18n from "@/i18n"
import { Billboard } from "@/types"
import { matchesAvailability } from "@/utils/availability"

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

    const availableCount = filteredBillboardsForMap.filter(b => matchesAvailability(b, 'available', excludeSoonFromAvailable)).length
    options.push({ value: 'available', label: (excludeSoonFromAvailable ? i18n.t('status.available') : i18n.language.startsWith('ar') ? 'متاح الآن وخلال 20 يومًا' : 'Available now & within 20 days') + ' (' + availableCount + ')', count: availableCount })
    const nowCount = filteredBillboardsForMap.filter(b => matchesAvailability(b, 'available-now')).length
    options.push({ value: 'available-now', label: (i18n.language.startsWith('ar') ? 'المتاح حاليًا فقط' : 'Available now only') + ' (' + nowCount + ')', count: nowCount })
    const soonCount = filteredBillboardsForMap.filter(b => matchesAvailability(b, 'soon')).length
    options.push({ value: 'soon', label: i18n.t('status.soon') + ' (' + soonCount + ')', count: soonCount })
    const bookedCount = filteredBillboardsForMap.filter(b => matchesAvailability(b, 'booked')).length
    options.push({ value: 'booked', label: i18n.t('status.rented') + ' (' + bookedCount + ')', count: bookedCount })

    const monthNames = (i18n.t('months', { returnObjects: true }) as string[]) || ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
    for (let i = 0; i <= 12; i++) {
      const targetMonth = (currentMonth + i) % 12
      const targetYear = currentYear + Math.floor((currentMonth + i) / 12)
      const monthCount = filteredBillboardsForMap.filter(b => matchesAvailability(b, 'month-' + (targetMonth + 1) + '-' + targetYear)).length
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

  const filteredBillboards = useMemo(() => {
    if (!selectedAvailability.length || selectedAvailability.includes('all')) return filteredBillboardsForMap
    return filteredBillboardsForMap.filter(b => selectedAvailability.some(period => matchesAvailability(b, period, excludeSoonFromAvailable)))
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
