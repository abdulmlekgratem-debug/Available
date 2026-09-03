import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { loadClientLogos } from "../services/mediaService";

const SUPPORTED_EXTENSIONS = ["png", "jpg", "jpeg", "webp", "svg", "gif"];
const MAX_LOCAL_LOGOS = 50;

interface LogoItem { index: number; src: string; name: string; }

export default function ClientLogos() {
  const { t } = useTranslation();
  const [logos, setLogos] = useState<LogoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [repeatFactor, setRepeatFactor] = useState(1);
  const [groupWidth, setGroupWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const groupRef = useRef<HTMLDivElement | null>(null);

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

  const groupLogos = useMemo(() => {
    if (logos.length === 0) return [];
    const reps = Math.max(1, repeatFactor);
    return Array.from({ length: reps }).flatMap(() => logos);
  }, [logos, repeatFactor]);

  useEffect(() => {
    if (!containerRef.current || !groupRef.current || logos.length === 0) return;
    const container = containerRef.current; const group = groupRef.current;
    const update = () => {
      const containerW = container.getBoundingClientRect().width;
      const groupW = group.getBoundingClientRect().width;
      setGroupWidth(groupW);
      if (groupW > 0 && containerW > 0) {
        const perSetWidth = groupW / Math.max(1, repeatFactor);
        if (perSetWidth > 0) {
          const needed = Math.min(12, Math.max(1, Math.ceil(containerW / perSetWidth)));
          if (needed !== repeatFactor) setRepeatFactor(needed);
        }
      }
    };
    const ro = new ResizeObserver(() => update());
    ro.observe(container); ro.observe(group);
    update();
    return () => ro.disconnect();
  }, [logos.length, repeatFactor]);

  const durationSeconds = useMemo(() => {
    const speed = 70; const w = Math.max(1, groupWidth);
    const d = Math.max(25, Math.min(120, w / speed));
    return Math.round(d);
  }, [groupWidth]);

  if (loading) {
    return (
      <section className="py-12 md:py-20 bg-gradient-to-b from-card/50 via-background to-card/30 overflow-x-hidden overflow-y-visible">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center gap-3 md:gap-6">
            {[1,2,3,4].map((i) => (<div key={i} className="w-16 h-16 md:w-24 md:h-24 bg-muted animate-pulse rounded-xl" />))}
          </div>
        </div>
      </section>
    );
  }
  if (logos.length === 0) return null;

  return (
    <section id="clients-section" className="py-12 md:py-20 bg-gradient-to-b from-card/30 via-background to-muted/20 overflow-x-hidden overflow-y-visible relative">
      <div className="container mx-auto px-4 mb-8 md:mb-14 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/15 to-primary/5 rounded-full mb-4 border border-primary/20 backdrop-blur-sm">
          <Building2 className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          <span className="text-xs md:text-sm font-bold text-primary">{t('clients.badge')}</span>
          <Globe className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-foreground mb-3 md:mb-4">{t('clients.title')}</h2>
        <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t('clients.subtitle')}</p>
      </div>
      <div className="relative w-full py-4 overflow-visible">
        <div className="absolute left-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-20 md:w-40 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        <div ref={containerRef} className="logos-scroll-wrapper" dir="ltr">
          <div className="logos-scroll-track" style={{ "--duration": `${durationSeconds}s`, "--group-width": `${Math.max(1, groupWidth)}px` } as React.CSSProperties}>
            <div ref={groupRef} className="logos-group" aria-label={t('clients.logos_aria')}>
              {groupLogos.map((logo, idx) => (
                <div key={`a-${logo.index}-${idx}`} className="logo-item-wrapper">
                  <div className="logo-card group/card">
                    <img src={logo.src} alt={logo.name} className="logo-image" loading="lazy" decoding="async" draggable={false} />
                    <div className="logo-name-tooltip">{logo.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="logos-group" aria-hidden="true">
              {groupLogos.map((logo, idx) => (
                <div key={`b-${logo.index}-${idx}`} className="logo-item-wrapper">
                  <div className="logo-card group/card">
                    <img src={logo.src} alt="" className="logo-image" loading="lazy" decoding="async" draggable={false} />
                    <div className="logo-name-tooltip">{logo.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .logos-scroll-wrapper { overflow: visible; width: 100%; padding: 1.25rem 0; padding-bottom: 3.5rem; }
        .logos-scroll-track { display: flex; width: fit-content; animation: seamless-scroll var(--duration) linear infinite; will-change: transform; overflow: visible; }
        .logos-group { display: flex; gap: 1.5rem; width: fit-content; }
        @media (min-width: 768px) { .logos-group { gap: 2rem; } }
        .logo-item-wrapper { flex-shrink: 0; padding: 0.6rem; padding-bottom: 3rem; overflow: visible; }
        .logo-card { position: relative; width: 4.5rem; height: 4.5rem; background: var(--glass-bg); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); border-radius: 1.25rem; box-shadow: var(--shadow-glass); display: flex; align-items: center; justify-content: center; padding: 0.75rem; border: 1px solid var(--glass-border); transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.4s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.4s cubic-bezier(0.22, 1, 0.36, 1); transform-origin: center; }
        @media (min-width: 640px) { .logo-card { width: 5.5rem; height: 5.5rem; } }
        @media (min-width: 768px) { .logo-card { width: 7rem; height: 7rem; padding: 1rem; border-radius: 1.25rem; } }
        @media (min-width: 1024px) { .logo-card { width: 8rem; height: 8rem; } }
        .logo-card:hover { border-color: hsl(var(--primary) / 0.6); box-shadow: 0 12px 36px hsl(var(--primary) / 0.25), inset 0 1px 0 hsl(45 90% 88% / 0.1); transform: scale(1.18); z-index: 20; }
        .logo-name-tooltip { position: absolute; bottom: -2rem; left: 50%; transform: translateX(-50%) translateY(4px); background: hsl(var(--foreground)); color: hsl(var(--background)); padding: 0.35rem 0.75rem; border-radius: 0.5rem; font-size: 0.7rem; font-weight: 600; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.25s ease, transform 0.25s ease; z-index: 30; box-shadow: 0 4px 12px hsl(var(--foreground) / 0.2); }
        .logo-name-tooltip::before { content: ''; position: absolute; top: -4px; left: 50%; transform: translateX(-50%); border-left: 5px solid transparent; border-right: 5px solid transparent; border-bottom: 5px solid hsl(var(--foreground)); }
        .logo-card:hover .logo-name-tooltip { opacity: 1; transform: translateX(-50%) translateY(0); }
        @media (min-width: 768px) { .logo-name-tooltip { font-size: 0.75rem; padding: 0.4rem 0.85rem; bottom: -2.25rem; } }
        .logo-image { max-width: 100%; max-height: 100%; object-fit: contain; filter: grayscale(100%); opacity: 0.65; transition: filter 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
        .logo-card:hover .logo-image { filter: grayscale(0%); opacity: 1; }
        @keyframes seamless-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(calc(-1 * var(--group-width))); } }
        .logos-scroll-wrapper:hover .logos-scroll-track { animation-play-state: paused; }
      `}</style>
    </section>
  );
}
