import { Billboard } from '@/types'
import { getDaysRemaining } from '@/utils/dateUtils'
import { availabilityStatus } from '@/utils/availability'
import { WHATSAPP_NUMBER } from '@/constants/contact'
import { escapeHtml } from '@/utils/escapeHtml'

export const createCompactPopupContent = (billboard: Billboard): string => {
  const status = availabilityStatus(billboard)
  const days = getDaysRemaining(billboard.expiryDate)
  const statusLabel = status === 'available' ? 'متاح الآن' : status === 'soon' ? `سيتاح بعد ${days} يوم` : 'محجوز'
  const location = billboard.landmark || billboard.location || billboard.city
  const code = billboard.name || billboard.id
  const image = billboard.imageUrl || '/roadside-billboard.png'
  const encoded = (value: string) => escapeHtml(encodeURIComponent(value))
  const coords = billboard.coordinates.split(',').map(Number)
  const valid = coords.length === 2 && coords.every(Number.isFinite) && Math.abs(coords[0]) <= 90 && Math.abs(coords[1]) <= 180
  const places = [...new Set([billboard.area, billboard.municipality, billboard.city].filter(Boolean))]
  const whatsapp = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`مرحباً، أريد الاستفسار عن اللوحة ${code}، ${location}`)}`
  return `<article class="billboard-map-popup" dir="rtl">
    <button type="button" class="map-popup-image" aria-label="معاينة صورة اللوحة" data-image="${encoded(image)}" onclick="document.dispatchEvent(new CustomEvent('showBillboardImage',{detail:decodeURIComponent(this.dataset.image)}))">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(location)}" onerror="this.onerror=null;this.src='/roadside-billboard.png'" />
      <span class="map-popup-preview">تكبير الصورة</span>
    </button>
    <div class="map-popup-body">
      <div class="map-popup-meta"><span class="map-popup-status ${status}">${statusLabel}</span><bdi>${escapeHtml(billboard.size)}</bdi></div>
      <h3 dir="rtl">${escapeHtml(location)}</h3>
      <p class="map-popup-places" dir="rtl">${places.map(place => `<span>${escapeHtml(place)}</span>`).join('<span class="map-popup-separator" aria-hidden="true">·</span>')}</p>
      <div class="map-popup-specs"><button type="button" class="map-popup-copy" data-code="${encoded(code)}" aria-label="نسخ كود اللوحة" title="نسخ كود اللوحة" onclick="navigator.clipboard.writeText(decodeURIComponent(this.dataset.code)).then(()=>{const label=this.querySelector('.copy-label');label.textContent='تم النسخ ✓';setTimeout(()=>label.textContent='نسخ',2000)}).catch(()=>{this.querySelector('.copy-label').textContent='حدد الكود لنسخه'})"><bdi>${escapeHtml(code)}</bdi><span class="copy-label">نسخ</span></button><span>${escapeHtml([billboard.billboardType, billboard.facesCount].filter(Boolean).join(' · '))}</span></div>
      <button type="button" class="map-popup-select" data-id="${encoded(billboard.id)}" onclick="document.dispatchEvent(new CustomEvent('toggleBillboardSelection',{detail:decodeURIComponent(this.dataset.id)}))">تحديد / إلغاء تحديد اللوحة</button>
      <div class="map-popup-links">${valid ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}" target="_blank" rel="noopener noreferrer">خرائط Google</a>` : ''}<a href="${escapeHtml(whatsapp)}" target="_blank" rel="noopener noreferrer">استفسار عن الحجز</a></div>
    </div>
  </article>`
}
export default createCompactPopupContent
