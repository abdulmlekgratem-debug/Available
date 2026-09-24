import { escapeHtml } from '@/utils/escapeHtml'

/** Shared preview window for both table and full-page reports. */
export async function openPrintPreview(build: () => Promise<string>, title: string, count: number, ar = true) {
  const popup = window.open('', '_blank')
  if (!popup) throw new Error(ar ? 'اسمح بالنوافذ المنبثقة ثم أعد الطباعة.' : 'Allow popups and retry printing.')
  popup.opener = null
  const source = window
  const returnUrl = source.location.href
  const text = (arabic: string, english: string) => ar ? arabic : english
  const reportHeading = `${text('اللوحات المتاحة', 'Available billboards')} — ${title}`
  const updateDocumentTitle = () => {
    const now = new Date()
    const pad = (value: number) => String(value).padStart(2, '0')
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
    const time = `${pad(now.getHours())}.${pad(now.getMinutes())}`
    // File-safe separators preserve the date and time in the browser's PDF filename.
    popup.document.title = `${reportHeading} — ${count} ${text('لوحة', 'boards')} — ${date} — ${time}`
  }
  const toolbar = `<nav id="print-controls" dir="${ar ? 'rtl' : 'ltr'}" aria-label="${text('أدوات الطباعة', 'Print controls')}"><div class="print-heading"><strong>${escapeHtml(title)}</strong><span>${count} ${text('لوحة', 'boards')} · <time id="print-clock"></time></span><span id="print-status" role="status">${text('جارٍ تجهيز الصور والخطوط…', 'Preparing images and fonts…')}</span></div><div class="print-actions"><button id="print-save" disabled>${text('طباعة / حفظ PDF', 'Print / Save PDF')}</button><button id="print-return">${text('إغلاق والعودة للموقع', 'Close and return')}</button></div></nav>`
  const css = `<style id="print-window-style">
    #print-controls{position:sticky;top:0;z-index:99999;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;background:#262626;color:#fff;padding:16px max(16px,env(safe-area-inset-right));box-shadow:0 3px 12px #0002;font:14px Arial,sans-serif;line-height:1.5}
    .print-heading{display:grid;gap:3px}.print-heading strong{font-size:17px}.print-heading span{font-size:12px;color:#dedede}.print-actions{display:flex;gap:10px;flex-wrap:wrap}
    #print-controls button{min-height:44px;padding:10px 18px;font:700 14px Arial,sans-serif;border-radius:12px;border:1px solid #ffffff60;cursor:pointer;background:transparent;color:white}#print-controls #print-save{background:#e8cc64;color:#262626;border-color:#e8cc64}#print-controls button:disabled{opacity:.5;cursor:wait}#print-controls button:focus-visible{outline:3px solid #e8cc64;outline-offset:3px}
    .billboard-image{border-radius:8px}
    @media screen{body{margin:0;background:#ececec}.table-report{max-width:210mm;margin:24px auto;padding:10mm;background:white;box-shadow:0 4px 24px #0002;overflow-x:auto}}
    @media(max-width:600px){#print-controls{gap:10px;padding:12px}.print-actions{width:100%}.print-actions button{flex:1}.table-report{margin:12px 0;padding:10px}}
    @media print{#print-controls{display:none!important}.table-report{margin:0;padding:0;box-shadow:none}}
  </style>`
  let cleanup = () => {}
  const wireControls = () => {
    const doc = popup.document
    const heading = doc.querySelector('.print-heading strong')
    if (heading) heading.textContent = reportHeading
    updateDocumentTitle()
    const close = () => { cleanup(); source.focus(); popup.close(); if (!popup.closed) popup.location.replace(returnUrl) }
    doc.getElementById('print-return')?.addEventListener('click', close)
    doc.addEventListener('keydown', event => { if (event.key === 'Escape') close() })
    doc.getElementById('print-save')?.addEventListener('click', () => { updateDocumentTitle(); popup.print() })
    popup.addEventListener('beforeprint', updateDocumentTitle)
    const updateClock = () => {
      const clock = doc.getElementById('print-clock')
      if (clock) clock.textContent = new Intl.DateTimeFormat(ar ? 'ar-LY' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date())
    }
    updateClock()
    const timer = source.setInterval(() => { if (popup.closed) cleanup(); else updateClock() }, 1000)
    cleanup = () => source.clearInterval(timer)
    popup.addEventListener('pagehide', cleanup, { once: true })
  }
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${css}</head><body>${toolbar}</body></html>`)
  popup.document.close()
  wireControls()
  try {
    const html = await build()
    if (popup.closed) { cleanup(); return }
    cleanup()
    const parsed = new DOMParser().parseFromString(html, 'text/html')
    parsed.querySelectorAll('script,.toolbar').forEach(node => node.remove())
    if (!parsed.querySelector('.reference-template')) {
      const report = parsed.createElement('main')
      report.className = 'table-report'
      report.append(...Array.from(parsed.body.childNodes))
      parsed.body.append(report)
    }
    parsed.head.insertAdjacentHTML('beforeend', css)
    parsed.body.insertAdjacentHTML('afterbegin', toolbar)
    popup.document.open()
    popup.document.write('<!doctype html>' + parsed.documentElement.outerHTML)
    popup.document.close()
    wireControls()
    const pending = Array.from(popup.document.images).map(img => new Promise<void>(resolve => {
      if (img.complete) resolve()
      else { img.addEventListener('load', () => resolve(), { once: true }); img.addEventListener('error', () => resolve(), { once: true }) }
    }))
    let deadline: ReturnType<typeof setTimeout> | undefined
    await Promise.race([Promise.all([...pending, popup.document.fonts.ready]), new Promise(resolve => { deadline = setTimeout(resolve, 20000) })])
    if (deadline) clearTimeout(deadline)
    if (popup.closed) return
    const missing = Array.from(popup.document.images).some(img => !img.complete || !img.naturalWidth)
    const status = popup.document.getElementById('print-status')
    if (status) status.textContent = missing ? text('بعض الصور لم تُحمّل. يمكنك الانتظار أو الطباعة.', 'Some images are unavailable. Wait or print.') : text('جاهز للطباعة — اختر حفظ PDF من نافذة الطباعة', 'Ready — choose Save as PDF in the print dialog')
    const button = popup.document.getElementById('print-save') as HTMLButtonElement | null
    if (button) button.disabled = false
  } catch (error) {
    cleanup()
    if (!popup.closed) popup.close()
    throw error
  }
}
