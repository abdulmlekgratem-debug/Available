import { Phone, Mail, MapPin } from "lucide-react"
import { useTranslation } from "react-i18next"
import { WHATSAPP_NUMBER, BUSINESS_EMAIL, WHATSAPP_BASE_URL } from "@/constants/contact"

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
)

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

interface FooterProps { 
  id?: string
  theme?: 'light' | 'dark'
}

export default function Footer({ id, theme = 'dark' }: FooterProps) {
  const { t } = useTranslation()
  const isLight = theme === 'light'

  return (
    <footer id={id} className="border-t border-border mt-10 bg-card" style={{ fontFamily: 'Doran, Tajawal, sans-serif' }}>
      <div className="page-width py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <img src={isLight ? '/new-logo-laigt.svg' : '/new-logo.svg'} alt={t('footer.brand_name')} className="h-12 w-28 object-contain" />
            <div><p className="font-bold text-foreground">{t('footer.address')}</p><p className="text-sm text-muted-foreground mt-1">{t('footer.city')}</p><a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(t('footer.address') + ' ' + t('footer.city'))}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-11 mt-2 px-3 rounded-lg border border-border text-sm hover:bg-primary/10"><MapPin size={16} />{t('footer.open_map')}</a></div>
          </div>
          <nav aria-label={t('footer.contact')} className="flex items-center flex-wrap gap-3">
            <a href={WHATSAPP_BASE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-11 rounded-xl bg-primary text-primary-foreground px-4 font-bold"><WhatsAppIcon className="w-4 h-4" />{t('footer.whatsapp')}</a>
            <a href={`tel:+${WHATSAPP_NUMBER}`} className="inline-flex items-center gap-2 min-h-11 px-2 text-sm"><Phone className="w-4 h-4" /><bdi>+218 91 322 8908</bdi></a>
            <a href="https://www.facebook.com/AL.FARES.AL.DAHABI.LY" target="_blank" rel="noopener noreferrer" aria-label={t('footer.facebook')} className="inline-flex items-center justify-center w-11 h-11 border border-border rounded-xl"><FacebookIcon className="w-4 h-4" /></a>
            <a href={`mailto:${BUSINESS_EMAIL}`} aria-label={t('footer.email')} className="inline-flex items-center justify-center w-11 h-11 border border-border rounded-xl"><Mail className="w-4 h-4" /></a>
          </nav>
        </div>
        <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>{t('footer.rights')}</p>
          <a href="/about.html" className="inline-flex items-center min-h-11 hover:underline">{t('footer.about_link')}</a>
        </div>
      </div>
    </footer>
  )
}
