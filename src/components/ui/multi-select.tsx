import * as React from "react"
import * as ReactDOM from "react-dom"
import { ChevronDown, Search, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "./badge"

interface MultiSelectProps {
  labelId?: string
  values: string[]
  onValuesChange: (values: string[]) => void
  options: string[]
  placeholder?: string
  className?: string
  searchable?: boolean
  allLabel?: string
}

export function MultiSelect({
  labelId,
  values,
  onValuesChange,
  options,
  placeholder = "اختر...",
  className,
  searchable = true,
  allLabel = "الكل"
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState("")
  const [rect, setRect] = React.useState<DOMRect | null>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const portalRef = React.useRef<HTMLDivElement>(null)

  const handleClose = React.useCallback(() => {
    setIsOpen(false)
    setSearchTerm("")
  }, [])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const isInsideContainer = containerRef.current && containerRef.current.contains(target)
      const isInsideTrigger = triggerRef.current && triggerRef.current.contains(target)
      const isInsidePortal = portalRef.current && portalRef.current.contains(target)

      if (!isInsideContainer && !isInsideTrigger && !isInsidePortal) {
        handleClose()
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [handleClose])

  React.useLayoutEffect(() => {
    if (isOpen && triggerRef.current) {
      setRect(triggerRef.current.getBoundingClientRect())
    }
  }, [isOpen])

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const isAllSelected = values.length === 0 || values.includes("all")

  const toggleOption = (option: string) => {
    if (option === "all") {
      onValuesChange([])
      return
    }
    const newValues = values.includes(option)
      ? values.filter(v => v !== option)
      : [...values.filter(v => v !== "all"), option]
    onValuesChange(newValues.length === 0 ? [] : newValues)
  }

  const removeValue = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newValues = values.filter(v => v !== valueToRemove)
    onValuesChange(newValues)
  }

  const displayText = isAllSelected
    ? allLabel
    : values.length > 2
      ? `${values.length} محدد`
      : values.join(", ")

  const handleToggle = () => {
    if (isOpen) {
      handleClose()
    } else {
      setIsOpen(true)
    }
  }

  // Determine position
  const dropdownMaxH = 260
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 999
  const openUpward = rect ? spaceBelow < dropdownMaxH + 8 && rect.top > dropdownMaxH : false

  const dropdownStyle: React.CSSProperties = rect ? {
    position: 'fixed',
    left: rect.left,
    width: rect.width,
    zIndex: 999999,
    ...(openUpward
      ? { bottom: window.innerHeight - rect.top + 8 }
      : { top: rect.bottom + 8 }),
  } : {}

  return (
    <div ref={containerRef} className="relative group">
      <button
        ref={triggerRef}
        type="button"
        aria-labelledby={labelId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          "relative flex min-h-12 w-full items-center justify-between rounded-xl border-2 bg-input px-4 py-2 text-base",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
          "shadow-md hover:shadow-xl transition-all duration-300 ease-out",
          "rtl:pr-4 rtl:pl-2 ltr:pl-4 ltr:pr-2 text-right",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-primary/60",
          isOpen && "ring-2 ring-primary border-primary",
          className
        )}
        onClick={handleToggle}
      >
        <div className="flex flex-wrap gap-1.5 flex-1 text-right relative z-10" style={{ direction: 'rtl' }}>
          {isAllSelected ? (
            <span className="text-foreground transition-colors duration-200">{allLabel}</span>
          ) : values.length <= 2 ? (
            values.map((value, index) => (
              <Badge
                key={value}
                variant="secondary"
                className="bg-primary/20 text-primary text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-scale-in hover:bg-primary/30 transition-all duration-200"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {value}
                <X
                  className="w-3.5 h-3.5 cursor-pointer hover:text-destructive hover:scale-125 transition-all duration-200"
                  onClick={(e) => removeValue(value, e)}
                />
              </Badge>
            ))
          ) : (
            <span className="text-foreground">{displayText}</span>
          )}
        </div>
        <ChevronDown className={cn(
          "h-5 w-5 text-primary opacity-70 transition-all duration-300 flex-shrink-0 relative z-10",
          isOpen ? "rotate-180 opacity-100" : "group-hover:opacity-100 group-hover:translate-y-0.5"
        )} />
      </button>

      {isOpen && rect && ReactDOM.createPortal(
        <div
          role="dialog"
          aria-labelledby={labelId}
          onKeyDown={e => { if (e.key === 'Escape') { handleClose(); triggerRef.current?.focus() } }}
          ref={portalRef}
          style={dropdownStyle}
          className="bg-card text-card-foreground border-2 border-border/80 rounded-2xl shadow-2xl overflow-y-auto max-h-[280px] z-[999999] p-1.5 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl"
          dir="rtl"
        >
          {searchable && (
            <div className="sticky top-0 bg-card z-10 p-1.5 pb-2 border-b border-border/40 mb-1">
              <div className="relative flex items-center">
                <Search className="absolute right-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="اكتب للبحث..."
                  className="w-full h-10 pr-9 pl-3 rounded-xl bg-secondary/70 border border-border/60 text-foreground text-sm font-semibold placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            {/* All option */}
            <DropdownItem
              isSelected={isAllSelected}
              onClick={() => toggleOption("all")}
            >
              {allLabel}
            </DropdownItem>

            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = values.includes(option)
                return (
                  <DropdownItem
                    key={option}
                    isSelected={isSelected}
                    onClick={() => toggleOption(option)}
                  >
                    {option}
                  </DropdownItem>
                )
              })
            ) : (
              <div className="py-4 text-center text-xs font-semibold text-muted-foreground">
                لا توجد نتائج مطابقة
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// Internal item component with dynamic theme classes
function DropdownItem({
  isSelected,
  onClick,
  children,
}: {
  isSelected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "relative flex w-full min-h-11 items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer text-sm font-bold transition-all select-none",
        isSelected 
          ? "bg-primary/15 text-primary" 
          : "text-foreground/90 hover:bg-secondary/80 hover:text-foreground"
      )}
      onClick={onClick}
    >
      <span className="truncate pr-1">{children}</span>
      <div className={cn(
        "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 transition-all",
        isSelected 
          ? "bg-primary border-primary text-primary-foreground shadow-sm" 
          : "border-border/80 bg-background/60"
      )}>
        {isSelected && (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        )}
      </div>
    </button>
  )
}
