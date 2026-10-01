import * as React from "react"
import * as ReactDOM from "react-dom"
import { ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"

// Context
const SelectContext = React.createContext<{
  value: string
  onValueChange: (value: string) => void
  isOpen: boolean
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  searchable?: boolean
  searchTerm: string
  setSearchTerm: (val: string) => void
  triggerRef: React.RefObject<HTMLButtonElement>
  portalRef: React.RefObject<HTMLDivElement>
} | null>(null)

const useSelectContext = () => {
  const context = React.useContext(SelectContext)
  if (!context) throw new Error("Select.* must be used within <Select>")
  return context
}

// Select
const Select = ({ value, onValueChange, children, searchable = false }: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  searchable?: boolean
}) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const triggerRef = React.useRef<HTMLButtonElement>(null!)
  const selectRef = React.useRef<HTMLDivElement>(null)
  const portalRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside (including portal element check)
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideSelect = selectRef.current && selectRef.current.contains(target)
      const isInsideTrigger = triggerRef.current && triggerRef.current.contains(target)
      const isInsidePortal = portalRef.current && portalRef.current.contains(target)

      if (!isInsideSelect && !isInsideTrigger && !isInsidePortal) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen, searchable, searchTerm, setSearchTerm, triggerRef, portalRef }}>
      <div ref={selectRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// Trigger
const SelectTrigger = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { setIsOpen, setSearchTerm, isOpen, triggerRef } = useSelectContext()
  return (
    <button
      ref={triggerRef}
      type="button"
      className={cn(
        "relative flex h-12 w-full items-center justify-between rounded-xl border-2 bg-input px-4 py-3 text-base",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        "shadow-md hover:shadow-lg transition-all duration-300",
        "rtl:pr-4 rtl:pl-2 ltr:pl-4 ltr:pr-2 text-right",
        "disabled:cursor-not-allowed disabled:opacity-50",
        isOpen && "ring-2 ring-primary",
        className
      )}
      onClick={() => setIsOpen(open => {
        const next = !open
        if (!next) setSearchTerm("")
        return next
      })}
    >
      {children}
      <ChevronDown className={cn(
        "h-5 w-5 text-primary opacity-70 transition-transform duration-200",
        isOpen && "rotate-180"
      )} />
    </button>
  )
}

// Value
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const { value } = useSelectContext()
  const displayValue = value === "all" || !value ? placeholder : value
  return (
    <span
      className="block truncate text-right pr-2 text-foreground"
      style={{ textAlign: 'right', direction: 'rtl' }}
    >
      {displayValue || placeholder}
    </span>
  )
}

// Content — rendered via portal so it is never clipped by overflow/z-index of parents
const SelectContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  const { isOpen, searchable, searchTerm, setSearchTerm, triggerRef, portalRef } = useSelectContext()
  const [rect, setRect] = React.useState<DOMRect | null>(null)

  React.useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect())
    }
  }, [isOpen, triggerRef])

  if (!isOpen || !rect) return null

  const normalize = (s: string) => s?.toString().toLowerCase().trim()

  const filteredChildren = React.Children.toArray(children).filter((child) => {
    if (!searchable) return true
    const q = normalize(searchTerm)
    if (!q) return true
    if (React.isValidElement(child) && typeof child.props?.value === 'string') {
      const val: string = child.props.value
      return normalize(val).includes(q)
    }
    return true
  })

  // Determine if dropdown should open upward (when near bottom of viewport)
  const spaceBelow = window.innerHeight - rect.bottom
  const dropdownMaxH = 256 // max-h-64
  const openUpward = spaceBelow < dropdownMaxH + 8 && rect.top > dropdownMaxH

  const style: React.CSSProperties = {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    zIndex: 999999,
    direction: 'rtl',
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 8 }
      : { top: rect.bottom + 8 }),
  }

  return ReactDOM.createPortal(
    <div
      ref={portalRef}
      style={{
        ...style,
        background: 'hsl(220, 15%, 12%)',
        border: '2px solid hsl(43, 40%, 30%)',
        borderRadius: '12px',
        boxShadow: '0 20px 60px -10px rgba(0,0,0,0.8), 0 0 0 1px rgba(212,175,55,0.15)',
        color: 'hsl(45, 90%, 88%)',
        fontFamily: "'Tajawal', 'Manrope', sans-serif",
        overflow: 'hidden',
      }}
      className={cn(
        "min-w-[8rem] max-h-64 overflow-y-auto overscroll-contain",
        "scrollbar-thin scrollbar-thumb-primary scrollbar-track-transparent",
        "rtl:text-right ltr:text-left animate-fade-in",
        className
      )}
    >
      {searchable && (
        <div style={{ padding: '8px', position: 'sticky', top: 0, background: 'hsl(220, 15%, 12%)', zIndex: 10, borderBottom: '1px solid hsl(43, 40%, 25%)' }}>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: 'hsl(45, 30%, 60%)' }} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="اكتب للبحث..."
              style={{
                width: '100%', height: '40px', paddingRight: '40px', paddingLeft: '12px',
                borderRadius: '8px', background: 'hsl(220, 15%, 18%)',
                color: 'hsl(45, 90%, 88%)', border: '1px solid hsl(43, 40%, 25%)',
                outline: 'none', fontSize: '14px', direction: 'rtl',
              }}
            />
          </div>
        </div>
      )}
      <div className="py-1">
        {filteredChildren.length > 0 ? (
          filteredChildren as React.ReactNode
        ) : (
          <div className="py-2 px-3 text-sm text-muted-foreground">لا توجد نتائج</div>
        )}
      </div>
    </div>,
    document.body
  )
}

// Item
const SelectItem = ({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) => {
  const { onValueChange, setIsOpen, setSearchTerm, value: selectedValue } = useSelectContext()
  const isSelected = value === selectedValue
  const [hovered, setHovered] = React.useState(false)

  return (
    <div
      style={{
        direction: 'rtl',
        textAlign: 'right',
        padding: '10px 16px 10px 40px',
        cursor: 'pointer',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: isSelected ? '700' : '400',
        color: isSelected ? 'hsl(43, 100%, 55%)' : 'hsl(45, 90%, 88%)',
        background: isSelected ? 'rgba(212,175,55,0.12)' : hovered ? 'rgba(212,175,55,0.07)' : 'transparent',
        transition: 'background 0.15s ease',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => {
        onValueChange(value)
        setIsOpen(false)
        setSearchTerm("")
      }}
    >
      {isSelected && (
        <span style={{ position: 'absolute', left: '12px', color: 'hsl(43, 100%, 55%)', fontWeight: '900' }}>✓</span>
      )}
      {children}
    </div>
  )
}

export { Select, SelectTrigger, SelectContent, SelectItem, SelectValue }
