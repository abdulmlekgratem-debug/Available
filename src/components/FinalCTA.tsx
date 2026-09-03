import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslation } from "react-i18next"
import { WHATSAPP_BASE_URL } from "@/constants/contact"

export default function FinalCTA() {
  const { t } = useTranslation()
  return (
    <section className="relative py-20 overflow-hidden px-[36px] mx-0 my-[74px] md:py-[191px]" style={{ fontFamily: "Doran, Tajawal, sans-serif" }}>
      <div className="hero-orb hero-orb-rings" style={{ width: "min(700px, 90vw)" }} />
      <div className="container mx-auto px-4 relative z-10 text-center">
        <h2 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight mb-6" style={{ letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          <span className="block text-foreground">{t('cta.ready')}</span>
          <span className="block text-gold-gradient">{t('cta.your_billboard')}</span>
        </h2>
        <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto mb-10">{t('cta.subtitle')}</p>
        <Button
          size="lg"
          className="rounded-2xl px-8 py-6 text-base group glow-strong"
          onClick={() => window.open(`${WHATSAPP_BASE_URL}?text=${encodeURIComponent(t('footer.cta_whatsapp_msg'))}`, "_blank")}
        >
          {t('cta.start')}
          <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </Button>
      </div>
    </section>
  )
}
