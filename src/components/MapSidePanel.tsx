import { useEffect, useRef, useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { X, MapPin, Clock, Maximize2, ZoomIn, ZoomOut, ChevronRight, Copy, Check, Building2, Tag, Navigation, Globe, Satellite, Map as MapIcon, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Billboard } from "@/types"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { createMarkerIcon, getDaysRemaining } from "@/hooks/useMapMarkers"
import { getStatusFromExpiry } from "@/utils/dateUtils"
import { OSM_TILE_LAYERS } from "@/types/map"
import { WHATSAPP_NUMBER } from "@/constants/contact"

const FONT_AR = { fontFamily: 'Doran, Tajawal, sans-serif' }
const FONT_EN = { fontFamily: 'Manrope, monospace' }

interface MapSidePanelProps {
  billboard: Billboard | null
  isOpen: boolean
  onClose: () => void
  onViewImage: (imageUrl: string) => void
}

const MAP_LAYERS = [
  { id: 'google-hybrid', label: 'هجين', icon: Globe },
  { id: 'google-nolabels', label: 'فضائي', icon: Satellite },
  { id: 'standard', label: 'شوارع', icon: MapIcon },
]

export default function MapSidePanel({ billboard, isOpen, onClose, onViewImage }: MapSidePanelProps) {
  const { t, i18n } = useTranslation()
  const ar = i18n.language !== 'en'
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const tileLayerRef = useRef<L.TileLayer | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [currentLayer, setCurrentLayer] = useState('google-hybrid')
  const [copiedCode, setCopiedCode] = useState(false)
  
  // Swipe to close
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchCurrent, setTouchCurrent] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.leaflet-container') || target.closest('button') || target.closest('a') || target.closest('[data-no-swipe]')) {
      return
    }
    setTouchStart(e.touches[0].clientX)
    setTouchCurrent(e.touches[0].clientX)
    setIsDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging || touchStart === null) return
    setTouchCurrent(e.touches[0].clientX)
  }, [isDragging, touchStart])

  const handleTouchEnd = useCallback(() => {
    if (touchStart !== null && touchCurrent !== null) {
      const diff = touchCurrent - touchStart
      if (diff > 120) onClose()
    }
    setTouchStart(null)
    setTouchCurrent(null)
    setIsDragging(false)
  }, [touchStart, touchCurrent, onClose])

  const swipeOffset = isDragging && touchStart !== null && touchCurrent !== null
    ? Math.max(0, touchCurrent - touchStart) : 0

  const switchLayer = (layerId: string) => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return
    const config = OSM_TILE_LAYERS[layerId]
    if (!config) return

    mapInstanceRef.current.removeLayer(tileLayerRef.current)
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: config.maxZoom || 18
    }).addTo(mapInstanceRef.current)
    setCurrentLayer(layerId)
  }

  const handleZoomIn = () => { mapInstanceRef.current?.zoomIn() }
  const handleZoomOut = () => { mapInstanceRef.current?.zoomOut() }

  useEffect(() => {
    if (!isOpen || !billboard || !mapRef.current) return

    const coords = billboard.coordinates.split(",").map((c) => parseFloat(c.trim()))
    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) return
    const [lat, lng] = coords

    if (!mapInstanceRef.current) {
      const tileConfig = OSM_TILE_LAYERS[currentLayer] || OSM_TILE_LAYERS['google-hybrid']
      
      mapInstanceRef.current = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        maxZoom: 18,
        minZoom: 5,
        touchZoom: true,
        dragging: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
      })

      tileLayerRef.current = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: tileConfig.maxZoom || 18
      }).addTo(mapInstanceRef.current)

      setMapLoaded(true)
    } else {
      mapInstanceRef.current.setView([lat, lng], 15)
    }

    if (markerRef.current) {
      markerRef.current.remove()
    }

    const days = getDaysRemaining(billboard.expiryDate || null)
    const iconData = createMarkerIcon(billboard.size, billboard.status, true, days)
    
    const icon = L.icon({
      iconUrl: iconData.url,
      iconSize: [iconData.size.width, iconData.size.height],
      iconAnchor: [iconData.anchor.x, iconData.anchor.y],
    })

    markerRef.current = L.marker([lat, lng], { icon, title: billboard.name }).addTo(mapInstanceRef.current)
  }, [isOpen, billboard])

  useEffect(() => {
    if (!isOpen) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
      tileLayerRef.current = null
      markerRef.current = null
      setMapLoaded(false)
      setCurrentLayer('google-hybrid')
    }
  }, [isOpen])

  if (!billboard) return null

  const daysRemaining = getDaysRemaining(billboard.expiryDate || null)

  const handleCopyCode = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(billboard.name)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 1500)
  }

  const effectiveStatus = getStatusFromExpiry(billboard.expiryDate)

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/80 backdrop-blur-md z-[100000] transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Side Panel Container (متجاوب تماماً مع الوضع الفاتح والداكن) */}
      <div 
        ref={panelRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[540px] md:w-[620px] lg:w-[720px] bg-card text-foreground border-r border-border/30 z-[100001] shadow-2xl transition-transform duration-500 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{
          transform: isOpen ? `translateX(${swipeOffset}px)` : 'translateX(100%)',
          transition: isDragging ? 'none' : 'transform 0.5s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Swipe Close Indicator on Mobile */}
        <div className="md:hidden absolute top-1/2 -translate-y-1/2 left-0 w-5 h-20 bg-muted/50 rounded-r-xl flex items-center justify-center z-[60] pointer-events-none">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>

        {/* Top Close Button (أقصى اليمين في الأعلى - واضح ومريح) */}
        <button
          type="button"
          onClick={onClose}
          className="
            absolute top-3 right-3 md:top-4 md:right-4 z-[100]
            w-11 h-11 rounded-full
            bg-card/95 border-2 border-primary text-primary
            hover:bg-destructive hover:border-destructive hover:text-white
            flex items-center justify-center
            shadow-2xl backdrop-blur-md
            transition-all duration-200 hover:scale-110 active:scale-95
            cursor-pointer
          "
          title="إغلاق الخريطة"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>

        {/* Scrollable Container for Image + Map + Info */}
        <div className="h-full flex flex-col overflow-y-auto overscroll-contain">
          
          {/* 1. Image Container */}
          <div className="relative h-[38vh] md:h-[45%] flex-shrink-0 bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Blurred background image */}
            <img
              src={billboard.imageUrl || "/roadside-billboard.png"}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 select-none pointer-events-none"
              onError={(e) => { (e.target as HTMLImageElement).src = "/roadside-billboard.png" }}
            />

            {/* Crisp centered image */}
            <img
              src={billboard.imageUrl || "/roadside-billboard.png"}
              alt={billboard.name}
              className="relative z-10 w-full h-full object-contain cursor-zoom-in"
              onClick={() => onViewImage(billboard.imageUrl)}
              onError={(e) => { (e.target as HTMLImageElement).src = "/roadside-billboard.png" }}
            />
            
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 z-20 pointer-events-none" />
            
            {/* Badges on Top Left (Size & Status) */}
            <div className="absolute top-3 left-3 flex items-center gap-2 z-30">
              <Badge className="bg-card/95 border border-primary/40 text-primary font-black px-2.5 py-1 rounded-lg shadow-xl text-xs" style={FONT_EN}>
                {billboard.size}
              </Badge>

              <Badge className={`px-2.5 py-1 rounded-lg font-black text-xs shadow-xl text-white ${
                effectiveStatus === "متاح" ? "bg-emerald-600 border border-emerald-400/30"
                  : effectiveStatus === "قريباً" ? "bg-amber-600 border border-amber-400/30"
                  : "bg-red-600 border border-red-400/30"
              }`} style={FONT_AR}>
                <span className={`w-1.5 h-1.5 rounded-full ml-1.5 inline-block ${
                  effectiveStatus === "متاح" ? "bg-white animate-pulse" : "bg-white/80"
                }`} />
                {effectiveStatus === "متاح" ? t('status.available') : effectiveStatus === "قريباً" ? t('status.soon') : t('status.rented')}
              </Badge>
            </div>

            {/* View Full Image Overlay Action */}
            <div className="absolute bottom-3 left-3 z-30">
              <Button
                size="sm"
                className="bg-card/95 hover:bg-primary hover:text-primary-foreground text-foreground border border-primary/40 rounded-xl px-3 py-1.5 shadow-xl text-xs font-bold transition-all backdrop-blur-md"
                onClick={() => onViewImage(billboard.imageUrl)}
                style={FONT_AR}
              >
                <Maximize2 className="w-3.5 h-3.5 ml-1.5" />
                {t('panel.view_image') || "تكبير الصورة"}
              </Button>
            </div>
          </div>

          {/* 2. Interactive Map Section */}
          <div 
            data-no-swipe="true"
            className="relative h-[36vh] md:h-[40%] bg-muted flex-shrink-0 border-y border-border/30"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <div ref={mapRef} className="w-full h-full" />
            
            {!mapLoaded && isOpen && (
              <div className="absolute inset-0 bg-card flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Clean Segmented Map Layer Selector (شريط تبديل الخرائط الأنيق) */}
            <div className="absolute top-3 left-3 flex items-center gap-1 z-30 bg-card/90 backdrop-blur-md p-1 rounded-xl border border-border/60 shadow-xl">
              {MAP_LAYERS.map((layer) => {
                const Icon = layer.icon
                const isActive = currentLayer === layer.id
                return (
                  <button
                    key={layer.id}
                    onClick={() => switchLayer(layer.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary text-primary-foreground shadow-md font-black' 
                        : 'text-foreground/80 hover:text-foreground hover:bg-secondary/80'
                    }`}
                    style={FONT_AR}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{layer.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Generous Easy-Touch Zoom Controls (أزرار تكبير وتصغير مريحة وبارزة) */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-30">
              <button
                type="button"
                className="bg-card/95 border-2 border-primary/50 hover:bg-primary hover:text-primary-foreground text-primary rounded-xl shadow-2xl w-11 h-11 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                onClick={handleZoomIn}
                title="تكبير الخريطة (+)"
              >
                <ZoomIn className="w-5 h-5 stroke-[2.5]" />
              </button>
              <button
                type="button"
                className="bg-card/95 border-2 border-primary/50 hover:bg-primary hover:text-primary-foreground text-primary rounded-xl shadow-2xl w-11 h-11 flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
                onClick={handleZoomOut}
                title="تصغير الخريطة (-)"
              >
                <ZoomOut className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Location Label Badge inside Map */}
            <div className="absolute bottom-3 right-3 bg-card/95 backdrop-blur-md rounded-xl px-3 py-1.5 shadow-xl border border-primary/30 max-w-[65%] z-30">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
                <span className="font-extrabold text-xs text-foreground truncate" style={FONT_AR}>{billboard.location}</span>
              </div>
            </div>
          </div>

          {/* 3. Info Content Section (متجاوب 100% مع الوضع الفاتح والداكن وخطوط واضحة) */}
          <div className="p-4 flex flex-col gap-3 bg-card text-foreground border-t border-border/30 flex-1" style={FONT_AR}>
            
            {/* Header Row: Code (Right) | Days Left (Center) | Specs (Left) */}
            <div className="flex items-center justify-between gap-2 border-b border-border/20 pb-2.5">
              {/* Right: Code + Copy */}
              <div className="flex items-center gap-1.5 min-w-0">
                <h3 className="text-sm md:text-base font-black text-foreground tracking-wide truncate" style={FONT_EN}>
                  {billboard.name}
                </h3>
                <button
                  onClick={handleCopyCode}
                  className="p-1 text-muted-foreground hover:text-primary transition-colors"
                  title="نسخ الكود"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Center: Days remaining badge */}
              {daysRemaining !== null && daysRemaining > 0 ? (
                <div
                  title={`متبقي ${daysRemaining} يوم`}
                  className={`
                    inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg
                    text-white text-xs font-black whitespace-nowrap shadow-sm
                    ${effectiveStatus === 'محجوز'
                      ? 'bg-red-600 border border-red-500'
                      : 'bg-amber-600 border border-amber-500'
                    }
                  `}
                  style={FONT_EN}
                >
                  <Clock className="w-3.5 h-3.5 text-white flex-shrink-0" />
                  <span>متبقي {daysRemaining} يوم</span>
                </div>
              ) : (
                <div />
              )}

              {/* Left: Technical Specs Badges */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {billboard.billboardType.trim() && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-foreground font-black text-xs">
                    <Tag className="w-3 h-3 text-primary flex-shrink-0" />
                    <span>{billboard.billboardType}</span>
                  </span>
                )}

                {billboard.facesCount.trim() && (
                  <span className="px-2 py-0.5 rounded-md bg-secondary border border-border/60 text-foreground text-xs font-black">
                    {billboard.facesCount}
                  </span>
                )}
              </div>
            </div>

            {/* Location Info Section */}
            <div className="space-y-2 pt-1">
              {/* أقرب نقطة دالة */}
              <div className="flex items-start gap-2" title={billboard.landmark || billboard.location}>
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-sm md:text-base font-extrabold leading-relaxed text-foreground text-right">
                  {billboard.landmark || billboard.location}
                </p>
              </div>

              {/* المنطقة والبلدية والمدينة */}
              <div className="flex flex-wrap items-center gap-2 pr-7 pt-0.5">
                {billboard.area && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary border border-border/60 text-foreground text-xs md:text-[13px] font-black shadow-sm">
                    {billboard.area}
                  </span>
                )}

                {billboard.municipality && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary border border-border/60 text-foreground text-xs md:text-[13px] font-bold shadow-sm">
                    <Building2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    <span>{billboard.municipality}</span>
                  </span>
                )}

                {billboard.city && billboard.city !== billboard.municipality && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border/40 text-muted-foreground text-xs font-bold">
                    {billboard.city}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Open in Google Maps & WhatsApp */}
            <div className="pt-2 mt-auto grid grid-cols-2 gap-2">
              <Button
                className="
                  flex items-center justify-center gap-1.5
                  font-black rounded-xl text-xs sm:text-sm py-2.5
                  bg-secondary text-foreground hover:bg-secondary/80 border border-border/60
                  active:scale-[0.98] transition-all duration-200
                "
                onClick={() => {
                  const url = billboard.gpsLink || `https://www.google.com/maps?q=${billboard.coordinates}`
                  window.open(url, "_blank")
                }}
              >
                <Navigation className="w-4 h-4 flex-shrink-0 text-primary" />
                <span>{ar ? 'الاتجاهات' : 'Directions'}</span>
              </Button>

              <Button
                className="
                  flex items-center justify-center gap-1.5
                  font-black rounded-xl text-xs sm:text-sm py-2.5
                  bg-[#d6ac40] hover:bg-[#e4be54] text-[#141414]
                  shadow-[0_2px_12px_rgba(214,172,64,0.35)]
                  active:scale-[0.98] transition-all duration-200
                "
                onClick={() => {
                  const msg = `مرحباً، أريد الاستفسار عن حجز اللوحة: ${billboard.name || billboard.id}\nالموقع: ${billboard.location}\nالمقاس: ${billboard.size || ''}`
                  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank")
                }}
              >
                <MessageCircle className="w-4 h-4 flex-shrink-0" />
                <span>{ar ? 'استفسار واتساب' : 'WhatsApp Enquiry'}</span>
              </Button>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
