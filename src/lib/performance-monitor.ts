// Performance monitoring utilities

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  // Measure component render time
  startMeasure(name: string): void {
    if (typeof window !== 'undefined' && window.performance) {
      this.metrics.set(`${name}_start`, performance.now())
    }
  }

  endMeasure(name: string): number {
    if (typeof window !== 'undefined' && window.performance) {
      const startTime = this.metrics.get(`${name}_start`)
      if (startTime) {
        const duration = performance.now() - startTime
        this.metrics.set(name, duration)
        console.log(`⚡ ${name}: ${duration.toFixed(2)}ms`)
        return duration
      }
    }
    return 0
  }

  // Monitor FPS
  monitorFPS(callback?: (fps: number) => void): void {
    if (typeof window === 'undefined') return

    let lastTime = performance.now()
    let frames = 0

    const measureFPS = () => {
      frames++
      const currentTime = performance.now()
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime))
        frames = 0
        lastTime = currentTime
        
        if (callback) {
          callback(fps)
        } else {
          console.log(`📊 FPS: ${fps}`)
        }
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }

  // Monitor memory usage
  getMemoryUsage(): any {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
      }
    }
    return null
  }

  // Log performance metrics
  logMetrics(): void {
    console.group('🚀 Performance Metrics')
    
    // Device info
    console.log('📱 Device Info:', {
      cores: navigator.hardwareConcurrency || 'unknown',
      memory: (navigator as any).deviceMemory || 'unknown',
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    })

    // Memory usage
    const memory = this.getMemoryUsage()
    if (memory) {
      console.log('💾 Memory Usage:', memory)
    }

    // Custom metrics
    this.metrics.forEach((value, key) => {
      if (!key.endsWith('_start')) {
        console.log(`⏱️ ${key}: ${value.toFixed(2)}ms`)
      }
    })

    console.groupEnd()
  }

  // Check if device is low-end
  isLowEndDevice(): boolean {
    const cores = navigator.hardwareConcurrency || 1
    const memory = (navigator as any).deviceMemory || 1
    const connection = (navigator as any).connection?.effectiveType
    
    return cores <= 2 || memory <= 2 || connection === 'slow-2g' || connection === '2g'
  }

  // Optimize based on device capabilities
  getOptimizationLevel(): 'high' | 'medium' | 'low' {
    if (this.isLowEndDevice()) return 'low'
    
    const cores = navigator.hardwareConcurrency || 1
    const memory = (navigator as any).deviceMemory || 1
    
    if (cores >= 8 && memory >= 8) return 'high'
    return 'medium'
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance()
  
  return {
    startMeasure: monitor.startMeasure.bind(monitor),
    endMeasure: monitor.endMeasure.bind(monitor),
    isLowEnd: monitor.isLowEndDevice(),
    optimizationLevel: monitor.getOptimizationLevel(),
    logMetrics: monitor.logMetrics.bind(monitor)
  }
}
