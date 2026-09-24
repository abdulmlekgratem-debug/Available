import type { Billboard } from '@/types'
import type { PricingOptions } from '@/components/PrintDialog'
import { escapeHtml } from '@/utils/escapeHtml'
import { formatExpiryDate } from '@/utils/dateUtils'
import { calculateDiscountedPrice, formatPrice, getPrice, RENTAL_PERIODS } from './pricingService'

interface CardPrintOptions {
  includeLogo: boolean
  includeImages: boolean
  pricing: PricingOptions
  ar: boolean
  thumbnail?: boolean
}

// Keep the reference system's A4 card structure, using only public catalog data.
export async function buildBillboardCardsHTML(billboards: Billboard[], options: CardPrintOptions): Promise<string> {
  const { includeLogo, includeImages, pricing, ar } = options
  const text = (arabic: string, english: string) => ar ? arabic : english
  const safe = (value: unknown) => escapeHtml(String(value ?? ''))
  const asset = (path: string) => safe(new URL(`${import.meta.env.BASE_URL}${path}`, document.baseURI).href)
  const safeUrl = (value: string) => {
    try {
      const url = new URL(value, document.baseURI)
      return ['http:', 'https:'].includes(url.protocol) ? url.href : ''
    } catch { return '' }
  }
  const QRCode = await import('qrcode')
  const pages: string[] = []
  for (const [index, board] of billboards.entries()) {
    const mapUrl = board.coordinates
      ? `https://www.google.com/maps?q=${encodeURIComponent(board.coordinates)}`
      : safeUrl(board.gpsLink || '')
    const qr = mapUrl ? await QRCode.toDataURL(mapUrl, { width: 200, margin: 1 }) : ''
    const imageUrl = board.imageUrl ? safeUrl(board.imageUrl) : ''
    const level = board.level?.toUpperCase() || 'A'
    const price = pricing.includePricing ? getPrice(level, board.size, pricing.period, 'company') : 0
    const discount = pricing.discounts[level] || { type: 'percentage' as const, value: 0 }
    const discounted = calculateDiscountedPrice(price, discount.type, discount.value)
    const field = (label: string, value: string, ltr = false) => `<div class="spec"><small>${safe(label)}</small><strong${ltr ? ' dir="ltr"' : ''}>${safe(value || '—')}</strong></div>`
    pages.push(`<section class="page reference-template">
      <img class="reference-background" src="${asset(includeLogo ? 'billboard-print-with-logo.svg' : 'billboard-print-without-logo.svg')}" alt="" />
      <header>${includeLogo ? `<img src="${asset('new-logo-laigt.svg')}" alt="${safe(text('الفارس الذهبي', 'Al Fares Al Dahabi'))}" />` : ''}<div class="report-title"><strong>${text('بطاقة موقع إعلاني', 'BILLBOARD PRESENTATION')}</strong><span>${text('الفارس الذهبي للدعاية والإعلان', 'Al Fares Al Dahabi Advertising')}</span></div></header>
      <div class="heading"><div><small>${text('اسم اللوحة / الكود', 'Board name / code')}</small><h1 dir="ltr">${safe(board.name || board.id)}</h1></div><span class="status">${safe(board.status || '—')}</span></div>
      <div class="specs">${field(text('المقاس', 'Size'), board.size, true)}${field(text('نوع اللوحة', 'Type'), board.billboardType)}${field(text('عدد الأوجه', 'Faces'), board.facesCount)}${field(text('الفئة', 'Level'), board.level)}</div>
      ${includeImages ? `<div class="photo">${imageUrl ? `<img src="${safe(imageUrl)}" alt="${safe(board.name)}" /><span class="image-error" hidden>${text('تعذر تحميل صورة اللوحة', 'Board photo could not be loaded')}</span>` : `<span>${text('صورة اللوحة غير متوفرة', 'Board photo unavailable')}</span>`}</div>` : ''}
      <div class="location"><div><small>${text('الموقع', 'Location')}</small><h2>${safe(board.location || board.landmark || '—')}</h2><p>${safe([...new Set([board.city, board.municipality, board.area].filter(Boolean))].join(' · '))}</p>${board.landmark && board.landmark !== board.location ? `<p>${safe(board.landmark)}</p>` : ''}${board.status !== 'متاح' && board.expiryDate ? `<p>${text('تاريخ انتهاء الحجز:', 'Booking ends:')} ${safe(formatExpiryDate(board.expiryDate))}</p>` : ''}</div>
      ${qr ? `<a class="map" href="${safe(mapUrl)}" target="_blank" rel="noopener noreferrer"><img src="${qr}" alt="QR"/><span>${text('امسح أو اضغط لفتح الموقع', 'Scan or click for location')}</span></a>` : `<span class="no-map">${text('الموقع الجغرافي غير متوفر', 'Map location unavailable')}</span>`}</div>
      ${pricing.includePricing ? `<div class="pricing"><div><small>${text('سعر الإيجار', 'Rental price')}</small><strong>${price > 0 ? safe(formatPrice(discounted)) : text('حسب الاستفسار', 'On request')}</strong>${price > discounted && price > 0 ? `<del>${safe(formatPrice(price))}</del>` : ''}</div><span>${safe(RENTAL_PERIODS.find(period => period.value === pricing.period)?.label || pricing.period)}</span></div>` : ''}
      <footer><span>${text('اللوحات المختارة', 'Selected billboards')} · ${safe(new Date().toLocaleDateString(ar ? 'ar-LY' : 'en-GB'))}</span><span>${index + 1} / ${billboards.length}</span></footer>
    </section>`)
  }
  return `<!doctype html><html lang="${ar ? 'ar' : 'en'}" dir="${ar ? 'rtl' : 'ltr'}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${text('بطاقات اللوحات المختارة', 'Selected billboard cards')} (${billboards.length})</title><style>
    @font-face{font-family:Doran;src:url('${asset('fonts/Doran-Regular.otf')}')}@font-face{font-family:Doran;src:url('${asset('fonts/Doran-Bold.otf')}');font-weight:700}
    *{box-sizing:border-box}body{margin:0;background:#ececec;color:#282a2c;font:14px Doran,Arial,sans-serif}small{display:block;color:#626568;font-size:11px}h1,h2,p{margin:0}h1{font-size:26px;overflow-wrap:anywhere}h2{font-size:20px;line-height:1.5;overflow-wrap:anywhere}p{margin-top:5px;color:#535658}.page{width:190mm;min-height:277mm;margin:18mm auto;padding:0;background:white;display:flex;flex-direction:column;gap:5mm;box-shadow:0 4px 28px #0002}header img{display:block;width:100%;height:27mm;object-fit:contain}.heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.status{background:#faf2cf;border:1px solid #ddba4a;border-radius:30px;padding:6px 16px;flex-shrink:0}.specs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1px solid #dedede;border-radius:8px}.spec{padding:10px;text-align:center;overflow-wrap:anywhere}.spec strong{display:block;font-size:18px}.photo{height:123mm;flex-shrink:0;background:#f4f4f2;border:1px solid #e2e2df;display:flex;align-items:center;justify-content:center;color:#777}.photo img{width:100%;height:100%;object-fit:contain}.location{display:flex;gap:6mm;align-items:center}.location>div{flex:1;min-width:0}.map{width:30mm;flex-shrink:0;text-align:center;color:#282a2c;text-decoration:none;font-size:10px}.map img{width:26mm;height:26mm;display:block;margin:auto}.no-map{font-size:11px;color:#777}.pricing{padding:10px 16px;background:#faf2cf;border-inline-start:4px solid #d7af37;display:flex;align-items:center;justify-content:space-between;gap:10px}.pricing strong{font-size:20px}.pricing del{margin-inline-start:12px;color:#686868}footer{margin-top:auto;border-top:1px solid #ddd;padding:10px 0;display:flex;justify-content:space-between;font-size:11px;color:#666}.toolbar{position:sticky;top:0;background:#282a2c;color:white;padding:12px;display:flex;justify-content:center;gap:14px;align-items:center;z-index:1}.toolbar button{font:inherit;border:0;border-radius:6px;background:#e8cc64;padding:10px 22px;cursor:pointer}.toolbar button:disabled{opacity:.6;cursor:wait}
    @media screen and (max-width:760px){.page{width:calc(100% - 24px);min-height:0;padding:12px;margin:14px auto;gap:16px}.photo{height:auto;aspect-ratio:4/3}.spec{padding:8px 3px}.spec strong{font-size:15px}h1{font-size:21px}h2{font-size:17px}.toolbar{flex-wrap:wrap;font-size:12px}}
    @page{size:A4 portrait;margin:10mm}@media print{body{background:white;-webkit-print-color-adjust:exact;print-color-adjust:exact}.toolbar{display:none!important}.page{margin:0;width:190mm;min-height:276mm;box-shadow:none;break-after:page}.page:last-child{break-after:auto}.photo,.specs,.location,.pricing{break-inside:avoid}}
    .page{padding:8mm 9mm;gap:5mm;border-top:3mm solid #d9b63e;position:relative}header{display:flex;align-items:center;justify-content:space-between;gap:5mm;border-bottom:1px solid #e6e1d4;padding-bottom:5mm}header img{width:58mm;height:21mm;object-fit:contain}.report-title{display:flex;flex-direction:column;gap:5px}.report-title strong{font-size:17px;letter-spacing:.5px}.report-title span{font-size:10px;color:#757575}.heading{flex-direction:column;position:relative;justify-content:center;text-align:center;min-height:26mm}.heading small{letter-spacing:1px}.heading h1{font:700 32px Doran,Arial,sans-serif;letter-spacing:1px}.heading .status{position:absolute;inset-inline-end:0;top:0;font-size:10px;padding:4px 12px}.specs{border:0;background:#282a2c;color:white;border-radius:0;padding:2mm}.spec small{color:#dbdbdb}.spec strong{font-size:20px}.spec:first-child{background:#e8cc64;color:#282a2c}.spec:first-child small{color:#484335}.spec:first-child strong{font-size:25px}.photo{height:113mm;background:#f8f8f6;border:0}.location{padding:4mm;background:#f6f5f1;border-inline-start:1.5mm solid #d9b63e}.location h2{font-size:18px}.pricing{padding:3mm 4mm}footer{padding-top:4mm;border-color:#d9b63e}.page:after{content:'';position:absolute;bottom:0;inset-inline-end:0;width:28mm;height:2mm;background:#d9b63e}
    @media screen and (max-width:760px){.page{padding:20px 16px;gap:14px}header img{width:42%;height:60px}.report-title strong{font-size:13px}.report-title span{font-size:8px}.heading{min-height:72px}.heading h1{font-size:27px}.heading .status{font-size:9px}.spec strong{font-size:15px}.spec:first-child strong{font-size:21px}.photo{height:auto;aspect-ratio:4/3}.location{gap:12px;padding:12px}.location h2{font-size:16px}.map{width:74px}.map img{width:70px;height:70px}}
    @media print{.page{height:276mm;min-height:276mm;gap:4mm}.photo{height:auto;min-height:60mm;flex:1}.photo img{min-height:0}.location{flex-shrink:0}footer{margin-top:0}.specs,header,.heading,.pricing,footer{flex-shrink:0}}
    /* Exact original artwork and field positions from the supplied reference PDF. */
    .reference-template{width:210mm;height:297mm;min-height:0;padding:0;border:0;display:block;position:relative;container-type:inline-size;overflow:hidden}
    .reference-background{position:absolute;inset:0;width:100%;height:100%;object-fit:fill}
    .reference-template header,.reference-template footer,.reference-template:after,.reference-template .heading small,.reference-template .status,.reference-template .spec small,.reference-template .spec:nth-child(n+4),.reference-template .map span,.reference-template .location small{display:none}
    .reference-template .heading{position:absolute;left:7.4%;top:18.5%;width:15.9%;height:3.4%;min-height:0;display:flex;justify-content:center;align-items:center}
    .reference-template .heading h1{font:500 2.65cqw Doran,Arial,sans-serif;letter-spacing:0;white-space:nowrap}
    .reference-template .specs{position:static;padding:0;background:none;border:0;display:block;color:#111}
    .reference-template .spec{position:absolute;padding:0;background:none;text-align:center}
    .reference-template .spec:first-child{left:56.3%;top:17.4%;width:14.8%;color:#111;background:none}
    .reference-template .spec:first-child strong{font:700 4.5cqw Manrope,Arial,sans-serif}
    .reference-template .spec:nth-child(3){left:56.3%;top:20.6%;width:14.8%}
    .reference-template .spec:nth-child(3) strong{font-size:1.7cqw;font-weight:400}
    .reference-template .spec:nth-child(2){display:none}
    .reference-template .photo{position:absolute;left:6%;top:31.3%;width:88%;height:${pricing.includePricing ? '37%' : '44%'};min-height:0;aspect-ratio:auto;background:transparent;border:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
    .reference-template .photo img{display:block;width:100%;height:100%;min-width:0;min-height:0;max-width:100%;max-height:100%;object-fit:contain;object-position:center}
    .reference-template .location{position:static;padding:0;background:none;border:0;display:block}
    .reference-template .location>div{position:absolute;left:8%;top:78.7%;width:62.5%;height:4.8%;display:flex;flex-direction:column;justify-content:center;text-align:right;gap:0}
    .reference-template .location h2{font-size:2.35cqw;font-weight:400;line-height:1.35;order:2}
    .reference-template .location p{font-size:2.35cqw;line-height:1.35;margin:0;color:#333;order:1}
    .reference-template .location p:nth-of-type(n+2){display:none}
    .reference-template .map,.reference-template .no-map{position:absolute;left:32.8%;top:87.1%;width:11.3%;height:8%;font-size:1.8cqw}
    .reference-template .map img{width:100%;height:100%;object-fit:contain}
    .reference-template .pricing{position:absolute;left:22%;top:70%;width:56%;height:6%;padding:0;background:none;border:0;justify-content:center;gap:10px;font-size:2cqw}
    .reference-template .pricing strong{font-size:3cqw}
    @media screen and (max-width:800px){.reference-template{width:100%;height:auto;aspect-ratio:210/297;margin:10px auto}}
    @page{size:A4 portrait;margin:0}
    ${options.thumbnail ? 'body{background:white;overflow:hidden}.toolbar{display:none}.reference-template{width:100%;height:auto;aspect-ratio:210/297;margin:0;box-shadow:none}' : ''}
    @media print{.reference-template{width:210mm;height:297mm;min-height:0;margin:0;break-after:page;break-inside:avoid}.reference-template:last-child{break-after:auto}}
    </style></head><body><div class="toolbar"><span id="ready">${text('جارٍ تحميل الصور والخطوط…', 'Loading photos and fonts…')}</span><button id="print" disabled>${text('طباعة / حفظ PDF', 'Print / Save PDF')}</button></div>${pages.join('')}
    <script>
    const button=document.getElementById('print');
    if(button) button.onclick=()=>window.print();
    const images=Array.from(document.images).map(img=>new Promise(resolve=>{
      const done=()=>{if(!img.naturalWidth){img.style.display='none';if(img.nextElementSibling)img.nextElementSibling.hidden=false;}resolve();};
      if(img.complete)done();else{img.onload=done;img.onerror=done;}
    }));
    Promise.race([Promise.all([...images,document.fonts.ready]),new Promise(resolve=>setTimeout(resolve,20000))]).then(()=>{
      const missing=Array.from(document.querySelectorAll('.photo img')).some(img=>!img.complete||!img.naturalWidth);
      if(button){document.getElementById('ready').textContent=missing?'${text('بعض الصور لم تُحمّل. يمكنك الانتظار أو الطباعة.', 'Some photos are unavailable. You can wait or print.')}':'${text('المعاينة جاهزة — اختر حفظ PDF من نافذة الطباعة', 'Preview ready — choose Save as PDF in the print dialog')}';button.disabled=false;}
    });
    </script></body></html>`
}

export async function printBillboardCards(billboards: Billboard[], options: CardPrintOptions): Promise<void> {
  if (!billboards.length) throw new Error(options.ar ? 'اختر لوحة واحدة على الأقل.' : 'Select at least one board.')
  // Open during the click, before asynchronous QR generation, for mobile popup support.
  const preview = window.open('', '_blank')
  if (!preview) throw new Error(options.ar ? 'اسمح بالنوافذ المنبثقة ثم أعد الطباعة.' : 'Allow popups and retry printing.')
  preview.opener = null
  preview.document.write('<!doctype html><meta charset="utf-8"><p dir="rtl">' + (options.ar ? 'جارٍ تجهيز بطاقات اللوحات…' : 'Preparing billboard cards…') + '</p>')
  preview.document.close()
  try {
    const html = await buildBillboardCardsHTML(billboards, options)
    if (preview.closed) throw new Error(options.ar ? 'أُغلقت المعاينة. أعد الطباعة لفتحها مجددًا.' : 'Preview closed. Print again to reopen it.')
    preview.document.open()
    preview.document.write(html)
    preview.document.close()
  } catch (error) {
    if (!preview.closed) preview.close()
    throw error
  }
}
