import { preparePrintImages } from './printImages'
import type { Billboard } from '@/types'
import QRCode from 'qrcode'
import type { PricingOptions } from '@/components/PrintDialog'
import { escapeHtml } from '@/utils/escapeHtml'
import { getPrice, formatPrice, calculateDiscountedPrice, RENTAL_PERIODS } from './pricingService'

export async function buildTablePreview(boards: Billboard[], logo: boolean, images: boolean, pricing: PricingOptions, offset: number) {
  const safe = (value: unknown) => escapeHtml(String(value ?? '—'))
  const asset = (path: string) => safe(new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href)
  const printImages = await preparePrintImages(images ? boards.map(board => board.imageUrl || '') : [], 480)
  const rows = await Promise.all(boards.map(async (board, index) => {
    const level = board.level?.toUpperCase() || 'A'
    const price = getPrice(level, board.size, pricing.period, 'company')
    const discount = pricing.discounts[level] || { type: 'percentage' as const, value: 0 }
    const qr = board.coordinates ? await QRCode.toDataURL(`https://www.google.com/maps?q=${encodeURIComponent(board.coordinates)}`, { width: 80, margin: 1 }) : ''
    const cell = (value: unknown) => `<td>${safe(value)}</td>`
    return `<tr>${cell(offset + index + 1)}<td dir="ltr">${safe(board.name || board.id)}</td>${images ? `<td>${board.imageUrl ? `<img src="${safe(printImages.get(board.imageUrl) || board.imageUrl)}" alt="صورة اللوحة"/>` : '—'}</td>` : ''}${cell(board.location)}${cell(board.area)}${cell(board.municipality)}${cell(board.size)}${cell(board.facesCount)}${cell(board.billboardType)}${pricing.includePricing ? cell(level) + cell(formatPrice(price)) + cell(formatPrice(calculateDiscountedPrice(price, discount.type, discount.value))) : cell(board.status)}<td>${qr ? `<img src="${qr}" alt="QR"/>` : '—'}</td></tr>`
  }))
  const headings = ['م', 'الكود', ...(images ? ['صورة'] : []), 'الموقع', 'المنطقة', 'البلدية', 'المقاس', 'الأوجه', 'النوع', ...(pricing.includePricing ? ['الفئة', 'السعر', 'بعد الخصم'] : ['الحالة']), 'QR']
  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>
  *{box-sizing:border-box}body{margin:0;padding:4%;background:white;color:black;font-family:Arial,sans-serif;container-type:inline-size}header img{width:100%;display:block;margin-bottom:3cqw}table{width:100%;table-layout:fixed;border-collapse:collapse;font-size:1.65cqw}th{background:black;color:#e8cc64;padding:1cqw .3cqw}td{height:8cqw;padding:.4cqw;text-align:center;overflow-wrap:anywhere}th,td{border:.2cqw solid black}td img{display:block;width:auto;max-width:100%;height:7cqw;object-fit:contain;border-radius:0;margin:auto}p{font-size:2cqw}tbody td:first-child{background:#e8cc64}
  </style></head><body><header><img src="${asset(logo ? 'mt.svg' : 'mtb.svg')}" alt="ترويسة التقرير"></header>${pricing.includePricing ? `<p>مدة الإيجار: ${safe(RENTAL_PERIODS.find(p => p.value === pricing.period)?.label || pricing.period)}</p>` : ''}<table><thead><tr>${headings.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table></body></html>`
}
