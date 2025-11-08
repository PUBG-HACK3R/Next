// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map()

  set<T>(key: string, data: T, ttl: number = 60000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  invalidate(key: string): void {
    this.cache.delete(key)
  }

  invalidatePattern(pattern: string): void {
    const keys = Array.from(this.cache.keys())
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    })
  }

  clear(): void {
    this.cache.clear()
  }
}

export const cache = new SimpleCache()

// Cache keys
export const CACHE_KEYS = {
  USER_PROFILE: (userId: string) => `user_profile_${userId}`,
  USER_STATS: (userId: string) => `user_stats_${userId}`,
  PLANS: 'plans',
  INVESTMENT_COUNTS: (userId: string) => `investment_counts_${userId}`,
}

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  SHORT: 30000,    // 30 seconds
  MEDIUM: 60000,   // 1 minute
  LONG: 300000,    // 5 minutes
}
