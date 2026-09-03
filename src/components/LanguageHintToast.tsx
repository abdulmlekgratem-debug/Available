import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Languages, X } from 'lucide-react'

const STORAGE_KEY = 'glkn_lang_hint_seen'

export default function LanguageHintToast() {
  const { i18n, t } = useTranslation()
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY) === '1'
      const base = (i18n.language || 'ar').split('-')[0]
      if (!seen && base !== 'ar') {
        const timer = setTimeout(() => setShow(true), 1200)
        return () => clearTimeout(timer)
      }
    } catch {
      /* ignore */
    }
  }, [i18n.language])

  const dismiss = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
    setShow(false)
  }

  const switchToArabic = () => {
    i18n.changeLanguage('ar')
    dismiss()
  }

  if (!show) return null

  return (
    <div
      className="fixed top-24 right-4 z-[2147483646] max-w-sm animate-in fade-in slide-in-from-top-4 duration-500"
      role="status"
      aria-live="polite"
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-primary/60 via-yellow-300/40 to-primary/60 blur-md opacity-70" />
        <div className="relative flex items-start gap-3 bg-card/95 backdrop-blur-2xl border border-primary/40 rounded-2xl p-4 shadow-[0_20px_60px_-15px_hsl(var(--primary)/0.55)]">
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center">
            <Languages className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-snug mb-2.5" dir="rtl">
              {t('hint.message')}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={switchToArabic}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:scale-[1.03] transition-transform shadow-sm"
              >
                {t('hint.switch')}
              </button>
              <button
                onClick={dismiss}
                className="text-xs font-medium px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
              >
                {t('hint.dismiss')}
              </button>
            </div>
          </div>
          <button
            onClick={dismiss}
            aria-label={t('hint.dismiss')}
            className="flex-shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
