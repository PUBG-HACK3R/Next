// Performance optimization utilities for smooth experience on low-end devices

// Check if user prefers reduced motion
export const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Detect low-end device based on hardware concurrency and memory
export const isLowEndDevice = () => {
  if (typeof window === 'undefined') return false
  
  const hardwareConcurrency = navigator.hardwareConcurrency || 1
  const deviceMemory = (navigator as any).deviceMemory || 1
  
  // Consider device low-end if it has <= 2 CPU cores or <= 2GB RAM
  return hardwareConcurrency <= 2 || deviceMemory <= 2
}

// Get optimized animation config based on device capabilities
export const getAnimationConfig = () => {
  const isLowEnd = isLowEndDevice()
  const reducedMotion = prefersReducedMotion()
  
  if (reducedMotion) {
    return {
      duration: 0,
      ease: "linear" as const,
      animate: false
    }
  }
  
  if (isLowEnd) {
    return {
      duration: 0.2,
      ease: "easeOut" as const,
      animate: true,
      reduced: true
    }
  }
  
  return {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1] as const,
    animate: true,
    reduced: false
  }
}

// Debounce function for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function for scroll events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

// Lazy load images with intersection observer
export const createImageObserver = (callback: (entry: IntersectionObserverEntry) => void) => {
  if (typeof window === 'undefined') return null
  
  return new IntersectionObserver(
    (entries) => {
      entries.forEach(callback)
    },
    {
      rootMargin: '50px',
      threshold: 0.1
    }
  )
}

// Check if device supports hardware acceleration
export const supportsHardwareAcceleration = () => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  return !!gl
}

// Get optimal frame rate for animations
export const getOptimalFrameRate = () => {
  const isLowEnd = isLowEndDevice()
  return isLowEnd ? 30 : 60
}

// Memory-efficient component update checker
export const shouldComponentUpdate = (prevProps: any, nextProps: any) => {
  return JSON.stringify(prevProps) !== JSON.stringify(nextProps)
}
