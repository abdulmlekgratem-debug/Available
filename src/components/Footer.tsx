import { Phone, MapPin, Mail, ArrowUpRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <footer id={id} className="relative overflow-hidden mt-20" style={{ fontFamily: 'Doran, Tajawal, sans-serif' }}>
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 mesh-hero opacity-60" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10 opacity-[0.04]">
        <img src={isLight ? "/new-logo-laigt.svg" : "/new-logo.svg"} alt="" className="w-[60rem] max-w-none" />
      </div>

      <div className="container mx-auto px-4 py-16 md:py-20 relative">
        <div className="glass-card border-gold-gradient rounded-3xl p-6 md:p-10 mb-12 md:mb-16 overflow-hidden relative">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col md:flex-row items-center justify-between gap-6 z-10">
            <div className="text-center md:text-right">
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/15 border border-primary/30">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-primary">{t('footer.badge')}</span>
              </div>
              <h3 className="text-2xl md:text-4xl font-black text-foreground tracking-tight" style={{ letterSpacing: '-0.02em' }}>
                {t('footer.title_a')}<span className="text-gold-gradient">{t('footer.title_b')}</span>
              </h3>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">{t('footer.subtitle')}</p>
            </div>
            <Button
              size="lg"
              className="rounded-2xl px-6 md:px-8 group"
              onClick={() => window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(t('footer.cta_whatsapp_msg'))}`, "_blank")}
            >
              <WhatsAppIcon className="w-5 h-5" />
              {t('footer.contact')}
              <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-5 bg-white dark:bg-card/90 border border-slate-200 dark:border-border/50 rounded-3xl p-6 md:p-8 shadow-md">
            <img 
              src={isLight ? "/new-logo-laigt.svg" : "/new-logo.svg"} 
              alt={t('footer.brand_name')} 
              className={`h-16 md:h-20 object-contain mb-5 transition-all duration-300 ${isLight ? '' : 'drop-shadow-[0_0_25px_hsl(var(--primary)/0.4)]'}`} 
            />
            <p className="text-slate-700 dark:text-muted-foreground leading-relaxed text-sm md:text-base mb-6 max-w-md font-medium">{t('footer.brand_desc')}</p>
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/AL.FARES.AL.DAHABI.LY" target="_blank" rel="noopener noreferrer" aria-label={t('footer.facebook')} className="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:border-primary/40 hover:scale-110 transition-all duration-300">
                <FacebookIcon className="w-4 h-4 text-blue-500" />
              </a>
              <a href={WHATSAPP_BASE_URL} target="_blank" rel="noopener noreferrer" aria-label={t('footer.whatsapp')} className="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:border-primary/40 hover:scale-110 transition-all duration-300">
                <WhatsAppIcon className="w-4 h-4 text-emerald-500" />
              </a>
              <a href={`mailto:${BUSINESS_EMAIL}`} aria-label={t('footer.email')} className="w-11 h-11 rounded-2xl glass-card-strong flex items-center justify-center hover:border-primary/40 hover:scale-110 transition-all duration-300">
                <Mail className="w-4 h-4 text-primary" />
              </a>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white dark:bg-card/90 border border-slate-200 dark:border-border/50 rounded-3xl p-6 md:p-8 shadow-md">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary to-primary/40" />
              <h4 className="text-lg font-bold text-foreground">{t('footer.contact')}</h4>
            </div>
            <div className="space-y-3">
              <a href={`tel:+${WHATSAPP_NUMBER}`} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </span>
                <div>
                  <p className="text-xs text-muted-foreground">{t('footer.call_us')}</p>
                  <p className="font-bold text-foreground" dir="ltr">+218 91 322 8908</p>
                </div>
              </a>
              <a href={`mailto:${BUSINESS_EMAIL}`} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-primary/5 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{t('footer.email_label')}</p>
                  <p className="font-semibold text-foreground text-sm truncate" dir="ltr">{BUSINESS_EMAIL}</p>
                </div>
              </a>
            </div>
          </div>

          <div className="lg:col-span-3 bg-white dark:bg-card/90 border border-slate-200 dark:border-border/50 rounded-3xl p-6 md:p-8 shadow-md flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-primary to-primary/40" />
              <h4 className="text-lg font-bold text-foreground">{t('footer.our_location')}</h4>
            </div>
            <div className="flex items-start gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </span>
              <div>
                <p className="font-bold text-foreground">{t('footer.city')}</p>
                <p className="text-muted-foreground text-xs mt-1">{t('footer.address')}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-auto rounded-2xl border-primary/30 hover:bg-primary/10"
              onClick={() => window.open("https://www.google.com/maps?q=32.4847,14.5959", "_blank")}
            >
              <MapPin className="w-4 h-4" />
              {t('footer.open_map')}
            </Button>
          </div>
        </div>

        <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row items-center justify-between gap-3 text-center md:text-right">
          <p className="text-muted-foreground text-sm font-medium">{t('footer.rights')}</p>
           <p className="text-muted-foreground/60 text-xs max-w-xl leading-relaxed">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  )
}
