import { Search, Grid, List, FileDown, FileSpreadsheet, Map, RotateCcw, Locate, Loader2, X } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "@/hooks/use-toast"

interface SearchFiltersProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  selectedMunicipalities: string[]
  setSelectedMunicipalities: (municipalities: string[]) => void
  selectedCities: string[]
  setSelectedCities: (cities: string[]) => void
  selectedAreas: string[]
  setSelectedAreas: (areas: string[]) => void
  selectedSizes: string[]
  setSelectedSizes: (sizes: string[]) => void
  selectedAvailability: string[]
  setSelectedAvailability?: (availability: string[]) => void
  viewMode: "grid" | "list"
  setViewMode: (mode: "grid" | "list") => void
  showMap: boolean
  setShowMap: (show: boolean) => void
  municipalities: string[]
  cities: string[]
  areas: string[]
  sizes: string[]
  availabilityOptions: { value: string; label: string }[]
  totalCount: number
  onPrint: () => void
  onExcel?: () => void
  onNearbyFilter?: (lat: number, lng: number, radius: number) => void
  isNearbyActive?: boolean
  onClearNearby?: () => void
}


export default function SearchFilters(p: SearchFiltersProps) {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar')
  const [isLocating, setIsLocating] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const advancedCount = p.selectedMunicipalities.length + p.selectedAreas.length
  const count = p.selectedMunicipalities.length + p.selectedCities.length + p.selectedAreas.length + p.selectedSizes.length + (p.searchTerm ? 1 : 0) + (p.isNearbyActive ? 1 : 0) + (p.selectedAvailability.some(v => v !== 'all') ? 1 : 0)
  const clear = () => {
    p.setSearchTerm('')
    p.setSelectedMunicipalities([])
    p.setSelectedCities([])
    p.setSelectedAreas([])
    p.setSelectedSizes([])
    p.setSelectedAvailability?.(['all'])
    p.onClearNearby?.()
  }
  const nearby = () => {
    if (!navigator.geolocation) {
      toast({ title: t('search.location_error_default'), description: t('search.location_error_unavailable'), variant: 'destructive' })
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(position => {
      setIsLocating(false)
      p.onNearbyFilter?.(position.coords.latitude, position.coords.longitude, 10)
    }, error => {
      setIsLocating(false)
      toast({ title: t('search.location_error_default'), description: t(error.code === 1 ? 'search.location_error_permission' : error.code === 3 ? 'search.location_error_timeout' : 'search.location_error_unavailable'), variant: 'destructive' })
    }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 })
  }
  return (
    <section className="catalog-search" aria-labelledby="catalog-heading" dir={ar ? 'rtl' : 'ltr'}>
      <div className="catalog-heading">
        <div><h2 id="catalog-heading">{ar ? 'اللوحات الإعلانية' : 'Billboards'}</h2></div>
        <button type="button" className="brand-button catalog-map-toggle" onClick={() => p.setShowMap(!p.showMap)} aria-pressed={p.showMap}><Map size={20} aria-hidden="true" /><span>{p.showMap ? t('search.hide_map') : t('search.show_map')}</span></button>
      </div>
      <div className="search-surface">
        <div className="search-main-fields">
          <div className="search-keyword"><label htmlFor="billboard-search-input">{t('search.label')}</label><div className="search-input-wrap"><Search size={19} /><input id="billboard-search-input" type="search" value={p.searchTerm} placeholder={ar ? 'رقم اللوحة، المنطقة، أو أقرب معلم…' : 'Billboard code, area, or landmark…'} onChange={e => p.setSearchTerm(e.target.value)} autoComplete="off" />{p.searchTerm && <button onClick={() => p.setSearchTerm('')} aria-label={t('search.clear_search')}><X size={17} /></button>}</div></div>
          <div className="search-field"><span id="city-filter-label">{t('search.city')}</span><MultiSelect labelId="city-filter-label" values={p.selectedCities} onValuesChange={p.setSelectedCities} options={p.cities} allLabel={t('search.all_cities')} /></div>
          <div className="search-field"><span id="size-filter-label">{t('search.size')}</span><MultiSelect labelId="size-filter-label" values={p.selectedSizes} onValuesChange={p.setSelectedSizes} options={p.sizes} allLabel={t('search.all_sizes')} /></div>
        </div>
        <details className="search-disclosure" open={advancedOpen} onToggle={e => setAdvancedOpen(e.currentTarget.open)}>
          <summary>{ar ? 'فلاتر إضافية وتصدير' : 'More filters & export'}{advancedCount > 0 && <span className="filter-count">{advancedCount}</span>}</summary>
        <div className="search-advanced" id="advanced-filters">
          <div className="search-field"><span id="municipality-filter-label">{t('search.municipality')}</span><MultiSelect labelId="municipality-filter-label" values={p.selectedMunicipalities} onValuesChange={p.setSelectedMunicipalities} options={p.municipalities} allLabel={t('search.all_municipalities')} /></div>
          <div className="search-field"><span id="area-filter-label">{t('search.area')}</span><MultiSelect labelId="area-filter-label" values={p.selectedAreas} onValuesChange={p.setSelectedAreas} options={p.areas} allLabel={t('search.all_areas')} /></div>
          <div className="search-export"><span>{ar ? 'تصدير نتائج البحث' : 'Export search results'}</span><div><button className="quiet-button" onClick={p.onPrint}><FileDown size={16} />PDF</button>{p.onExcel && <button className="quiet-button" onClick={p.onExcel}><FileSpreadsheet size={16} />Excel</button>}</div></div>
        </div>
        </details>
        <div className="search-tools">

          <button className="quiet-button" onClick={p.isNearbyActive ? p.onClearNearby : nearby} disabled={isLocating} aria-pressed={!!p.isNearbyActive}>{isLocating ? <Loader2 className="animate-spin" size={17} /> : <Locate size={17} />}{isLocating ? t('search.locating') : p.isNearbyActive ? (ar ? 'إلغاء القريب مني (10 كم)' : 'Clear nearby (10 km)') : (ar ? 'القريب مني' : 'Near me')}</button>
          {count > 0 && <button className="quiet-button search-reset" onClick={clear}><RotateCcw size={15} />{t('search.clear')}<span className="filter-count">{count}</span></button>}
        </div>

      </div>
      <div className="catalog-view-tools"><span aria-live="polite">{t('search.results_count', { count: p.totalCount })}</span><div className="view-switch" role="group" aria-label={ar ? 'طريقة عرض اللوحات' : 'Billboard layout'}><button aria-pressed={p.viewMode === 'grid'} aria-label={ar ? 'عرض شبكي' : 'Grid view'} onClick={() => p.setViewMode('grid')}><Grid size={17} /></button><button aria-pressed={p.viewMode === 'list'} aria-label={ar ? 'عرض قائمة' : 'List view'} onClick={() => p.setViewMode('list')}><List size={18} /></button></div></div>
    </section>
  )
}
