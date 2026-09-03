/**
 * مكون الإحصائيات السريعة - Stats Section Component
 * يعرض إحصائيات اللوحات المتاحة والقريبة حسب المقاس والبلدية بتصميم لوحة مؤشرات فاخرة
 */

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronUp, BarChart3, Building2, Ruler, MapPin, Sparkles, TrendingUp } from "lucide-react"
import { Billboard } from "@/types"
import { parseExpiryDate } from "@/utils/dateUtils"

interface StatsSectionProps {
  billboards: Billboard[]
  id?: string
}

export default function StatsSection({ billboards, id }: StatsSectionProps) {
  const { t } = useTranslation()
  const [showStats, setShowStats] = useState(false)
  const [expandedMunicipality, setExpandedMunicipality] = useState<string | null>(null)

  const now = new Date()
  const tenDaysDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000)
  const thirtyDaysDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  // حساب دقيق للتوفر
  const classifyBoard = (b: Billboard): 'available' | 'soon' | 'booked' => {
    const expiry = parseExpiryDate(b.expiryDate)
    if (b.status === 'متاح' || (expiry && expiry <= tenDaysDate)) return 'available'
    if (!expiry) return 'booked'
    if (expiry > tenDaysDate && expiry <= thirtyDaysDate) return 'soon'
    return 'booked'
  }

  // إحصائيات حسب المقاس
  const statsBySize = (() => {
    const sizeStats: { [key: string]: { available: number; soon: number; total: number } } = {}
    
    billboards.forEach(b => {
      const size = b.size || "غير محدد"
      if (!sizeStats[size]) {
        sizeStats[size] = { available: 0, soon: 0, total: 0 }
      }
      sizeStats[size].total++
      const c = classifyBoard(b)
      if (c === 'available') sizeStats[size].available++
      else if (c === 'soon') sizeStats[size].soon++
    })
    
    return Object.entries(sizeStats)
      .filter(([_, stats]) => stats.available > 0 || stats.soon > 0)
      .sort((a, b) => (b[1].available + b[1].soon) - (a[1].available + a[1].soon))
  })()

  // إحصائيات حسب البلدية
  const statsByMunicipality = (() => {
    const munStats: { [key: string]: { available: number; soon: number; total: number } } = {}
    
    billboards.forEach(b => {
      const mun = b.municipality || "غير محدد"
      if (!munStats[mun]) {
        munStats[mun] = { available: 0, soon: 0, total: 0 }
      }
      munStats[mun].total++
      const c = classifyBoard(b)
      if (c === 'available') munStats[mun].available++
      else if (c === 'soon') munStats[mun].soon++
    })
    
    return Object.entries(munStats)
      .filter(([_, stats]) => stats.available > 0 || stats.soon > 0)
      .sort((a, b) => (b[1].available + b[1].soon) - (a[1].available + a[1].soon))
  })()

  // إحصائيات المقاسات المتاحة حسب البلدية
  const sizesByMunicipality = (() => {
    const data: { [municipality: string]: { [size: string]: { available: number; soon: number } } } = {}
    
    billboards.forEach(b => {
      const mun = b.municipality || "غير محدد"
      const size = b.size || "غير محدد"
      
      if (!data[mun]) {
        data[mun] = {}
      }
      if (!data[mun][size]) {
        data[mun][size] = { available: 0, soon: 0 }
      }
      
      const c = classifyBoard(b)
      if (c === 'available') data[mun][size].available++
      else if (c === 'soon') data[mun][size].soon++
    })
    
    return data
  })()

  let totalAvailable = 0
  let totalSoon = 0
  billboards.forEach(b => {
    const c = classifyBoard(b)
    if (c === 'available') totalAvailable++
    else if (c === 'soon') totalSoon++
  })

  const uniqueMunicipalitiesCount = Array.from(new Set(billboards.map(b => b.municipality).filter(Boolean))).length
  const uniqueSizesCount = Array.from(new Set(billboards.map(b => b.size).filter(Boolean))).length

  return (
    <div id={id} className="mb-8 scroll-mt-20" style={{ fontFamily: 'Doran, Tajawal, sans-serif' }}>
      {/* Luxury Metric Summary Strip */}
      <div 
        onClick={() => setShowStats(!showStats)}
        className="premium-glass-card rounded-3xl p-4 sm:p-5 border border-primary/25 shadow-xl hover:border-primary/50 transition-all duration-300 cursor-pointer group"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Right: Section Badge & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/25 to-amber-500/10 border border-primary/40 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-all shadow-md">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-foreground text-sm md:text-base tracking-tight">إحصائيات سريعة ومؤشرات التوفر</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 border border-primary/30 text-[10px] font-bold text-primary">
                  <Sparkles className="w-2.5 h-2.5" />
                  محدّث لحظياً
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                نظرة شاملة على حالة اللوحات والبلديات والمقاسات الأكثر طلباً
              </p>
            </div>
          </div>

          {/* Center / Metrics Quick Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Available Metric Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-600 text-white border border-emerald-500 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse flex-shrink-0" />
              <span className="text-xs font-bold text-white">متاح الآن:</span>
              <span className="text-sm font-black text-white font-mono">{totalAvailable}</span>
            </div>

            {/* Soon Metric Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-amber-600 text-white border border-amber-500 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
              <span className="text-xs font-bold text-white">قريباً:</span>
              <span className="text-sm font-black text-white font-mono">{totalSoon}</span>
            </div>

            {/* Municipalities Count */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card border border-border/70 shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground/80">البلديات:</span>
              <span className="text-xs font-black text-foreground">{uniqueMunicipalitiesCount}</span>
            </div>

            {/* Sizes Count */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-card border border-border/70 shadow-sm">
              <Ruler className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-bold text-foreground/80">المقاسات:</span>
              <span className="text-xs font-black text-foreground">{uniqueSizesCount}</span>
            </div>

            {/* Expand / Collapse Button */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-primary/10 border border-primary/30 text-primary text-xs font-black hover:bg-primary hover:text-primary-foreground transition-all shadow-sm">
              <span>{showStats ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}</span>
              {showStats ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Analytics Bento Grid */}
      {showStats && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 md:p-6 bg-white dark:bg-card rounded-3xl border-2 border-primary/25 shadow-xl animate-fade-in">
          
          {/* 1. إحصائيات حسب المقاس */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h4 className="font-black text-slate-900 dark:text-foreground text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-primary" />
                </div>
                <span>التوفر حسب المقاسات الأكثر طلباً</span>
              </h4>
              <span className="text-[11px] font-black text-slate-600 dark:text-muted-foreground">({statsBySize.length} مقاس)</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {statsBySize.map(([size, stats]) => (
                <div key={size} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-secondary/40 rounded-2xl border border-slate-200 dark:border-border/50 hover:border-primary/60 transition-colors shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 dark:text-foreground text-xs">{size}</span>
                    <span className="text-[10.5px] font-bold text-slate-600 dark:text-muted-foreground">({stats.total} لوحة إجمالاً)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {stats.available > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black shadow-sm">
                        {stats.available} متاح
                      </span>
                    )}
                    {stats.soon > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-600 text-white font-black shadow-sm">
                        {stats.soon} قريباً
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. إحصائيات حسب البلدية */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h4 className="font-black text-slate-900 dark:text-foreground text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <span>التوزيع الجغرافي حسب البلديات</span>
              </h4>
              <span className="text-[11px] font-black text-slate-600 dark:text-muted-foreground">({statsByMunicipality.length} بلدية)</span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {statsByMunicipality.map(([mun, stats]) => (
                <div key={mun} className="bg-slate-50 dark:bg-secondary/40 rounded-2xl border border-slate-200 dark:border-border/50 overflow-hidden transition-all hover:border-primary/60 shadow-sm">
                  {/* Municipality Header Button */}
                  <button
                    onClick={() => setExpandedMunicipality(expandedMunicipality === mun ? null : mun)}
                    className="w-full flex items-center justify-between p-2.5 hover:bg-primary/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                      <span className="font-black text-slate-900 dark:text-foreground text-xs">{mun}</span>
                      <span className="text-[10.5px] font-bold text-slate-600 dark:text-muted-foreground">({stats.total})</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {stats.available > 0 && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-600 text-white font-black shadow-sm">
                          {stats.available} متاح
                        </span>
                      )}
                      {stats.soon > 0 && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-600 text-white font-black shadow-sm">
                          {stats.soon} قريباً
                        </span>
                      )}
                      <div className="p-1 text-slate-700 dark:text-muted-foreground">
                        {expandedMunicipality === mun ? (
                          <ChevronUp className="w-3.5 h-3.5 stroke-[2.5]" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {/* Sizes Breakdown Accordion */}
                  {expandedMunicipality === mun && sizesByMunicipality[mun] && (
                    <div className="border-t border-slate-200 dark:border-border/30 p-2.5 bg-white dark:bg-secondary/60 space-y-1.5">
                      <p className="text-[11px] text-slate-700 dark:text-muted-foreground font-black mb-1">المقاسات المتوفرة في {mun}:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(sizesByMunicipality[mun])
                          .filter(([_, sizeStats]) => sizeStats.available > 0 || sizeStats.soon > 0)
                          .sort((a, b) => (b[1].available + b[1].soon) - (a[1].available + a[1].soon))
                          .map(([size, sizeStats]) => (
                            <div 
                              key={size} 
                              className="flex items-center gap-1.5 bg-slate-100 dark:bg-card rounded-xl px-2.5 py-1 border border-slate-200 dark:border-border/50 text-xs shadow-sm"
                            >
                              <span className="font-extrabold text-slate-900 dark:text-foreground">{size}</span>
                              {sizeStats.available > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-600 text-white font-black">
                                  {sizeStats.available} متاح
                                </span>
                              )}
                              {sizeStats.soon > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-600 text-white font-black">
                                  {sizeStats.soon} قريباً
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

