/**
 * Rate Limiter - Aynı kullanıcıdan çok hızlı istekleri engeller
 * Güvenlik açısından kritik önlem
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * @param maxRequests - Time penceresinde izin verilen maksimum istek
   * @param windowMs - Time penceresi (milisaniye cinsinden)
   *
   * Örnek: maxRequests=20, windowMs=60000
   * → 60 saniyede en fazla 20 istek
   */
  constructor(maxRequests: number = 20, windowMs: number = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Kullanıcının istek limitini kontrol et
   * @param userId - Telegram kullanıcı ID'si
   * @returns { allowed: boolean, remaining: number, resetTime: number }
   */
  public checkLimit(userId: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const userEntry = this.requests.get(userId);

    // Kullanıcı daha önce istekte bulunmamışsa
    if (!userEntry) {
      this.requests.set(userId, {
        count: 1,
        resetTime: now + this.windowMs,
      });

      // Eski kayıtları temizle (memory leak önleme)
      this.cleanup(now);

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: now + this.windowMs,
      };
    }

    // Time penceresi dolmuşsa sıfırla
    if (now >= userEntry.resetTime) {
      userEntry.count = 1;
      userEntry.resetTime = now + this.windowMs;

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: userEntry.resetTime,
      };
    }

    // Limit aşılıysa
    if (userEntry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: userEntry.resetTime,
      };
    }

    // İstek sayısını artır
    userEntry.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - userEntry.count,
      resetTime: userEntry.resetTime,
    };
  }

  /**
   * Kullanıcının limitini sıfırla (manuel reset için)
   */
  public resetUser(userId: string): void {
    this.requests.delete(userId);
  }

  /**
   * Tüm limitleri sıfırla
   */
  public resetAll(): void {
    this.requests.clear();
  }

  /**
   * Eski kayıtları temizle (memory management)
   */
  private cleanup(now: number): void {
    for (const [userId, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        this.requests.delete(userId);
      }
    }
  }

  /**
   * İstatistikleri al
   */
  public getStats(): {
    totalUsers: number;
    activeUsers: number;
  } {
    const now = Date.now();
    let activeUsers = 0;

    for (const entry of this.requests.values()) {
      if (now < entry.resetTime) {
        activeUsers++;
      }
    }

    return {
      totalUsers: this.requests.size,
      activeUsers,
    };
  }
}

// Global rate limiter instance
// 60 saniyede en fazla 20 istek
export const rateLimiter = new RateLimiter(20, 60000);

// Daha sıkı limit gerektiren durumlar için:
// export const strictRateLimiter = new RateLimiter(10, 60000); // 10 istek/dakika
// export const looseRateLimiter = new RateLimiter(30, 60000); // 30 istek/dakika
