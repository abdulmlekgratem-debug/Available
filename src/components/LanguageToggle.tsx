import { Languages } from 'lucide-react'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

// Set Google Translate cookie so dynamic Arabic content (from Google Sheet)
// gets auto-translated to the chosen language on reload.
function setGoogTransCookie(target: string) {
  const value = target ? `/ar/${target}` : ''
  const hostname = window.location.hostname
  // Clear previous cookie on all scopes
  const clearScopes = ['', `; domain=${hostname}`, `; domain=.${hostname}`]
  clearScopes.forEach((scope) => {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${scope}`
  })
  if (value) {
    document.cookie = `googtrans=${value}; path=/`
    document.cookie = `googtrans=${value}; path=/; domain=${hostname}`
    document.cookie = `googtrans=${value}; path=/; domain=.${hostname}`
  }
}

// Fallback: trigger Google Translate via the hidden combo without reload
function triggerGoogleTranslate(target: string): boolean {
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo')
  if (!combo) return false
  combo.value = target
  combo.dispatchEvent(new Event('change'))
  return true
}

interface LanguageToggleProps {
  theme?: 'light' | 'dark'
}

export default function LanguageToggle({ theme }: LanguageToggleProps) {
  const { i18n, t } = useTranslation()
  const current = i18n.language?.startsWith('en') ? 'en' : 'ar'
  const next = current === 'ar' ? 'en' : 'ar'
  const isLight = theme === 'light'

  // On mount, if cookie says English, ensure i18n matches.
  useEffect(() => {
    const hasEn = document.cookie.includes('googtrans=/ar/en')
    if (hasEn && !i18n.language?.startsWith('en')) i18n.changeLanguage('en')
  }, [i18n])

  const handleToggle = () => {
    const target = next === 'en' ? 'en' : ''
    i18n.changeLanguage(next)
    setGoogTransCookie(target)

    // Try inline trigger first (avoids reload flash if widget is ready)
    const triggered = target ? triggerGoogleTranslate('en') : triggerGoogleTranslate('ar')

    toast(next === 'en' ? 'Switched to English' : 'تم التحويل للعربية', { duration: 1500 })

    // Only reload if Google Translate widget is mounted on DOM but couldn't be triggered dynamically
    if (!triggered && document.querySelector('.goog-te-combo')) {
      setTimeout(() => window.location.reload(), 300)
    }
  }

  return (
    <Button
      onClick={handleToggle}
      variant="outline"
      size="icon"
      aria-label={t('lang.toggle_aria')}
      title={current === 'ar' ? 'English' : 'العربية'}
      style={{
        backgroundColor: isLight ? '#ffffff' : '#181510',
        borderColor: isLight ? '#cbd5e1' : 'rgba(212, 175, 55, 0.5)',
        color: isLight ? '#1e293b' : 'hsl(var(--primary))',
      }}
      className="notranslate relative rounded-2xl w-10 h-10 md:w-11 md:h-11 border-2 transition-all duration-300 hover:scale-105 shadow-sm overflow-hidden group"
      translate="no"
    >
      <Languages className={`w-5 h-5 transition-transform duration-300 group-hover:rotate-12 ${isLight ? 'text-slate-800' : 'text-primary'}`} />
      <span className={`absolute bottom-0.5 right-1 text-[9px] font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-primary'}`}>
        {next.toUpperCase()}
      </span>
    </Button>
  )
}
