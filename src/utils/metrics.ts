/**
 * System Metrics Tracker
 * Records uptime, API calls, error counts, and response times.
 */

class MetricsTracker {
  private startTime: number;
  private apiCalls: number;
  private errors: number;
  private totalResponseTimeMs: number;

  constructor() {
    this.startTime = Date.now();
    this.apiCalls = 0;
    this.errors = 0;
    this.totalResponseTimeMs = 0;
  }

  /**
   * Record a successful or completed API call
   * @param durationMs The duration of the call in milliseconds
   */
  public recordApiCall(durationMs: number): void {
    this.apiCalls++;
    this.totalResponseTimeMs += durationMs;
  }

  /**
   * Record an error that occurred in the system
   */
  public recordError(): void {
    this.errors++;
  }

  /**
   * Get the current metrics summary
   */
  public getMetrics() {
    const uptimeMs = Date.now() - this.startTime;
    const uptimeHours = Math.floor(uptimeMs / (1000 * 60 * 60));
    const uptimeMinutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

    // Total interactions attempted = successful api calls + errors
    // (Assuming recordError is called on failure and recordApiCall on success/completion)
    const totalRequests = this.apiCalls + this.errors;
    const errorRate = totalRequests > 0 ? (this.errors / totalRequests) * 100 : 0;
    const avgResponseTime = this.apiCalls > 0 ? this.totalResponseTimeMs / this.apiCalls : 0;

    return {
      uptimeStr: `${uptimeHours}s ${uptimeMinutes}dk`,
      apiCalls: this.apiCalls,
      errors: this.errors,
      errorRate: errorRate.toFixed(2),
      avgResponseTimeMs: Math.round(avgResponseTime),
    };
  }
}

export const metrics = new MetricsTracker();
