import { useState, useEffect } from 'react';

export function useParallax() {
  const [scrollY, setScrollY] = useState(0);

  // تعطيل Parallax على الموبايل لتحسين الأداء
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  // تعطيل Parallax إذا فضّل المستخدم تقليل الحركة (Accessibility)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const shouldDisableParallax = isMobile || prefersReducedMotion;

  useEffect(() => {
    // لا نستمع لـ scroll على الموبايل أو عند تفضيل تقليل الحركة
    if (shouldDisableParallax) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Use passive listener for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [shouldDisableParallax]);

  // على الموبايل نُرجع قيماً ثابتة بدون أي تأثير حركي
  const effectiveScrollY = shouldDisableParallax ? 0 : scrollY;

  return {
    scrollY: effectiveScrollY,
    getParallaxStyle: (speed: number = 0.5) =>
      shouldDisableParallax
        ? {}
        : { transform: `translateY(${effectiveScrollY * speed}px)` },
    getOpacity: (fadeStart: number = 0, fadeEnd: number = 500) => {
      if (shouldDisableParallax) return 1;
      if (effectiveScrollY < fadeStart) return 1;
      if (effectiveScrollY > fadeEnd) return 0;
      return 1 - (effectiveScrollY - fadeStart) / (fadeEnd - fadeStart);
    },
    getScale: (baseScale: number = 1, scaleSpeed: number = 0.0002) =>
      shouldDisableParallax
        ? {}
        : { transform: `scale(${baseScale + effectiveScrollY * scaleSpeed})` },
  };
}
