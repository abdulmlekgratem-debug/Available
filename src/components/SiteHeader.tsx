import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import ThemeToggle from "@/components/ThemeToggle"
import LanguageToggle from "@/components/LanguageToggle"

interface SiteHeaderProps {
  theme: "light" | "dark"
  toggleTheme: () => void
  onShowMap: () => void
}

export default function SiteHeader({ theme, toggleTheme, onShowMap }: SiteHeaderProps) {
  const { i18n } = useTranslation()
  const ar = i18n.language.startsWith("ar")
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className={`site-header-wrapper ${isScrolled ? "is-scrolled" : ""}`} dir={ar ? "rtl" : "ltr"}>
      {/* Sticky Dynamic Navigation Bar */}
      <header className={`site-header ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="page-width site-header-inner">
          <a
            href="#hero-section"
            aria-label={ar ? "الفارس الذهبي — الرئيسية" : "Al Fares Al Dahabi — home"}
            className="site-brand"
          >
            <img
              src={theme === "light" ? "/new-logo-laigt.svg" : "/new-logo.svg"}
              alt={ar ? "الفارس الذهبي" : "Al Fares Al Dahabi"}
              width="184"
              height="56"
            />
          </a>

          <nav className="header-links" aria-label={ar ? "القائمة الرئيسية" : "Main navigation"}>
            <a href="#billboards-section">{ar ? "اللوحات الإعلانية" : "Billboards"}</a>
            <button type="button" onClick={onShowMap}>
              {ar ? "استكشف الخريطة" : "Explore the map"}
            </button>
            <a href="#footer">{ar ? "تواصل معنا" : "Contact"}</a>
          </nav>

          <div className="header-tools">
            <ThemeToggle theme={theme} toggleTheme={toggleTheme} isLightModeVisual={theme === "light"} />
            <LanguageToggle theme={theme} />
          </div>
        </div>
      </header>
    </div>
  )
}
