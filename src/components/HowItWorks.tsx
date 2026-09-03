import { Search, MapPin, MessageCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function HowItWorks() {
  const { t } = useTranslation()
  const STEPS = [
    { n: 1, icon: Search,         title: t('how.step1_title'), desc: t('how.step1_desc') },
    { n: 2, icon: MapPin,         title: t('how.step2_title'), desc: t('how.step2_desc') },
    { n: 3, icon: MessageCircle,  title: t('how.step3_title'), desc: t('how.step3_desc') },
  ]
  return (
    <section className="py-16 md:py-24 relative" style={{ fontFamily: "Doran, Tajawal, sans-serif" }}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card-strong mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-xs font-bold text-primary">{t('how.badge')}</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-4" style={{ letterSpacing: "-0.03em" }}>
            <span className="text-foreground">{t('how.title_a')}</span>
            <span className="text-gold-gradient">{t('how.title_b')}</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">{t('how.subtitle')}</p>
        </div>
        <div className="relative">
          <svg className="hidden md:block absolute inset-x-0 top-12 mx-auto pointer-events-none" width="100%" height="120" viewBox="0 0 1000 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="goldPath" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(43, 100%, 50%)" stopOpacity="0.1" />
                <stop offset="50%" stopColor="hsl(43, 100%, 60%)" stopOpacity="0.7" />
                <stop offset="100%" stopColor="hsl(43, 100%, 50%)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <path d="M 100 60 Q 350 -10 500 60 T 900 60" stroke="url(#goldPath)" strokeWidth="2" fill="none" strokeDasharray="6 8" />
          </svg>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 relative">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} className="text-center relative">
                  <div className="relative inline-flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full glass-card-strong border-gold-gradient flex items-center justify-center relative z-10">
                      <Icon className="w-9 h-9 text-primary" />
                      <span className="absolute -top-2 -right-2 w-9 h-9 rounded-full glow-icon flex items-center justify-center text-base font-black text-primary-foreground" style={{ fontFamily: "Manrope, sans-serif" }}>
                        {s.n}
                      </span>
                    </div>
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
