/**
 * OTel metric instruments for the Discord Bot.
 *
 * Instruments are created lazily from the global MeterProvider
 * (registered in instrumentation.ts). If OTel is not initialised
 * (e.g. in tests), all methods are safe no-ops.
 */

import { metrics } from "@opentelemetry/api";

const meter = metrics.getMeter("nwod-bot");

// ── Discord API Metrics (outbound from bot) ─────────────────────

/** Count of Discord API calls by endpoint and status code. */
export const discordApiCallCount = meter.createCounter("http.client.request.count", {
  description: "Number of outbound HTTP requests (Discord API)",
});

/** Duration of Discord API calls (ms). */
export const discordApiCallDuration = meter.createHistogram("http.client.request.duration", {
  description: "Outbound HTTP request duration in milliseconds",
  unit: "ms",
});

// ── Rate Limit Metrics ──────────────────────────────────────────

/** Count of HTTP 429 rate limit responses received. */
export const rateLimitCount = meter.createCounter("http.client.rate_limit", {
  description: "Number of HTTP 429 rate limit responses",
});
