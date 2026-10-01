import { preparePrintImages } from '@/services/printImages'
import { matchesAvailability } from '@/utils/availability'
import { useState, useMemo, useEffect, lazy, Suspense } from "react"

import { openPrintPreview } from '@/services/printWindow'
import { useTranslation } from "react-i18next"
import { formatExpiryDate } from "@/utils/dateUtils"
import { escapeHtml } from "@/utils/escapeHtml"
import { WHATSAPP_NUMBER, WHATSAPP_BASE_URL } from "@/constants/contact"
import { createPortal } from "react-dom"
import { Search, MessageCircle, Download, CheckSquare, FileSpreadsheet, RefreshCw, WifiOff, ChevronUp, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

import SearchFilters from "@/components/SearchFilters"
import BillboardCard from "@/components/BillboardCard"
import MapSkeleton from "@/components/MapSkeleton"
const InteractiveMap = lazy(() => import("@/components/InteractiveMap"))
import type { PricingOptions } from "@/components/PrintDialog"
const PrintDialog = lazy(() => import("@/components/PrintDialog"))
import { getPrice, formatPrice, calculateDiscountedPrice, RENTAL_PERIODS } from "@/services/pricingService"
import MapSidePanel from "@/components/MapSidePanel"
import ImageViewerModal from "@/components/ImageViewerModal"
import Footer from "@/components/Footer"
import DeferredSection from "@/components/DeferredSection"
const StatsSection = lazy(() => import("@/components/StatsSection"))
const ClientLogos = lazy(() => import("@/components/ClientLogos"))
import UpdateNotice from "@/components/UpdateNotice"
import DisplayModeToggle from "@/components/DisplayModeToggle"
import HeroSlider from "@/components/HeroSlider"
import SiteHeader from "@/components/SiteHeader"
import LanguageHintToast from "@/components/LanguageHintToast"
import BillboardCardSkeleton from "@/components/BillboardCardSkeleton"
import { Billboard } from "@/types"
import { useTheme } from "@/hooks/useTheme"

import { useDisplayMode } from "@/hooks/useDisplayMode"
import { useBillboardData } from "@/hooks/useBillboardData"
import { useBillboardFilters } from "@/hooks/useBillboardFilters"

export default function App() {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith("ar")
  const { theme, toggleTheme } = useTheme()
  const displayMode = useDisplayMode()


  // Data loading
  const { billboards, loading, loadError, reload } = useBillboardData()

  // Filters
  const filters = useBillboardFilters(billboards)

  // UI state
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [cardsPerRow, setCardsPerRow] = useState(3)
  const showAllBillboards = true
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  useEffect(() => {
    const handlePlaceFilter = (event: Event) => {
      const detail = (event as CustomEvent<{ kind: string; value: string }>).detail
      if (!detail || typeof detail.value !== 'string' || !detail.value.trim()) return
      if (detail.kind === 'area') filters.setSelectedAreas([detail.value])
      else if (detail.kind === 'municipality') filters.setSelectedMunicipalities([detail.value])
      else if (detail.kind === 'city') filters.setSelectedCities([detail.value])
      else return
      setCurrentPage(1)
      toast({ title: t('list.filter_applied'), description: detail.value })
    }
    document.addEventListener('filterBillboardsByPlace', handlePlaceFilter)
    return () => document.removeEventListener('filterBillboardsByPlace', handlePlaceFilter)
  }, [filters.setSelectedAreas, filters.setSelectedMunicipalities, filters.setSelectedCities, t])

  const [selectedBillboards, setSelectedBillboards] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('gf_shortlist')
      return saved ? new Set(JSON.parse(saved)) : new Set()
    } catch {
      return new Set()
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('gf_shortlist', JSON.stringify(Array.from(selectedBillboards)))
    } catch {}
  }, [selectedBillboards])

  const [showPrintDialog, setShowPrintDialog] = useState(false)
  const [showSelectedPrintDialog, setShowSelectedPrintDialog] = useState(false)
  const [mapPanelBillboard, setMapPanelBillboard] = useState<Billboard | null>(null)
  const [showMapPanel, setShowMapPanel] = useState(false)
  const [isMapFullscreen, setIsMapFullscreen] = useState(false)
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 800)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const skeletonCount = 12
  // الحد الأدنى 12 كرتاً في الصفحة، والحد الأقصى cardsPerRow * 4
  const itemsPerPage = Math.max(12, cardsPerRow * 3)

  const { filteredBillboards, filteredBillboardsForMap } = filters

  const totalPages = Math.ceil(filteredBillboards.length / itemsPerPage)
  const paginatedBillboards = showAllBillboards
    ? filteredBillboards.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredBillboards

  // Reset to page 1 whenever filters change so cards don't vanish on an out-of-range page
  useEffect(() => {
    setCurrentPage(1)
  }, [
    filters.searchTerm,
    filters.selectedMunicipalities,
    filters.selectedCities,
    filters.selectedAreas,
    filters.selectedSizes,
    filters.selectedAvailability,
    filters.nearbyLocation,
  ])

  // Clamp page if total pages shrinks below current page
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) setCurrentPage(totalPages)
  }, [totalPages, currentPage])

  // Selection helpers
  const toggleBillboardSelection = (billboardId: string) => {
    const newSelected = new Set(selectedBillboards)
    if (newSelected.has(billboardId)) newSelected.delete(billboardId)
    else newSelected.add(billboardId)
    setSelectedBillboards(newSelected)
  }

  const selectMultipleBillboards = (billboardIds: string[]) => {
    const newSelected = new Set(selectedBillboards)
    billboardIds.forEach(id => newSelected.add(id))
    setSelectedBillboards(newSelected)
  }

  const clearSelection = () => setSelectedBillboards(new Set())

  const selectionByPeriod = useMemo(() => {
    const result: Record<string, { selected: number; total: number }> = {}
    for (const period of ['all', ...filters.availabilityOptions.map(o => o.value)]) {
      const pool = filters.filteredBillboardsForMap.filter(b => matchesAvailability(b, period, filters.excludeSoonFromAvailable))
      result[period] = { total: pool.length, selected: pool.filter(b => selectedBillboards.has(b.id)).length }
    }
    return result
  }, [filters.filteredBillboardsForMap, selectedBillboards, filters.availabilityOptions, filters.excludeSoonFromAvailable])

  // دالة تحديد/إلغاء تحديد كل لوحات نطاق أو فترة زمنية مع الالتزام بكافة الفلاتر النشطة الحالية
  const togglePeriodSelection = (periodValue: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()

    const matchesPeriod = (b: Billboard) => matchesAvailability(b, periodValue, filters.excludeSoonFromAvailable)

    // الالتزام التام بالفلاتر النشطة الحالية (البحث، البلديات، المدن، المقاسات، الموقع)
    const targetPool = filters.filteredBillboardsForMap.filter(matchesPeriod)
    const targetIds = targetPool.map(b => b.id)
    if (targetIds.length === 0) return

    const allPeriodSelected = targetIds.every(id => selectedBillboards.has(id))
    const newSelected = new Set(selectedBillboards)

    if (allPeriodSelected) {
      targetIds.forEach(id => newSelected.delete(id))
    } else {
      targetIds.forEach(id => newSelected.add(id))
    }

    setSelectedBillboards(newSelected)
  }

  // WhatsApp send for selected billboards (0913228908)
  const handleWhatsAppSend = () => {
    if (selectedBillboards.size === 0) return

    const selectedData = billboards.filter(b => selectedBillboards.has(b.id))
    
    let message = `السلام عليكم ورحمة الله وبركاته\nمرحباً، أود الاستفسار وحجز اللوحات الإعلانية التالية (${selectedData.length} لوحة):\n\n`
    
    if (selectedData.length <= 8) {
      selectedData.forEach((b, index) => {
        const code = b.name || b.id || `GF-${String(index + 1).padStart(4, "0")}`
        const statusText = b.status === "متاح" ? "متاح" : `ينتهي في ${b.expiryDate || "-"}`
        message += `${index + 1}. كود: ${code} | مقاس: ${b.size} | الحالة: ${statusText}\n`
        message += `   الموقع: ${b.landmark || b.location} (${b.area || b.city || ""})\n`
        if (b.coordinates) {
          message += `   الخريطة: https://www.google.com/maps?q=${b.coordinates}\n`
        }
        message += `-----------------------------------\n`
      })
    } else {
      // تنسيق مدمج لمنع تجاوز الحد الأقصى لطول الرابط في المتصفحات
      selectedData.forEach((b, index) => {
        const code = b.name || b.id || `GF-${String(index + 1).padStart(4, "0")}`
        message += `${index + 1}. [${code}] مقاس ${b.size} - ${b.area || b.city || ''} (${b.landmark || b.location})\n`
      })
      message += `\nيرجى تزويدي بالتوفر وعرض السعر لهذه المجموعة.`
    }

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
  }

  // PDF Print
  const handlePrint = async (
    includeLogo: boolean,
    includeImages: boolean = true,
    customBillboardsOrPricing?: Billboard[] | PricingOptions,
    pricingOptions?: PricingOptions
  ) => {
    let customBillboards: Billboard[] | undefined
    let pricing: PricingOptions | undefined

    if (Array.isArray(customBillboardsOrPricing)) {
      customBillboards = customBillboardsOrPricing
      pricing = pricingOptions
    } else {
      pricing = customBillboardsOrPricing
    }

    const billboardsToPrint = customBillboards || filteredBillboards
    return openPrintPreview(async () => {

    const printImages = await preparePrintImages(includeImages ? billboardsToPrint.map(board => board.imageUrl || '') : [], 480)
    const qrCodes: { [key: string]: string } = {}
    for (const billboard of billboardsToPrint) {
      if (billboard.coordinates) {
        try {
          qrCodes[billboard.id] = await (await import('qrcode')).default.toDataURL(
            `https://www.google.com/maps?q=${billboard.coordinates}`,
            { width: 80, margin: 1, color: { dark: '#000000', light: '#ffffff' } }
          )
        } catch (e) { console.error('QR error:', e) }
      }
    }

    const assetBase = (window.location.origin && window.location.origin !== 'null') ? window.location.origin : '.'
    const headerImage = includeLogo
      ? `<img src="${assetBase}/mt.svg" alt="رأس التقرير" class="header-image" />`
      : `<img src="${assetBase}/mtb.svg" alt="رأس التقرير" class="header-image" />`

    const now = new Date()
    const dd = String(now.getDate()).padStart(2, '0')
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const yyyy = now.getFullYear()
    const rawHour = now.getHours()
    const min = String(now.getMinutes()).padStart(2, '0')
    // نظام 12 ساعة مع ص/م لمطابقة ما يظهر على شاشة المستخدم
    const ampm = rawHour < 12 ? 'ص' : 'م'
    const hour12 = rawHour % 12 === 0 ? 12 : rawHour % 12
    const hh12 = String(hour12).padStart(2, '0')
    // فواصل آمنة لأسماء ملفات Windows — بدون / أو : كي لا تُستبدل بـ _
    const pdfTitle = `اللوحات المتاحة — ${dd}-${mm}-${yyyy} — ${hh12}.${min} ${ampm}`

    const printContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${pdfTitle}</title>
        <link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap" rel="stylesheet">
        <style>
          @font-face { font-family: 'Manrope'; src: url('${window.location.origin}/fonts/Manrope-Regular.otf') format('opentype'); font-weight: 400; }
          @font-face { font-family: 'Manrope'; src: url('${window.location.origin}/fonts/Manrope-Medium.otf') format('opentype'); font-weight: 500; }
          @font-face { font-family: 'Manrope'; src: url('${window.location.origin}/fonts/Manrope-SemiBold.ttf') format('truetype'); font-weight: 600; }
          @font-face { font-family: 'Manrope'; src: url('${window.location.origin}/fonts/Manrope-Bold.otf') format('opentype'); font-weight: 700; }
          @font-face { font-family: 'Manrope'; src: url('${window.location.origin}/fonts/Manrope-ExtraBold.otf') format('opentype'); font-weight: 800; }
          @page { size: A4 portrait; margin: 10mm; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Doran', 'Manrope', 'Tajawal', 'Arial', sans-serif; direction: rtl; background: #ffffff; color: #000; line-height: 1.3; font-size: 9px; }
          .header-section { width: 100%; margin-bottom: 10px; }
          .header-image { width: 100%; height: auto; display: block; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8px; background: #ffffff; }
          th { background: #000000; color: #E8CC64; font-weight: 700; font-size: 8px; height: 30px; border: 1px solid #000000; padding: 4px 2px; }
          td { border: 1px solid #000000; padding: 2px; text-align: center; vertical-align: middle; background: #ffffff; color: #000; }
          td.number-cell { background: #E8CC64; padding: 2px; font-weight: 700; font-size: 9px; color: #000; width: 60px; }
          td.image-cell { background: #ffffff; padding: 0; width: 90px; height: 64px; position: relative; }
          .billboard-image { position: absolute; inset: 0; width: 100%; height: 100%; max-height: none; object-fit: contain; display: block; margin: 0; border-radius: 0 !important; }
          .billboard-number { color: #000; font-weight: 700; font-size: 9px; }
          .status-available { color: #16a34a; font-weight: 700; font-size: 8px; }
          td.qr-cell { width: 60px; height: 64px; padding: 0; vertical-align: middle; position: relative; }
          .qr-code { width: 100%; height: 100%; max-height: none; object-fit: contain; border-radius: 0 !important; display: block; cursor: pointer; }
          .qr-link { position: absolute; inset: 0; display: block; text-align: center; }
          .image-placeholder { width: 100%; height: 55px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 7px; color: #666; text-align: center; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: #ffffff !important; margin: 0 !important; }
            .no-print, button, #mobile-print-btn, .mobile-print-btn {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              width: 0 !important;
              height: 0 !important;
              position: absolute !important;
              top: -9999px !important;
              left: -9999px !important;
              pointer-events: none !important;
            }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            td, th, .billboard-image, .image-placeholder, td.image-cell, td.number-cell { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header-section">${headerImage}</div>
        ${pricing?.includePricing ? `<div style="margin-bottom: 8px; padding: 6px 10px; background: #000000; display: inline-block;"><span style="font-size: 9px; color: #E8CC64; font-weight: 700;">مدة الإيجار: ${RENTAL_PERIODS.find(p => p.value === pricing.period)?.label || pricing.period}</span></div>` : ''}
        <table>
          <thead>
            <tr>
              <th style="width: 3%;">م</th>
              <th style="width: 7%;">الكود</th>
              ${includeImages ? '<th style="width: 7%;">صورة</th>' : ''}
              <th style="width: ${includeImages ? (pricing?.includePricing ? '12%' : '18%') : (pricing?.includePricing ? '18%' : '24%')};">الموقع</th>
              <th style="width: 8%;">المنطقة</th>
              <th style="width: 7%;">البلدية</th>
              <th style="width: 5%;">المقاس</th>
              <th style="width: 4%;">الأوجه</th>
              <th style="width: 5%;">النوع</th>
              ${pricing?.includePricing ? `<th style="width: 4%;">الفئة</th><th style="width: 7%;">السعر</th><th style="width: 7%;">بعد الخصم</th>` : `<th style="width: 5%;">الحالة</th>`}
              <th style="width: 5%;">QR</th>
            </tr>
          </thead>
          <tbody>
            ${billboardsToPrint.map((billboard, index) => {
              const exportCode = escapeHtml(billboard.name || billboard.id || `GF-${String(index + 1).padStart(4, "0")}`)
              const level = escapeHtml(billboard.level?.toUpperCase() || 'A')
              const price = pricing?.includePricing ? getPrice(billboard.level?.toUpperCase() || 'A', billboard.size, pricing.period, 'company') : 0
              const discount = pricing?.discounts?.[billboard.level?.toUpperCase() || 'A'] || { type: 'percentage', value: 0 }
              const discountedPrice = pricing?.includePricing ? calculateDiscountedPrice(price, discount.type, discount.value) : 0
              return `
              <tr style="height: 60px;">
                <td class="number-cell"><div class="billboard-number">${index + 1}</div></td>
                <td style="font-size: 8px; font-weight: 800; color: #1a1a2e; background: #f5f5f5; padding: 4px; white-space: nowrap;"><span dir="ltr" style="direction:ltr; unicode-bidi:bidi-override; display:inline-block;">${exportCode}</span></td>
                ${includeImages ? `<td class="image-cell">${billboard.imageUrl ? `<img src="${escapeHtml(printImages.get(billboard.imageUrl) || billboard.imageUrl)}" alt="صورة" class="billboard-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"><div class="image-placeholder" style="display:none;"><span>صورة</span></div>` : `<div class="image-placeholder"><span>صورة</span></div>`}</td>` : ''}
                <td style="font-weight: 500; text-align: right; padding: 4px; font-size: 8px;">${escapeHtml(billboard.location)}</td>
                <td style="font-size: 8px; padding: 2px;">${escapeHtml(billboard.area)}</td>
                <td style="font-size: 8px; padding: 2px;">${escapeHtml(billboard.municipality)}</td>
                <td style="font-weight: 600; font-size: 8px; color: #000000;">${escapeHtml(billboard.size)}</td>
                <td style="font-size: 9px; padding: 2px; font-weight: 700;">${escapeHtml(billboard.facesCount || '-')}</td>
                <td style="font-size: 8px; padding: 2px;">${escapeHtml(billboard.billboardType || '-')}</td>
                ${pricing?.includePricing
                  ? `<td style="font-size: 8px; padding: 2px; font-weight: 700; background: #f0f0f0;">${level}</td><td style="font-size: 8px; padding: 2px; font-weight: 600;">${price > 0 ? formatPrice(price) : '-'}</td><td style="font-size: 8px; padding: 2px; font-weight: 700; color: ${discountedPrice < price ? '#16a34a' : '#000'};">${discountedPrice > 0 ? formatPrice(discountedPrice) : '-'}</td>`
                  : `<td style="color: ${billboard.status === 'متاح' ? '#16a34a' : '#b45309'}; font-weight: 600; font-size: 8px;">${billboard.status === 'متاح' ? 'متاح' : formatExpiryDate(billboard.expiryDate)}</td>`
                }
                <td class="qr-cell">${qrCodes[billboard.id] ? `<a href="https://www.google.com/maps?q=${escapeHtml(billboard.coordinates)}" target="_blank" class="qr-link" title="اضغط لفتح الموقع"><img src="${qrCodes[billboard.id]}" class="qr-code"  alt="QR" /></a>` : '<span style="color: #999; font-size: 7px;">-</span>'}</td>
              </tr>`
            }).join("")}
          </tbody>
        </table>
        ${pricing?.includePricing ? (() => {
          const levelSummary: { [level: string]: { count: number; total: number; discounted: number } } = {}
          let grandTotal = 0; let grandDiscounted = 0
          billboardsToPrint.forEach(b => {
            const level = b.level?.toUpperCase() || 'A'
            const price = getPrice(level, b.size, pricing.period, 'company')
            if (!levelSummary[level]) levelSummary[level] = { count: 0, total: 0, discounted: 0 }
            levelSummary[level].count++; levelSummary[level].total += price
            const disc = pricing.discounts?.[level] || { type: 'percentage', value: 0 }
            const dp = calculateDiscountedPrice(price, disc.type, disc.value)
            levelSummary[level].discounted += dp; grandTotal += price; grandDiscounted += dp
          })
          const totalDiscountPercentage = grandTotal > 0 ? ((grandTotal - grandDiscounted) / grandTotal * 100) : 0
          return `<table style="width: 100%; font-size: 8px; border-collapse: collapse; border-top: none;">
            <thead>
              <tr style="background: #000000;"><th colspan="5" style="padding: 4px 8px; text-align: center; color: #FFD700; font-size: 11px; font-weight: 900; border: 1px solid #000; border-top: none; letter-spacing: 1px;">ملخص الأسعار</th></tr>
              <tr style="background: #000000;"><th style="padding: 4px; text-align: right; border: 1px solid #000; color: #FFD700; font-weight: 700; font-size: 8px;">الفئة</th><th style="padding: 4px; text-align: center; border: 1px solid #000; color: #FFD700; font-weight: 700; font-size: 8px;">العدد</th><th style="padding: 4px; text-align: center; border: 1px solid #000; color: #FFD700; font-weight: 700; font-size: 8px;">المجموع</th><th style="padding: 4px; text-align: center; border: 1px solid #000; color: #FFD700; font-weight: 700; font-size: 8px;">بعد الخصم</th><th style="padding: 4px; text-align: center; border: 1px solid #000; color: #FFD700; font-weight: 700; font-size: 8px;">الخصم</th></tr>
            </thead>
            <tbody>
              ${Object.entries(levelSummary).map(([l, d]) => `<tr><td style="padding: 3px; border: 1px solid #000; font-weight: 600; background: #fff; color: #000; font-size: 7px;">فئة ${l}</td><td style="padding: 3px; border: 1px solid #000; text-align: center; background: #fff; color: #000; font-size: 7px;">${d.count}</td><td style="padding: 3px; border: 1px solid #000; text-align: center; background: #fff; color: #000; font-size: 7px;">${formatPrice(d.total)}</td><td style="padding: 3px; border: 1px solid #000; text-align: center; background: #fff; color: #000; font-size: 7px;">${formatPrice(d.discounted)}</td><td style="padding: 3px; border: 1px solid #000; text-align: center; background: #fff; color: #000; font-size: 7px;">${d.total > 0 ? ((d.total - d.discounted) / d.total * 100).toFixed(1) + '%' : '-'}</td></tr>`).join('')}
              <tr style="background: #E8CC64;"><td style="padding: 4px; border: 1px solid #000; color: #000; font-weight: 700; font-size: 8px;">الإجمالي</td><td style="padding: 4px; border: 1px solid #000; text-align: center; color: #000; font-weight: 700; font-size: 8px;">${billboardsToPrint.length}</td><td style="padding: 4px; border: 1px solid #000; text-align: center; color: #000; font-weight: 700; font-size: 8px;">${formatPrice(grandTotal)}</td><td style="padding: 4px; border: 1px solid #000; text-align: center; color: #000; font-weight: 700; font-size: 8px;">${formatPrice(grandDiscounted)}</td><td style="padding: 4px; border: 1px solid #000; text-align: center; color: #000; font-weight: 700; font-size: 8px;">${totalDiscountPercentage.toFixed(1)}%</td></tr>
            </tbody>
          </table>`
        })() : ''}
      </body></html>`
    return printContent
    }, 'جدول اللوحات', billboardsToPrint.length)
  }

  // Excel export
  const handleExcelExport = async (data?: Billboard[]) => {
    const XLSX = await import('xlsx')
    const source = data || filteredBillboards
    const excelData = source.map((b, i) => ({
      'م': i + 1,
      'الكود': b.name || b.id || `GF-${String(i + 1).padStart(4, "0")}`,
      'الموقع': b.location,
      'البلدية': b.municipality,
      'المدينة': b.city,
      'المنطقة': b.area,
      'المقاس': b.size,
      'عدد الأوجه': b.facesCount || '-',
      'النوع': b.billboardType || '-',
      'الحالة': b.status,
      'تاريخ الانتهاء': b.expiryDate || '-',
      'الإحداثيات': b.coordinates,
    }))
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(excelData)
    ws['!cols'] = [{ wch: 5 }, { wch: 16 }, { wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 25 }]
    const sheetName = data ? 'اللوحات المحددة' : 'اللوحات الإعلانية'
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    const today = new Date().toLocaleDateString('ar-LY', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')
    const fileName = data ? `اللوحات_المحددة_${data.length}_${today}.xlsx` : `اللوحات_الإعلانية_${today}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  // Error screen
  if (loadError && billboards.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-destructive" />
          </div>
          <h2 className="text-xl font-black text-foreground mb-2" style={{ fontFamily: 'Doran, Tajawal, sans-serif' }}>
            تعذّر تحميل البيانات
          </h2>
          <p className="text-muted-foreground mb-6 text-sm">تأكد من اتصالك بالإنترنت ثم حاول مجدداً</p>
          <Button onClick={reload} className="gap-2 bg-primary text-primary-foreground">
            <RefreshCw className="w-4 h-4" />
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={"site-redesign min-h-screen bg-background relative" + (selectedBillboards.size ? " has-selection" : "")}>
      {!isMapFullscreen && (
        <SiteHeader
          theme={theme}
          toggleTheme={toggleTheme}
          onShowMap={() => { setShowMap(true); document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' }) }}
        />
      )}
      {!isMapFullscreen && <LanguageHintToast />}

      {!isMapFullscreen && (
        <HeroSlider
          totalBillboards={billboards.length}
          billboards={billboards}
          theme={theme}
          toggleTheme={toggleTheme}
          onScrollToBillboards={() => document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' })}
          onShowMap={() => { setShowMap(true); document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' }) }}
          onSelectCity={city => { filters.setSelectedCities([city]); filters.setSelectedMunicipalities([]); filters.setSelectedAreas([]); filters.setSearchTerm(''); filters.setSelectedSizes([]); filters.setNearbyLocation(null); filters.setSelectedAvailability(['available']); filters.setExcludeSoonFromAvailable(false); document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' }) }}
        />
      )}

      {!isMapFullscreen && <UpdateNotice />}



      <main id="billboards-section" className={`page-width catalog-main relative z-10 ${isMapFullscreen ? 'hidden' : ''}`}>
        {loading ? (
          <div className="mb-8 animate-pulse space-y-4">
            <div className="flex flex-wrap gap-3">
              <div className="h-10 w-64 bg-muted rounded-xl" />
              <div className="h-10 w-32 bg-muted rounded-xl" />
              <div className="h-10 w-32 bg-muted rounded-xl" />
              <div className="h-10 w-28 bg-muted rounded-xl" />
              <div className="h-10 w-28 bg-muted rounded-xl" />
            </div>
          </div>
        ) : (
          <SearchFilters
            searchTerm={filters.searchTerm}
            setSearchTerm={filters.setSearchTerm}
            selectedMunicipalities={filters.selectedMunicipalities}
            setSelectedMunicipalities={filters.setSelectedMunicipalities}
            selectedCities={filters.selectedCities}
            setSelectedCities={filters.setSelectedCities}
            selectedAreas={filters.selectedAreas}
            setSelectedAreas={filters.setSelectedAreas}
            selectedSizes={filters.selectedSizes}
            setSelectedSizes={filters.setSelectedSizes}
            selectedAvailability={filters.selectedAvailability}
            setSelectedAvailability={filters.setSelectedAvailability}
            viewMode={viewMode}
            setViewMode={setViewMode}
            showMap={showMap}
            setShowMap={setShowMap}
            municipalities={filters.municipalities}
            cities={filters.cities}
            areas={filters.areas}
            sizes={filters.sizes}
            availabilityOptions={filters.availabilityOptions}
            totalCount={filteredBillboards.length}
            onPrint={() => setShowPrintDialog(true)}
            onExcel={() => handleExcelExport()}
            onNearbyFilter={(lat, lng, radius) => filters.setNearbyLocation({ lat, lng, radius })}
            isNearbyActive={filters.nearbyLocation !== null}
            onClearNearby={() => filters.setNearbyLocation(null)}
          />
        )}

        {showMap && (
          <Suspense fallback={<MapSkeleton />}><InteractiveMap
            billboards={filteredBillboardsForMap}
            availability={filters.selectedAvailability}
            strictAvailability={filters.excludeSoonFromAvailable}
            onAvailabilityChange={(period, strict) => { filters.setSelectedAvailability([period]); filters.setExcludeSoonFromAvailable(strict) }}
            onImageView={setSelectedImage}
            selectedBillboards={selectedBillboards}
            onToggleSelection={toggleBillboardSelection}
            onSelectMultiple={selectMultipleBillboards}
            onDownloadSelected={() => { if (selectedBillboards.size > 0) setShowSelectedPrintDialog(true) }}
            onFullscreenChange={setIsMapFullscreen}
          /></Suspense>
        )}

        <div className="availability-toolbar">
          <div className="availability-heading"><div><h3>{ar ? 'التوفر والتحديد السريع' : 'Availability & quick selection'}</h3><p>{ar ? 'الأعداد والتحديد حسب المدينة والمنطقة والمقاس والبحث المطبّق.' : 'Counts and selections respect your city, area, size and search filters.'}</p></div></div>
          <div className="availability-range-grid">
            {[{ value: 'all', label: ar ? 'جميع اللوحات' : 'All billboards' }, ...filters.availabilityOptions].map(option => {
              const active = option.value === 'all' ? !filters.selectedAvailability.length || filters.selectedAvailability.includes('all') : filters.selectedAvailability.includes(option.value)
              const range = selectionByPeriod[option.value] || { total: 0, selected: 0 }
              const allSelected = range.total > 0 && range.selected === range.total
              const label = option.value === 'available' && !filters.excludeSoonFromAvailable ? (ar ? 'متاح أو خلال 20 يومًا' : 'Available or within 20 days') : option.label.replace(/\s*\(\d+\)$/, '')
              return <div key={option.value} className={'availability-range' + (active ? ' is-active' : '')}>
                <button className="availability-range-filter" aria-pressed={active} onClick={() => filters.toggleAvailability(option.value)}><span>{label}</span><strong>{range.total}</strong></button>
                <button className="availability-range-select" disabled={!range.total} aria-pressed={allSelected} onClick={() => togglePeriodSelection(option.value)}><CheckSquare size={16} /><span>{allSelected ? (ar ? 'إلغاء التحديد' : 'Deselect') : (ar ? 'تحديد النطاق' : 'Select range')}</span><bdi>{range.selected}/{range.total}</bdi></button>
              </div>
            })}
          </div>
          <div className="catalog-density"><span>{ar ? 'كثافة الكروت' : 'Card density'}</span><DisplayModeToggle mode={displayMode.mode} onToggle={displayMode.toggleMode} /><label className="desktop-density">{ar ? 'كروت في الصف' : 'Cards per row'}<select value={cardsPerRow} onChange={e => setCardsPerRow(Number(e.target.value))}>{[3, 4, 5, 6].map(n => <option key={n}>{n}</option>)}</select></label></div>
        </div>
        <div className="results-summary">
          <p aria-live="polite">{t('list.showing_of_simple', { shown: paginatedBillboards.length, total: filteredBillboards.length })}</p>

          {showAllBillboards && totalPages > 1 && (
            <div className="catalog-top-pagination" aria-label={ar ? 'أزرار الانتقال بين اللوحات' : 'Billboard navigation'}>
              <button
                type="button"
                className="brand-button brand-button-secondary catalog-pagination-arrow"
                onClick={() => {
                  setCurrentPage(p => Math.max(1, p - 1))
                  document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                disabled={currentPage === 1}
                title={ar ? 'الانتقال للّوحات السابقة' : 'Previous billboards'}
              >
                {ar ? <ChevronRight size={16} className="stroke-[2.5]" /> : <ChevronLeft size={16} className="stroke-[2.5]" />}
                <span>{t('list.prev')}</span>
              </button>

              <span className="catalog-pagination-indicator" aria-live="polite">
                {ar ? 'صفحة' : 'Page'} <b>{currentPage}</b> / {totalPages}
              </span>

              <button
                type="button"
                className="brand-button brand-button-secondary catalog-pagination-arrow"
                onClick={() => {
                  setCurrentPage(p => Math.min(totalPages, p + 1))
                  document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' })
                }}
                disabled={currentPage === totalPages}
                title={ar ? 'الانتقال للّوحات التالية' : 'Next billboards'}
              >
                <span>{t('list.next')}</span>
                {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>
            </div>
          )}

          <button className="quiet-button" disabled={!filteredBillboards.length} aria-pressed={filteredBillboards.length > 0 && filteredBillboards.every(b => selectedBillboards.has(b.id))} onClick={() => {
            const ids = filteredBillboards.map(b => b.id)
            const all = ids.length > 0 && ids.every(id => selectedBillboards.has(id))
            setSelectedBillboards(previous => {
              const selection = new Set(previous)
              ids.forEach(id => all ? selection.delete(id) : selection.add(id))
              return selection
            })
          }}><CheckSquare size={17} />{filteredBillboards.length > 0 && filteredBillboards.every(b => selectedBillboards.has(b.id)) ? (ar ? 'إلغاء تحديد النتائج' : 'Deselect results') : (ar ? 'تحديد كل نتائج الفلتر' : 'Select all filtered results')} ({filteredBillboards.length})</button>
        </div>
        {selectedBillboards.size > 0 && !isMapFullscreen && !showMapPanel && !selectedImage && !showSelectedPrintDialog && !showPrintDialog && createPortal(
          <aside className="campaign-dock" dir={ar ? 'rtl' : 'ltr'} aria-label={ar ? 'قائمة حملتك' : 'Your campaign shortlist'}>
            <div className="campaign-dock-summary"><span className="campaign-count">{selectedBillboards.size}</span><div><strong>{ar ? 'لوحات حملتك' : 'Your shortlist'}</strong><span>{ar ? 'أرسل اختياراتك لتأكيد التوفر والسعر' : 'Contact us to confirm availability and pricing'}</span></div><button className="dock-clear" onClick={clearSelection} aria-label={ar ? 'إلغاء تحديد كل اللوحات' : 'Clear shortlist'}><X size={19} /></button></div>
            <div className="campaign-dock-actions"><button className="brand-button brand-button-gold" onClick={handleWhatsAppSend}><MessageCircle size={18} />{ar ? 'استفسر عن الحجز' : 'Enquire on WhatsApp'}</button><button className="brand-button brand-button-secondary" onClick={() => setShowSelectedPrintDialog(true)}><Download size={17} />PDF</button><button className="brand-button brand-button-secondary" onClick={() => handleExcelExport(billboards.filter(b => selectedBillboards.has(b.id)))}><FileSpreadsheet size={17} />Excel</button></div>
          </aside>, document.body
        )}

        <Suspense fallback={null}>
        {showPrintDialog && <PrintDialog
          isOpen={showPrintDialog}
          onClose={() => setShowPrintDialog(false)}
          onPrint={(includeLogo, includeImages, pricingOptions) => handlePrint(includeLogo, includeImages, pricingOptions)}
          billboards={filteredBillboards}
        />}

        {showSelectedPrintDialog && <PrintDialog
          isOpen={showSelectedPrintDialog}
          allowCardLayout
          onClose={() => setShowSelectedPrintDialog(false)}
          onPrint={(includeLogo, includeImages, pricingOptions) => {
            const selectedData = billboards.filter(b => selectedBillboards.has(b.id))
            return handlePrint(includeLogo, includeImages, selectedData, pricingOptions)
          }}
          billboards={billboards.filter(b => selectedBillboards.has(b.id))}
        />}
        </Suspense>





        {/* Billboard Cards */}
        <div className="catalog-results">
          <div
            className={"catalog-grid" + (viewMode === "list" ? " catalog-list" : "")}
            data-cols={cardsPerRow.toString()}
          >
            {loading
              ? Array.from({ length: skeletonCount }).map((_, i) => (
                  <BillboardCardSkeleton key={i} isCompact={displayMode.mode === 'compact'} />
                ))
              : paginatedBillboards.map((billboard) => (
                  <div
                    key={billboard.id}
                    className="catalog-grid-item"
                  >
                    <BillboardCard
                      billboard={billboard}
                      isSelected={selectedBillboards.has(billboard.id)}
                      onToggleSelection={toggleBillboardSelection}
                      onViewImage={setSelectedImage}
                      onShowMap={b => { setMapPanelBillboard(b); setShowMapPanel(true) }}
                      displayMode={displayMode.mode}
                      onFilterByArea={(v) => {
                        filters.setSelectedAreas([v])
                        setCurrentPage(1)
                        document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        toast({ title: t('list.filter_applied'), description: t('list.area_filter', { value: v }) })
                      }}
                      onFilterByMunicipality={(v) => {
                        filters.setSelectedMunicipalities([v])
                        setCurrentPage(1)
                        document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        toast({ title: t('list.filter_applied'), description: t('list.municipality_filter', { value: v }) })
                      }}
                      onFilterByCity={(v) => {
                        filters.setSelectedCities([v])
                        setCurrentPage(1)
                        document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        toast({ title: t('list.filter_applied'), description: t('list.city_filter', { value: v }) })
                      }}
                      onFilterBySize={(v) => {
                        filters.setSelectedSizes([v])
                        setCurrentPage(1)
                        document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        toast({ title: t('list.filter_applied'), description: t('list.size_filter', { value: v }) })
                      }}
                      onFilterByType={(v) => {
                        filters.setSearchTerm(v)
                        setCurrentPage(1)
                        document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                        toast({ title: t('list.filter_applied'), description: t('list.type_filter', { value: v }) })
                      }}
                    />
                  </div>
                ))}
          </div>
        </div>

        {showAllBillboards && totalPages > 1 && (
          <nav className="catalog-pagination" aria-label={ar ? 'صفحات اللوحات' : 'Billboard pages'}>
            <button
              type="button"
              className="brand-button brand-button-secondary catalog-pagination-arrow"
              onClick={() => {
                setCurrentPage(p => Math.max(1, p - 1))
                document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              disabled={currentPage === 1}
              title={ar ? 'الصفحة السابقة' : 'Previous page'}
            >
              {ar ? <ChevronRight size={16} className="stroke-[2.5]" /> : <ChevronLeft size={16} className="stroke-[2.5]" />}
              <span>{t('list.prev')}</span>
            </button>

            <span aria-live="polite">{ar ? 'صفحة' : 'Page'} <b>{currentPage}</b> / {totalPages}</span>

            <button
              type="button"
              className="brand-button brand-button-secondary catalog-pagination-arrow"
              onClick={() => {
                setCurrentPage(p => Math.min(totalPages, p + 1))
                document.getElementById('billboards-section')?.scrollIntoView({ behavior: 'smooth' })
              }}
              disabled={currentPage === totalPages}
              title={ar ? 'الصفحة التالية' : 'Next page'}
            >
              <span>{t('list.next')}</span>
              {ar ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </nav>
        )}

        {filteredBillboards.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center border border-primary/30">
              <Search className="w-12 h-12 text-primary" />
            </div>
            <p className="text-foreground text-xl mb-4 font-bold">{t('list.no_results_title')}</p>
            <p className="text-muted-foreground font-semibold">{t('list.no_results_subtitle')}</p>
            <Button className="mt-6 min-h-11" onClick={() => {
              filters.setSearchTerm(''); filters.setSelectedCities([]); filters.setSelectedMunicipalities([])
              filters.setSelectedAreas([]); filters.setSelectedSizes([]); filters.setNearbyLocation(null)
              filters.setSelectedAvailability(['available']); filters.setExcludeSoonFromAvailable(false)
            }}>{ar ? 'إعادة البحث وعرض المتاح' : 'Reset search and show availability'}</Button>
            <a href="/billboard-guide.html" className="block mt-4 underline">{ar ? 'مساعدة في اختيار اللوحات' : 'Help choosing billboards'}</a>
          </div>
        )}
      </main>

      {!isMapFullscreen && !showMapPanel && selectedBillboards.size === 0 && (
        <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
          <a
            aria-label={ar ? "تواصل عبر واتساب" : "Contact on WhatsApp"}
            href={`${WHATSAPP_BASE_URL}?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن اللوحات الإعلانية المتاحة')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-11 h-11 md:w-14 md:h-14 bg-[hsl(142,72%,45%)] hover:bg-[hsl(142,72%,38%)] text-white rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-300"
          >
            <MessageCircle className="w-5 h-5 md:w-7 md:h-7" />
          </a>
        </div>
      )}

      {/* Scroll to Top Button */}
      {!isMapFullscreen && !showMapPanel && selectedBillboards.size === 0 && showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-20 right-4 md:bottom-24 md:right-6 z-50 w-11 h-11 bg-card/90 hover:bg-primary/20 border border-primary/30 hover:border-primary/60 text-primary rounded-full shadow-lg hover:shadow-gold backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110"
          aria-label="العودة للأعلى"
          title="العودة للأعلى"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}

      {/* Advanced Full-Screen Image Lightbox with Smooth Drag & Pinch Zoom */}
      <ImageViewerModal
        imageUrl={selectedImage}
        onClose={() => setSelectedImage(null)}
      />

      {!isMapFullscreen && !loading && <DeferredSection><Suspense fallback={null}><div className="page-width insights-section"><StatsSection billboards={billboards} sizeOrder={filters.sizes} municipalityOrder={filters.municipalities} id="stats-section" /></div></Suspense></DeferredSection>}
      {!isMapFullscreen && <DeferredSection><Suspense fallback={null}><ClientLogos /></Suspense></DeferredSection>}
      {!isMapFullscreen && <Footer id="footer" theme={theme} />}

      {/* Global MapSidePanel outside main stack context */}
      <MapSidePanel
        billboard={mapPanelBillboard}
        isOpen={showMapPanel}
        onClose={() => { setShowMapPanel(false); setMapPanelBillboard(null) }}
        onViewImage={setSelectedImage}
      />
    </div>
  )
}
