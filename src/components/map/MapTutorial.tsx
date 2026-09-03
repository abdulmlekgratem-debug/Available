import { useState, useEffect } from 'react'
import { X, MousePointer, Navigation, MapPin, CheckCircle2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MapTutorialProps {
  isOpen: boolean
  onClose: () => void
}

const tutorialSteps = [
  {
    icon: MousePointer,
    title: 'نقرة واحدة',
    description: 'اضغط على أي دبوس لعرض تفاصيل اللوحة الإعلانية',
    color: '#3b82f6'
  },
  {
    icon: CheckCircle2,
    title: 'نقرة مزدوجة',
    description: 'اضغط مرتين على الدبوس لتحديد اللوحة وإضافتها للقائمة',
    color: '#d4af37'
  },
  {
    icon: Navigation,
    title: 'وضع الملاحة',
    description: 'بعد تحديد لوحات، اضغط زر الملاحة لبدء التوجيه',
    color: '#22c55e'
  },
  {
    icon: MapPin,
    title: 'التتبع المباشر',
    description: 'فعّل GPS للتتبع التلقائي والانتقال للنقطة التالية عند الوصول',
    color: '#ef4444'
  }
]

export default function MapTutorial({ isOpen, onClose }: MapTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('map-tutorial-seen')
    if (seen) {
      setHasSeenTutorial(true)
    }
  }, [])

  const handleClose = () => {
    localStorage.setItem('map-tutorial-seen', 'true')
    setHasSeenTutorial(true)
    onClose()
  }

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleClose()
    }
  }

  if (!isOpen) return null

  const step = tutorialSteps[currentStep]
  const Icon = step.icon

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      {/* Modal */}
      <div className="relative bg-card/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-primary/30 max-w-sm w-full overflow-hidden">
        {/* Close Button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-3 left-3 w-8 h-8 text-muted-foreground hover:text-foreground z-10"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Header */}
        <div className="bg-gradient-to-r from-primary via-gold-light to-primary p-4 text-center">
          <h2 className="text-lg font-bold text-primary-foreground">دليل استخدام الخريطة</h2>
          <p className="text-xs text-primary-foreground/80 mt-1">تعلم كيفية التحديد والملاحة</p>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 py-3 bg-muted/30">
          {tutorialSteps.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStep 
                  ? 'bg-primary w-6' 
                  : index < currentStep 
                    ? 'bg-primary/50' 
                    : 'bg-muted'
              }`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: `${step.color}20`, border: `2px solid ${step.color}40` }}
          >
            <Icon className="w-8 h-8" style={{ color: step.color }} />
          </div>
          
          <h3 className="text-xl font-bold text-foreground mb-2">{step.title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border/50 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep(prev => prev - 1)}
            >
              السابق
            </Button>
          )}
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={nextStep}
          >
            {currentStep === tutorialSteps.length - 1 ? 'ابدأ الآن' : 'التالي'}
            <ChevronRight className="w-4 h-4 mr-1" />
          </Button>
        </div>

        {/* Skip */}
        {!hasSeenTutorial && (
          <div className="pb-4 text-center">
            <button 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={handleClose}
            >
              تخطي الشرح
            </button>
          </div>
        )}
      </div>
    </div>
  )
}