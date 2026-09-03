import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw, X, Maximize, Move } from 'lucide-react'

interface ImageViewerModalProps {
  imageUrl: string | null
  onClose: () => void
}

export default function ImageViewerModal({ imageUrl, onClose }: ImageViewerModalProps) {
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const lastTouchDistanceRef = useRef<number | null>(null)
  const pointerDownPos = useRef({ x: 0, y: 0 })
  const hasDragged = useRef(false)

  // Reset zoom & position when image changes or opens
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    setIsDragging(false)
  }, [imageUrl])

  // Keyboard navigation (ESC to close, + / - to zoom, 0 to reset)
  useEffect(() => {
    if (!imageUrl) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === '+' || e.key === '=') handleZoomIn()
      else if (e.key === '-' || e.key === '_') handleZoomOut()
      else if (e.key === '0') handleReset()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [imageUrl, scale])

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + 0.75, 4))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const next = Math.max(prev - 0.75, 1)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Single Click / Single Tap Zoom
  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    // إذا كان المستخدم يسحب الصورة، لا ننفذ نقرة التكبير
    if (hasDragged.current) return

    // نقرة واحدة للتكبير المباشر
    if (scale === 1) {
      setScale(2.5)
    } else if (scale < 3.5) {
      setScale(3.5)
    } else {
      handleReset()
    }
  }

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.deltaY < 0) {
      setScale(prev => Math.min(prev + 0.35, 4))
    } else {
      setScale(prev => {
        const next = Math.max(prev - 0.35, 1)
        if (next === 1) setPosition({ x: 0, y: 0 })
        return next
      })
    }
  }, [])

  // Pointer / Mouse / Single-Touch Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY }
    hasDragged.current = false

    if (scale > 1) {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y)
    if (dist > 6) {
      hasDragged.current = true
    }

    if (!isDragging || scale <= 1) return
    e.preventDefault()
    e.stopPropagation()
    
    // Calculate new position with bounds
    const maxPanX = (window.innerWidth * (scale - 0.7)) / 2
    const maxPanY = (window.innerHeight * (scale - 0.7)) / 2

    const newX = Math.max(-maxPanX, Math.min(maxPanX, e.clientX - dragStart.x))
    const newY = Math.max(-maxPanY, Math.min(maxPanY, e.clientY - dragStart.y))

    setPosition({ x: newX, y: newY })
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false)
      try {
        ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
      } catch (_) {}
    }
  }

  // 2-Finger Pinch to Zoom for Touch Devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      lastTouchDistanceRef.current = dist
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDistanceRef.current !== null) {
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const factor = dist / lastTouchDistanceRef.current
      lastTouchDistanceRef.current = dist

      setScale(prev => {
        const next = Math.max(1, Math.min(4, prev * factor))
        if (next === 1) setPosition({ x: 0, y: 0 })
        return next
      })
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      lastTouchDistanceRef.current = null
    }
  }

  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[1000002] backdrop-blur-xl flex items-center justify-center p-2 select-none animate-fade-in"
      style={{ touchAction: 'none' }}
      onClick={() => {
        if (scale > 1) {
          handleReset()
        } else {
          onClose()
        }
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Floating Controls */}
      <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 sm:gap-2 bg-slate-950/90 border border-primary/40 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= 4}
          className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/25 active:scale-95 text-primary border border-primary/30 flex items-center justify-center transition-all disabled:opacity-40"
          title="تكبير (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        {/* Zoom Percentage / Reset */}
        <button
          type="button"
          onClick={handleReset}
          className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-black text-white hover:text-primary transition-all font-mono active:scale-95 flex items-center gap-1"
          title="إعادة التعيين إلى 100%"
        >
          <span>{Math.round(scale * 100)}%</span>
          {scale > 1 && <RotateCcw className="w-3 h-3 text-primary animate-spin-once" />}
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/25 active:scale-95 text-primary border border-primary/30 flex items-center justify-center transition-all disabled:opacity-40"
          title="تصغير (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-700 mx-0.5 sm:mx-1" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-destructive/20 hover:bg-destructive active:scale-95 text-white border border-destructive/40 flex items-center justify-center transition-all shadow-lg"
          title="إغلاق (ESC)"
        >
          <X className="w-4 h-4 stroke-[3]" />
        </button>
      </div>

      {/* Main Image Stage */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center overflow-hidden cursor-default"
        onClick={(e) => {
          if (e.target === containerRef.current) {
            onClose()
          }
        }}
      >
        <div
          className="relative max-w-[94vw] max-h-[85vh] flex items-center justify-center transition-transform"
          style={{
            transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.25, 1, 0.5, 1)',
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            touchAction: 'none',
          }}
          onClick={handleImageClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            src={imageUrl}
            alt="معاينة اللوحة بدقة عالية"
            draggable={false}
            className="max-w-[92vw] max-h-[82vh] w-auto h-auto object-contain rounded-2xl border-2 border-primary/40 shadow-[0_25px_80px_rgba(0,0,0,0.95)] pointer-events-auto select-none"
            onError={(e) => { (e.target as HTMLImageElement).src = "/roadside-billboard.png" }}
          />
        </div>
      </div>

      {/* Dynamic Floating Helper Pill */}
      <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-[11px] font-bold text-white/85 bg-slate-950/85 border border-slate-700/60 px-4 py-1.5 rounded-full backdrop-blur-md pointer-events-none z-50 shadow-2xl flex items-center gap-2">
        {scale > 1 ? (
          <>
            <Move className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span>اسحب للتنقل في تفاصيل اللوحة • انقر على الصورة للتصغير</span>
          </>
        ) : (
          <>
            <Maximize className="w-3.5 h-3.5 text-primary" />
            <span>انقر على الصورة أو زر (+) للتكبير الفوري</span>
          </>
        )}
      </div>
    </div>
  )
}
