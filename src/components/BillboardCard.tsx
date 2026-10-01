import { Navigation, Check, Plus, Ruler, Layers, Copy, Clock } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Billboard } from "@/types"
import { DisplayMode } from "@/hooks/useDisplayMode"
import { getDaysRemaining, getStatusFromExpiry } from "@/utils/dateUtils"
import { toast } from "@/hooks/use-toast"

interface BillboardCardProps {
  billboard: Billboard
  isSelected: boolean
  onToggleSelection: (billboardId: string) => void
  onViewImage: (imageUrl: string) => void
  onShowMap: (billboard: Billboard) => void
  displayMode?: DisplayMode
  onFilterByArea?: (area: string) => void
  onFilterByMunicipality?: (municipality: string) => void
  onFilterByCity?: (city: string) => void
  onFilterBySize?: (size: string) => void
  onFilterByType?: (type: string) => void
}

export default function BillboardCard({
  billboard,
  isSelected,
  onToggleSelection,
  onViewImage,
  onShowMap,
  displayMode,
  onFilterByArea,
  onFilterByMunicipality,
  onFilterByCity,
  onFilterBySize,
  onFilterByType,
}: BillboardCardProps) {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar')
  const [copied, setCopied] = useState(false)
  const copyTimer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => () => clearTimeout(copyTimer.current), [])

  const copyCode = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(billboard.name || billboard.id)
      clearTimeout(copyTimer.current)
      setCopied(true)
      copyTimer.current = setTimeout(() => setCopied(false), 2000)
      toast({
        title: ar ? 'تم النسخ' : 'Copied',
        description: billboard.name || billboard.id,
      })
    } catch {
      toast({
        title: ar ? 'تعذّر النسخ التلقائي' : 'Unable to copy',
        description: ar ? 'يمكنك تحديد الكود ونسخه يدوياً.' : 'Select the visible code and copy it manually.',
        variant: 'destructive',
      })
    }
  }

  const days = getDaysRemaining(billboard.expiryDate)
  const effectiveStatus = billboard.expiryDate ? getStatusFromExpiry(billboard.expiryDate) : (billboard.status || 'متاح')
  const status = effectiveStatus === 'متاح' ? 'available' : effectiveStatus === 'قريباً' ? 'soon' : 'rented'

  const statusLabel = status === 'soon' && days !== null ? (ar ? 'سيتاح بعد ' + days + ' يوم' : 'Available in ' + days + ' days') : status === 'available'
    ? t('status.available')
    : status === 'soon'
      ? t('status.soon')
      : t('status.rented')

  const location = billboard.landmark || billboard.location || billboard.city

  return (
    <article
      className={'catalog-card' + (isSelected ? ' is-selected' : '') + (displayMode === 'compact' ? ' is-compact' : '')}
      dir={ar ? 'rtl' : 'ltr'}
    >
      {/* Media with Badges & Controls Overlaid at the Top */}
      <div className="catalog-card-media">
        <button
          type="button"
          className="catalog-image-button"
          onClick={() => onViewImage(billboard.imageUrl || '/roadside-billboard.png')}
          aria-label={(ar ? 'معاينة صورة اللوحة ' : 'Preview billboard ') + (billboard.name || location)}
        >
          <img
            src={billboard.imageUrl || '/roadside-billboard.png'}
            alt={location}
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.onerror = null
              e.currentTarget.src = '/roadside-billboard.png'
            }}
          />
          <div className="card-image-gradient-top" />
          <div className="card-image-gradient-bottom" />
        </button>

        {/* Top Overlay: Availability + Size on Start side, Quick Selection on End side */}
        <div className="card-top-overlay">
          <div className="card-badges-group">
            <span className={'catalog-status status-' + status}>
              <span />
              {statusLabel}
            </span>
            {billboard.size && (
              <button
                type="button"
                className="card-badge card-badge-size"
                onClick={(e) => {
                  e.stopPropagation()
                  onFilterBySize?.(billboard.size)
                }}
                disabled={!onFilterBySize}
                title={t('card.filter_by_size', { size: billboard.size })}
              >
                <Ruler size={13} />
                <bdi>{billboard.size}</bdi>
              </button>
            )}
          </div>

          {/* Quick Selection Button */}
          <button
            type="button"
            className={'card-select-btn' + (isSelected ? ' is-selected' : '')}
            onClick={(e) => {
              e.stopPropagation()
              onToggleSelection(billboard.id)
            }}
            aria-pressed={isSelected}
            title={isSelected ? (ar ? 'إلغاء التحديد من الحملة' : 'Remove from campaign') : (ar ? 'أضف اللوحة إلى الحملة' : 'Add to campaign')}
          >
            {isSelected ? <Check size={14} className="stroke-[2.5]" /> : <Plus size={14} className="stroke-[2.5]" />}
            <span>{isSelected ? (ar ? 'تم التحديد' : 'Selected') : (ar ? 'أضف للحملة' : 'Shortlist')}</span>
          </button>
        </div>

        {/* Bottom Overlay on Image: Type & Faces on Start side, Code on End side */}
        <div className="card-bottom-overlay">
          {(billboard.billboardType?.trim() || billboard.facesCount?.trim()) ? (
            <div className="card-badge card-badge-specs">
              {billboard.billboardType?.trim() && (
                <button
                  type="button"
                  className="hover:underline flex items-center gap-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onFilterByType?.(billboard.billboardType)
                  }}
                  disabled={!onFilterByType}
                  title={ar ? `تصفية حسب: ${billboard.billboardType}` : `Filter by: ${billboard.billboardType}`}
                >
                  <Layers size={13} />
                  <span>{billboard.billboardType}</span>
                </button>
              )}
              {billboard.billboardType?.trim() && billboard.facesCount?.trim() && (
                <span className="opacity-40">·</span>
              )}
              {billboard.facesCount?.trim() && (
                <span>{billboard.facesCount}</span>
              )}
            </div>
          ) : <div />}

          {/* Days Remaining Countdown in Center of Image Bottom */}
          {days !== null && days > 0 ? (
            <span
              className={`card-badge card-badge-days ${days <= 20 ? 'is-soon' : 'is-rented'}`}
              title={ar ? `متبقي ${days} يوم حتى انتهاء الحجز` : `${days} days left`}
            >
              <Clock size={11} className="flex-shrink-0" />
              <span>{ar ? `متبقي ${days} يوم` : `${days}d left`}</span>
            </span>
          ) : <div />}

          {/* Billboard Code with Instant Copy */}
          <button
            type="button"
            className="card-code-btn"
            onClick={copyCode}
            title={copied ? (ar ? 'تم النسخ!' : 'Copied!') : (ar ? 'نسخ كود اللوحة' : 'Copy billboard code')}
          >
            <bdi>{billboard.name || billboard.id}</bdi>
            {copied ? <Check size={12} className="text-emerald-400 stroke-[2.5]" /> : <Copy size={12} className="opacity-70" />}
          </button>
        </div>
      </div>

      {/* Streamlined Card Body */}
      <div className="catalog-card-body">
        <h3 title={location}>{location}</h3>

        <div className="catalog-location" aria-label={ar ? 'المنطقة والبلدية والمدينة' : 'Area, municipality and city'}>
          {[
            { value: billboard.area, label: ar ? 'المنطقة' : 'Area', handler: onFilterByArea },
            { value: billboard.municipality, label: ar ? 'البلدية' : 'Municipality', handler: onFilterByMunicipality },
            { value: billboard.city, label: ar ? 'المدينة' : 'City', handler: onFilterByCity },
          ].filter((field, index, fields) => field.value && !fields.slice(0, index).some(previous => previous.value === field.value)).map(field => (
            <button key={field.label} type="button" onClick={() => field.handler?.(field.value)} disabled={!field.handler}
              title={`${field.label}: ${field.value}`} aria-label={`${field.label}: ${field.value}`}>
              {field.value}
            </button>
          ))}
        </div>
        {/* Single Focused Action */}
        <div className="catalog-card-actions">
          <button
            type="button"
            className="brand-button brand-button-map"
            onClick={() => onShowMap(billboard)}
            title={ar ? 'عرض تفاصيل وموقع اللوحة على الخريطة' : 'View on map'}
          >
            <Navigation size={15} />
            <span>{ar ? 'الموقع على الخريطة' : 'Location on Map'}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
