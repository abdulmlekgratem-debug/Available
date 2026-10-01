import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadClientLogos } from "../services/mediaService";

const SUPPORTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"];
const MAX_LOCAL_LOGOS = 50;

interface LogoItem { index: number; src: string; name: string; }

export default function ClientLogos() {
  const { t, i18n } = useTranslation();
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const sheetLogos = await loadClientLogos();
        if (sheetLogos.length > 0) {
          const loaded: LogoItem[] = sheetLogos.map((logo, index) => ({
            index: index + 1,
            src: logo.logoUrl,
            name: logo.companyName || t('clients.default_name', { index: index + 1 })
          }));
          setLogos(loaded);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.warn('[ClientLogos] failed:', error);
      }
      const checkImageExists = (src: string): Promise<boolean> =>
        new Promise((resolve) => { const img = new Image(); img.onload = () => resolve(true); img.onerror = () => resolve(false); img.src = src; });
      const loaded: LogoItem[] = [];
      let consecutiveMisses = 0;
      for (let i = 1; i <= MAX_LOCAL_LOGOS; i++) {
        let found = false;
        for (const ext of SUPPORTED_EXTENSIONS) {
          const src = `/co/${i}.${ext}`;
          const exists = await checkImageExists(src);
          if (exists) { loaded.push({ index: i, src, name: t('clients.default_name', { index: i }) }); found = true; consecutiveMisses = 0; break; }
        }
        if (!found) { consecutiveMisses++; if (consecutiveMisses >= 5) break; }
      }
      loaded.sort((a, b) => a.index - b.index);
      setLogos(loaded);
      setLoading(false);
    };
    loadLogos();
  }, [t]);

  if (!loading && logos.length === 0) return null;

  return (
    <section id="clients-section" className="client-showcase page-width" aria-labelledby="clients-heading">
      <div className="client-showcase-heading">
        <h2 id="clients-heading">{i18n.language.startsWith('ar') ? 'عملاؤنا' : 'Our clients'}</h2>
      </div>
      <div className="client-logo-grid" aria-label={t('clients.logos_aria')} aria-busy={loading}>
        {loading ? Array.from({ length: 6 }, (_, index) => <div className="client-logo-tile client-logo-loading" key={index} />) : logos.map(logo => (
          <figure key={logo.index} className="client-logo-tile">
            <div className="client-logo-image"><img src={logo.src} alt={logo.name} loading="lazy" decoding="async" onError={event => { event.currentTarget.hidden = true; }} /></div>
            <figcaption>{logo.name}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
