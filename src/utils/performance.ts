// Performance utilities for optimizing animations on low-end devices

export const getReducedMotionPreference = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // Check for low-end device indicators
  const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
  const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
  const isLowMemory = (navigator as any).deviceMemory && (navigator as any).deviceMemory < 4
  const isLowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency < 4
  
  return isSlowConnection || isLowMemory || isLowCores
}

export const shouldReduceAnimations = (): boolean => {
  return getReducedMotionPreference() || isLowEndDevice()
}

// Optimized transition settings for performance
export const getOptimizedTransition = (duration: number = 0.3) => {
  if (shouldReduceAnimations()) {
    return { duration: 0.1, ease: "easeOut" }
  }
  return { duration, ease: "easeOut" }
}

// Simplified animation variants for low-end devices
export const getOptimizedVariants = () => {
  if (shouldReduceAnimations()) {
    return {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    }
  }
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  }
}
