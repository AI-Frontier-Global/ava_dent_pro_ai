// Application Monitoring — Provider-Agnostic
//
// Tracks: page crashes, AI failures, database failures, edge function
// failures, latency, and provider failures. Stores metrics in-memory
// for the session (no external APM dependency). A future provider
// (Datadog, Sentry, etc.) can be plugged into the `export` sink.

export interface ErrorMetric {
  timestamp: number;
  category: string;
  context: string;
  message: string;
  recoverable: boolean;
}

export interface LatencyMetric {
  timestamp: number;
  operation: string;
  durationMs: number;
  success: boolean;
}

export interface MonitoringSnapshot {
  errors: ErrorMetric[];
  latencies: LatencyMetric[];
  errorCounts: Record<string, number>;
  avgLatency: Record<string, number>;
  totalOperations: number;
  failureRate: number;
}

type ErrorSink = (metric: ErrorMetric) => void;
type LatencySink = (metric: LatencyMetric) => void;

const MAX_ERRORS = 200;
const MAX_LATENCIES = 200;

class MonitoringService {
  private errors: ErrorMetric[] = [];
  private latencies: LatencyMetric[] = [];
  private errorSinks: ErrorSink[] = [];
  private latencySinks: LatencySink[] = [];

  recordError(metric: ErrorMetric): void {
    this.errors.push(metric);
    if (this.errors.length > MAX_ERRORS) this.errors.shift();
    for (const sink of this.errorSinks) {
      try {
        sink(metric);
      } catch {
        // sink failure must not break the app
      }
    }
  }

  recordLatency(metric: LatencyMetric): void {
    this.latencies.push(metric);
    if (this.latencies.length > MAX_LATENCIES) this.latencies.shift();
    for (const sink of this.latencySinks) {
      try {
        sink(metric);
      } catch {
        // ignore
      }
    }
  }

  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      this.recordLatency({ timestamp: start, operation, durationMs: Date.now() - start, success: true });
      return result;
    } catch (err) {
      this.recordLatency({ timestamp: start, operation, durationMs: Date.now() - start, success: false });
      throw err;
    }
  }

  getSnapshot(): MonitoringSnapshot {
    const errorCounts: Record<string, number> = {};
    for (const e of this.errors) {
      errorCounts[e.category] = (errorCounts[e.category] ?? 0) + 1;
    }

    const latencyByOp: Record<string, { sum: number; count: number }> = {};
    for (const l of this.latencies) {
      if (!latencyByOp[l.operation]) latencyByOp[l.operation] = { sum: 0, count: 0 };
      latencyByOp[l.operation].sum += l.durationMs;
      latencyByOp[l.operation].count += 1;
    }
    const avgLatency: Record<string, number> = {};
    for (const [op, { sum, count }] of Object.entries(latencyByOp)) {
      avgLatency[op] = Math.round(sum / count);
    }

    const totalOps = this.latencies.length;
    const failedOps = this.latencies.filter((l) => !l.success).length;

    return {
      errors: [...this.errors],
      latencies: [...this.latencies],
      errorCounts,
      avgLatency,
      totalOperations: totalOps,
      failureRate: totalOps > 0 ? failedOps / totalOps : 0,
    };
  }

  attachErrorSink(sink: ErrorSink): () => void {
    this.errorSinks.push(sink);
    return () => {
      this.errorSinks = this.errorSinks.filter((s) => s !== sink);
    };
  }

  attachLatencySink(sink: LatencySink): () => void {
    this.latencySinks.push(sink);
    return () => {
      this.latencySinks = this.latencySinks.filter((s) => s !== sink);
    };
  }

  clear(): void {
    this.errors = [];
    this.latencies = [];
  }
}

export const monitoring = new MonitoringService();
