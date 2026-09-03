import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, MapPin, Map, Check, Pause, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import { loadCitySlides } from '../services/mediaService'
import { WHATSAPP_BASE_URL } from '@/constants/contact'
import { Billboard } from '@/types'

interface HeroSliderProps {
  totalBillboards: number
  billboards?: Billboard[]
  theme: 'light' | 'dark'
  toggleTheme: () => void
  onScrollToBillboards?: () => void
  onShowMap?: () => void
  onSelectCity?: (city: string) => void
}

const fallbackSlides = [
  { src: '/city/tripoli.jpg', name: 'طرابلس' },
  { src: '/city/misrata.jpg', name: 'مصراتة' },
  { src: '/city/zliten.jpg', name: 'زليتن' },
]

export default function HeroSlider({ totalBillboards, billboards = [], theme, toggleTheme, onScrollToBillboards, onShowMap, onSelectCity }: HeroSliderProps) {
  const { t, i18n } = useTranslation()
  const ar = i18n.language.startsWith('ar')
  const [slides, setSlides] = useState(fallbackSlides)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [pageVisible, setPageVisible] = useState(true)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotion = () => setReducedMotion(media.matches)
    const updateVisibility = () => setPageVisible(!document.hidden)
    updateMotion()
    updateVisibility()
    media.addEventListener('change', updateMotion)
    document.addEventListener('visibilitychange', updateVisibility)
    return () => { media.removeEventListener('change', updateMotion); document.removeEventListener('visibilitychange', updateVisibility) }
  }, [])
  useEffect(() => {
    if (paused || reducedMotion || !pageVisible || hovered || focused || slides.length < 2) return
    const timer = window.setInterval(() => setIndex(i => (i + 1) % slides.length), 7000)
    return () => window.clearInterval(timer)
  }, [paused, reducedMotion, pageVisible, hovered, focused, slides.length])
  useEffect(() => {
    let active = true
    loadCitySlides().then(data => {
      if (active && data.length) {
        setSlides(data.map(slide => ({ src: slide.imageUrl, name: slide.cityName })))
        setIndex(0)
      }
    }).catch(() => { /* Keep local city photographs if remote slides are unavailable. */ })
    return () => { active = false }
  }, [])
  const cities = useMemo(() => [...new Set(billboards.map(b => b.city).filter(Boolean))], [billboards])
  const current = slides[index] || slides[0]
  const currentCity = cities.find(city => city.trim() === current.name.trim())
  const cityCount = billboards.filter(b => b.city === currentCity).length
  const Arrow = ar ? ArrowLeft : ArrowRight

  return (
    <section id="hero-section" className="brand-hero" dir={ar ? 'rtl' : 'ltr'}>
      <a className="skip-to-catalog" href="#billboards-section">{ar ? 'انتقل إلى اللوحات' : 'Skip to billboards'}</a>
      <div className="hero-stage" aria-roledescription={ar ? 'عارض صور' : 'carousel'} aria-label={ar ? 'مدن ليبيا' : 'Cities of Libya'}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false) }}>
        <div className="hero-slides" aria-hidden="true">
          {slides.map((slide, i) => <div key={slide.src + i} className={'hero-slide' + (i === index ? ' is-active' : '')}><img src={slide.src} alt="" loading={i === 0 ? 'eager' : 'lazy'} fetchpriority={i === 0 ? 'high' : 'auto'} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/city/tripoli.jpg' }} /></div>)}
        </div>
        <div className="hero-scrim" />
        <div className="page-width hero-content-layout">
          <div className="hero-copy">
            <img className="hero-wordmark" src="/hero-logo.svg" alt={ar ? 'الفارس الذهبي للدعاية والإعلان' : 'Al Fares Al Dahabi Advertising'} width="240" height="69" />
            <div className="hero-eyebrow"><span />{ar ? 'مواقع حيوية · حضور أقوى لعلامتك' : 'PRIME LOCATIONS · A STRONGER BRAND PRESENCE'}</div>
            <h1>{t('hero.title_1')}<br /><span className="hero-headline-accent">{t('hero.title_2')}</span></h1>
            <p className="hero-description">{ar ? 'على الطريق الساحلي والسريع، وعند مداخل المدن والأحياء الحيوية. اختر الموقع المناسب لحملتك وابدأ من هنا.' : 'On coastal roads, highways, city entrances and lively neighbourhoods. Find the right location for your next campaign.'}</p>
            <div className="hero-actions">
              <button className="brand-button brand-button-gold" onClick={onScrollToBillboards}>{t('hero.cta_browse')}<Arrow size={18} /></button>
              <button className="brand-button hero-map-button" onClick={onShowMap}><Map size={18} />{ar ? 'استكشف الخريطة' : 'Explore map'}</button>
            </div>
            <div className="hero-facts">
              <div><strong>{totalBillboards || '—'}</strong><span>{ar ? 'لوحة إعلانية' : 'Billboards'}</span></div>
              <div><strong>{cities.length || '—'}</strong><span>{ar ? 'مدينة' : 'Cities'}</span></div>
              <a href={WHATSAPP_BASE_URL} target="_blank" rel="noopener noreferrer"><Check size={17} /><span>{ar ? 'نساعدك في اختيار موقعك' : 'Get help choosing a location'}</span><Arrow size={15} /></a>
            </div>
          </div>
        </div>
        <div className="page-width hero-slider-footer">
          {currentCity ? <button className="hero-city-link" onClick={() => onSelectCity?.(currentCity)}><MapPin size={17} /><span>{current.name}</span><span className="hero-city-count">{cityCount} {ar ? 'لوحة' : 'billboards'}</span><Arrow size={16} /></button> : <span className="hero-city-link"><MapPin size={17} />{current.name}</span>}
          <div className="hero-slider-controls" dir="ltr">
            <button onClick={() => setIndex(i => (i - 1 + slides.length) % slides.length)} aria-label={ar ? 'الصورة السابقة' : 'Previous photo'} disabled={slides.length < 2}><ChevronLeft size={19} /></button>
            <span className="hero-slide-count">{String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}</span>
            <button onClick={() => setIndex(i => (i + 1) % slides.length)} aria-label={ar ? 'الصورة التالية' : 'Next photo'} disabled={slides.length < 2}><ChevronRight size={19} /></button>
            <button onClick={() => { setPaused(!paused); if (reducedMotion) { setReducedMotion(false); setPaused(false) } }} aria-label={paused || reducedMotion ? (ar ? 'تشغيل السلايدر' : 'Play slideshow') : (ar ? 'إيقاف السلايدر مؤقتًا' : 'Pause slideshow')} aria-pressed={paused || reducedMotion}>{paused || reducedMotion ? <Play size={16} /> : <Pause size={16} />}</button>
          </div>
        </div>
      </div>
      <ol className="page-width journey-strip" aria-label={ar ? 'خطوات اختيار حملتك' : 'Plan your campaign'}>
        {[ar ? 'ابحث عن موقعك' : 'Find a location', ar ? 'حدّد لوحات حملتك' : 'Shortlist your billboards', ar ? 'تواصل لتأكيد الحجز' : 'Contact us to confirm'].map((step, i) => <li key={step}><span>{String(i + 1).padStart(2, '0')}</span>{step}</li>)}
      </ol>
    </section>
  )
}
