import { useToast } from '@/hooks/use-toast'
import { useEffect } from 'react'

export default function ToastNotifications() {
  const { toasts, dismiss } = useToast()
  const visibleId = toasts.find(item => item.open)?.id
  useEffect(() => {
    if (!visibleId) return
    const timer = setTimeout(() => dismiss(visibleId), 5000)
    return () => clearTimeout(timer)
  }, [visibleId])
  return <div className="fixed bottom-24 inset-x-4 z-[10000] flex flex-col items-center gap-2 pointer-events-none" aria-live="polite" aria-atomic="false">
    {toasts.filter(item => item.open).map(item => <div key={item.id} role={item.variant === 'destructive' ? 'alert' : 'status'} className="pointer-events-auto w-full max-w-sm rounded-xl border border-border bg-card text-foreground p-4 shadow-lg">
      <div className="flex items-start justify-between gap-3"><strong>{item.title}</strong><button type="button" onClick={() => dismiss(item.id)} aria-label="إغلاق التنبيه" className="min-w-8 min-h-8">×</button></div>
      {item.description && <p className="text-sm mt-1 text-muted-foreground">{item.description}</p>}
    </div>)}
  </div>
}
