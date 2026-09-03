import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ThemeToggleProps {
  theme: 'light' | 'dark'
  toggleTheme: () => void
  isLightModeVisual?: boolean
}

export default function ThemeToggle({ theme, toggleTheme, isLightModeVisual }: ThemeToggleProps) {
  const isLight = isLightModeVisual !== undefined ? isLightModeVisual : theme === 'light'
  return (
    <Button
      onClick={toggleTheme}
      variant="outline"
      size="icon"
      style={{
        backgroundColor: isLight ? '#ffffff' : '#181510',
        borderColor: isLight ? '#cbd5e1' : 'rgba(212, 175, 55, 0.5)',
        color: isLight ? '#1e293b' : 'hsl(var(--primary))',
      }}
      className="relative rounded-2xl w-10 h-10 md:w-11 md:h-11 border-2 transition-all duration-300 hover:scale-105 shadow-sm overflow-hidden"
      title={theme === 'dark' ? 'تفعيل الوضع الفاتح' : 'تفعيل الوضع الداكن'}
    >
      <Sun className={`w-5 h-5 text-amber-500 absolute transition-all duration-500 ${
        theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
      }`} />
      <Moon className={`w-5 h-5 ${isLight ? 'text-slate-800' : 'text-primary'} absolute transition-all duration-500 ${
        theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'
      }`} />
    </Button>
  )
}
