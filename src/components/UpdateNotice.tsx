import { RefreshCw, Sparkles, Phone } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { WHATSAPP_BASE_URL } from "@/constants/contact";

export default function UpdateNotice() {
  const { t } = useTranslation();
  return (
    <div id="update-notice-banner" className="relative overflow-hidden bg-gradient-to-r from-primary/15 via-card/80 to-primary/15 border-y border-primary/30 backdrop-blur-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-pulse" style={{ animationDuration: '3s' }} />
      <div className="container mx-auto px-4 py-3 md:py-4 relative">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-center">
          <div className="flex items-center gap-2">
            <div className="relative">
              <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-primary" style={{ animation: 'spin 4s linear infinite' }} />
              <div className="absolute inset-0 bg-primary/30 blur-md rounded-full" />
            </div>
            <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary/80" />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
            <p className="text-sm md:text-base font-bold text-primary">{t('update.data_updating')}</p>
            <span className="hidden sm:block text-primary/50">•</span>
            <p className="text-xs md:text-sm text-foreground/80">{t('update.contact_for_offers')}</p>
          </div>
          <a
            href={WHATSAPP_BASE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded-full text-xs md:text-sm font-medium text-primary transition-all duration-300 hover:scale-105"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('update.contact_now')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
