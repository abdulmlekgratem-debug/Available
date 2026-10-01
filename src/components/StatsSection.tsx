import { availabilityStatus } from '@/utils/availability'
/**
 * مكون الإحصائيات السريعة - Stats Section Component
 * يعرض إحصائيات اللوحات المتاحة والقريبة حسب المقاس والبلدية بتصميم لوحة مؤشرات فاخرة
 */

import { useState } from "react"
import { ChevronDown, ChevronUp, Building2, Ruler, MapPin } from "lucide-react"
import { Billboard } from "@/types"

interface StatsSectionProps {
  billboards: Billboard[]
  id?: string
  sizeOrder: string[]
  municipalityOrder: string[]
}

export default function StatsSection({ billboards, id, sizeOrder, municipalityOrder }: StatsSectionProps) {
  const [showStats, setShowStats] = useState(false)
  const [expandedMunicipality, setExpandedMunicipality] = useState<string | null>(null)

  const classifyBoard = (b: Billboard) => availabilityStatus(b)
  const position = (order: string[], value: string) => {
    const index = order.indexOf(value)
    return index < 0 ? order.length : index
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
      .sort((a, b) => position(sizeOrder, a[0]) - position(sizeOrder, b[0]))
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
      .sort((a, b) => position(municipalityOrder, a[0]) - position(municipalityOrder, b[0]))
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
      <section className="stats-overview" aria-label="إحصائيات التوفر">
        <div className="stats-overview-heading">
          <h3>إحصائيات التوفر</h3>
          <button type="button" className="stats-details-toggle" aria-expanded={showStats} aria-controls="stats-details" onClick={() => setShowStats(!showStats)}>
            {showStats ? 'إخفاء التفاصيل' : 'عرض التفاصيل'}
            <ChevronDown size={16} style={{ transform: showStats ? 'rotate(180deg)' : undefined }} />
          </button>
        </div>
        <div className="stats-metrics">
          {[
            { label: 'متاح الآن', value: totalAvailable },
            { label: 'سيتاح خلال 20 يومًا', value: totalSoon },
            { label: 'البلديات', value: uniqueMunicipalitiesCount },
            { label: 'المقاسات', value: uniqueSizesCount },
          ].map(metric => <div className="stats-metric" key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
        </div>
      </section>
      {/* Expanded Analytics Bento Grid */}
      {showStats && (
        <div id="stats-details" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5 p-5 md:p-6 bg-white dark:bg-card rounded-3xl border border-border shadow-none">
          
          {/* 1. إحصائيات حسب المقاس */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <h4 className="font-black text-slate-900 dark:text-foreground text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
                  <Ruler className="w-4 h-4 text-primary" />
                </div>
                <span>التوفر حسب المقاس</span>
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
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-primary/15 text-foreground font-black shadow-sm">
                        {stats.available} متاح
                      </span>
                    )}
                    {stats.soon > 0 && (
                      <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-muted text-foreground font-black shadow-sm">
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
                        <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-primary/15 text-foreground font-black shadow-sm">
                          {stats.available} متاح
                        </span>
                      )}
                      {stats.soon > 0 && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-muted text-foreground font-black shadow-sm">
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
                          .sort((a, b) => position(sizeOrder, a[0]) - position(sizeOrder, b[0]))
                          .map(([size, sizeStats]) => (
                            <div 
                              key={size} 
                              className="flex items-center gap-1.5 bg-slate-100 dark:bg-card rounded-xl px-2.5 py-1 border border-slate-200 dark:border-border/50 text-xs shadow-sm"
                            >
                              <span className="font-extrabold text-slate-900 dark:text-foreground">{size}</span>
                              {sizeStats.available > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-foreground font-black">
                                  {sizeStats.available} متاح
                                </span>
                              )}
                              {sizeStats.soon > 0 && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-foreground font-black">
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

