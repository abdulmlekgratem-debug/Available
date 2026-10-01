import { Billboard } from '@/types'
import { getDaysRemaining, getStatusFromExpiry } from '@/utils/dateUtils'
import { WHATSAPP_NUMBER } from "@/constants/contact"
import { escapeHtml } from "@/utils/escapeHtml"

/**
 * نافذة موقع اللوحة على الخريطة - بنصوص وألوان فخمة (أبيض/أسود فخم وذهبي) خالية تماماً من اللون الأزرق
 */
export const createCompactPopupContent = (billboard: Billboard): string => {
  const daysRemaining = getDaysRemaining(billboard.expiryDate)
  const effectiveStatus = billboard.expiryDate ? getStatusFromExpiry(billboard.expiryDate) : (billboard.status || 'متاح')
  const statusKey = effectiveStatus === 'متاح' ? 'available' : effectiveStatus === 'قريباً' ? 'soon' : 'rented'
  const statusLabel = effectiveStatus === 'متاح' ? 'متاح الآن' : effectiveStatus === 'قريباً' ? 'سيتاح بعد ' + daysRemaining + ' يوم' : 'محجوز حاليًا'
  const location = billboard.landmark || billboard.location || billboard.city

  const coords = billboard.coordinates.split(",").map((c) => Number.parseFloat(c.trim()))
  const hasValidCoords = coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])
  const googleMapsUrl = hasValidCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}&travelmode=driving`
    : '#'
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن حجز اللوحة: ${billboard.name || billboard.id}\nالموقع: ${location}\nالمقاس: ${billboard.size || ''}`)}`
  const code = billboard.name || billboard.id

  const specsText = [billboard.billboardType?.trim(), billboard.facesCount?.trim()].filter(Boolean).join(' · ')

  return `
    <article class="catalog-card map-popup-card" dir="rtl" style="
      width: 270px;
      max-width: 86vw;
      background: #11141d;
      color: #ffffff;
      border: 1px solid rgba(214, 172, 64, 0.55);
      border-radius: 18px;
      overflow: hidden;
      box-shadow: 0 16px 45px -8px rgba(0,0,0,0.65);
      font-family: 'Doran', 'Tajawal', 'Manrope', sans-serif;
      margin: 0;
      text-align: start;
    ">
      <!-- Media with Badges & Overlays -->
      <div class="catalog-card-media" style="position: relative; height: 132px; aspect-ratio: auto; overflow: hidden; background: #0b0d13;">
        <div style="position: absolute; inset: 0; cursor: pointer;"
             onclick="document.dispatchEvent(new CustomEvent('showBillboardImage', {detail: '${billboard.imageUrl || '/roadside-billboard.png'}'}))">
          <img src="${billboard.imageUrl || '/roadside-billboard.png'}" 
               alt="${escapeHtml(location)}" 
               style="width: 100%; height: 100%; object-fit: cover; display: block;"
               onerror="this.src='/roadside-billboard.png'" />
          <div class="card-image-gradient-top"></div>
          <div class="card-image-gradient-bottom"></div>
        </div>

        <!-- Top Badges Overlay -->
        <div class="card-top-overlay" style="padding: 8px;">
          <div class="card-badges-group" style="gap: 5px;">
            <span class="catalog-status status-${statusKey}" style="color: #ffffff !important;">
              <span></span>
              ${statusLabel}
            </span>
            ${billboard.size ? `
              <span class="card-badge card-badge-size" style="cursor: default; color: #111111 !important;">
                <bdi>${escapeHtml(billboard.size)}</bdi>
              </span>
            ` : ''}
          </div>

          <button type="button" 
                  class="card-select-btn" 
                  onclick="document.dispatchEvent(new CustomEvent('toggleBillboardSelection', {detail: '${billboard.id}'}))"
                  title="أضف اللوحة للحملة"
                  style="color: #ffffff !important;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            <span style="color: #ffffff !important;">حملتك</span>
          </button>
        </div>

        <!-- Bottom Overlay on Image: Specs | Days Remaining | Code -->
        <div class="card-bottom-overlay" style="padding: 8px;">
          ${specsText ? `
            <div class="card-badge card-badge-specs" style="color: #f8fafc !important;">
              <span>${escapeHtml(specsText)}</span>
            </div>
          ` : '<div></div>'}

          ${daysRemaining !== null && daysRemaining > 0 ? `
            <span class="card-badge card-badge-days ${daysRemaining <= 20 ? 'is-soon' : 'is-rented'}" style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; color: #ffffff !important;">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="display: inline-block; vertical-align: middle; margin-inline-end: 3px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span style="color: #ffffff !important;">متبقي ${daysRemaining} يوم</span>
            </span>
          ` : '<div></div>'}

          <button type="button" class="card-code-btn" data-copy-text="${encodeURIComponent(code)}" onclick="navigator.clipboard.writeText(decodeURIComponent(this.getAttribute('data-copy-text'))).then(()=>{this.innerHTML='<bdi style=\\'color:#34d399\\'>${escapeHtml(code)}</bdi> ✓';setTimeout(()=>{this.innerHTML='<bdi style=\\'color:#ffffff\\'>${escapeHtml(code)}</bdi> <svg width=\\'12\\' height=\\'12\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\'><rect x=\\'9\\' y=\\'9\\' width=\\'13\\' height=\\'13\\' rx=\\'2\\'/><path d=\\'M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1\\'/></svg>'},1500)})" title="نسخ كود اللوحة" style="color: #ffffff !important;">
            <bdi style="color: #ffffff !important;">${escapeHtml(code)}</bdi>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity: 0.7;">
              <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Card Body -->
      <div class="catalog-card-body" style="padding: 12px 14px 14px; gap: 8px; color: #ffffff !important;">
        <h3 title="${escapeHtml(location)}" style="font-size: 14px; font-weight: 800; line-height: 1.35; margin: 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; color: #ffffff !important;">
          ${escapeHtml(location)}
        </h3>
        
        <div class="catalog-location" style="font-size: 11.5px; display: flex; align-items: center; gap: 4px; flex-wrap: wrap; color: #94a3b8 !important;">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d6ac40" stroke-width="2.5" style="color: #d6ac40; flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          ${billboard.city ? `<span style="color: #cbd5e1 !important; font-weight: 700;">${escapeHtml(billboard.city)}</span>` : ''}
          ${billboard.municipality && billboard.municipality !== billboard.city ? `<span style="color: #64748b;">·</span><span style="color: #94a3b8 !important;">${escapeHtml(billboard.municipality)}</span>` : ''}
          ${billboard.area && billboard.area !== billboard.city && billboard.area !== billboard.municipality ? `<span style="color: #64748b;">·</span><span style="color: #94a3b8 !important;">${escapeHtml(billboard.area)}</span>` : ''}
        </div>

        <!-- Card Actions: Directions & WhatsApp -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px;">
          ${hasValidCoords ? `
            <a href="${googleMapsUrl}" target="_blank" class="brand-button brand-button-map" style="min-height: 38px; padding: 8px 10px; font-size: 12px; font-weight: 700; border-radius: 10px; text-decoration: none !important; justify-content: center; display: flex; align-items: center; gap: 5px; color: #ffffff !important; background: rgba(255,255,255,0.08) !important; border: 1px solid rgba(255,255,255,0.2) !important;">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#d6ac40" stroke-width="2.5" style="flex-shrink: 0;"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
              <span style="color: #ffffff !important; font-weight: 700;">الاتجاهات</span>
            </a>
          ` : ''}
          <a href="${whatsappUrl}" target="_blank" class="brand-button brand-button-gold" style="min-height: 38px; padding: 8px 10px; font-size: 12px; font-weight: 800; border-radius: 10px; text-decoration: none !important; justify-content: center; display: flex; align-items: center; gap: 5px; color: #111111 !important; background: linear-gradient(135deg, #d6ac40, #c4992e) !important; border: none !important; box-shadow: 0 2px 10px rgba(214,172,64,0.35) !important;">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#111111" style="flex-shrink: 0;"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
            <span style="color: #111111 !important; font-weight: 800;">استفسار</span>
          </a>
        </div>
      </div>
    </article>
  `
}

export default createCompactPopupContent
