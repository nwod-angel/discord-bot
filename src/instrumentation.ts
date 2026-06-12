/**
 * OpenTelemetry instrumentation for the Discord Bot.
 *
 * This file MUST be imported before any other module in the application.
 * It initialises the OTel SDK with explicit registrations (not auto-instrumentation)
 * to avoid esbuild/nft dynamic require issues (see ADR-0019).
 *
 * Usage:
 *   npx tsx --import ./src/instrumentation.ts src/Bot.ts
 *
 * Or imported at the top of src/Bot.ts.
 *
 * Configuration via env vars:
 *   OTEL_SERVICE_NAME          — service name (default: "nwod-bot")
 *   OTEL_EXPORTER_OTLP_ENDPOINT — Honeycomb OTLP endpoint (optional, falls back to stdout)
 *   OTEL_EXPORTER_OTLP_HEADERS  — Honeycomb API key header (optional)
 *   OTEL_LOG_LEVEL              — minimum log level for OTel log processor (default: inherits from LOG_LEVEL)
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import {
  SimpleSpanProcessor,
  ConsoleSpanExporter,
} from "@opentelemetry/sdk-trace-base";
import {
  SimpleLogRecordProcessor,
  ConsoleLogRecordExporter,
} from "@opentelemetry/sdk-logs";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter,
} from "@opentelemetry/sdk-metrics";

// Only initialise OTel if not in test environment
const isTestEnv =
  process.env["VITEST"] !== undefined ||
  process.env["JEST_WORKER_ID"] !== undefined;

if (!isTestEnv) {
  // ── Determine exporters based on env vars ────────────────────────
  const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"];
  const otlpHeaders = process.env["OTEL_EXPORTER_OTLP_HEADERS"];

  let spanExporter: any;
  let logExporter: any;
  let metricExporter: any;

  if (otlpEndpoint) {
    // OTLP exporters for Honeycomb
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    );
    const { OTLPLogExporter } = await import(
      "@opentelemetry/exporter-logs-otlp-http"
    );
    const { OTLPMetricExporter } = await import(
      "@opentelemetry/exporter-metrics-otlp-http"
    );

    const headers: Record<string, string> = {};
    if (otlpHeaders) {
      headers["x-honeycomb-team"] = otlpHeaders;
    }

    spanExporter = new OTLPTraceExporter({
      url: `${otlpEndpoint}/v1/traces`,
      headers,
    });
    logExporter = new OTLPLogExporter({
      url: `${otlpEndpoint}/v1/logs`,
      headers,
    });
    metricExporter = new OTLPMetricExporter({
      url: `${otlpEndpoint}/v1/metrics`,
      headers,
    });
  } else {
    // Console exporters (stdout) — fallback when Honeycomb not configured
    spanExporter = new ConsoleSpanExporter();
    logExporter = new ConsoleLogRecordExporter();
    metricExporter = new ConsoleMetricExporter();
  }

  // ── Metrics Provider ─────────────────────────────────────────────
  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 30_000,
  });

  const meterProvider = new MeterProvider({
    readers: [metricReader],
  });

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: process.env["OTEL_SERVICE_NAME"] || "nwod-bot",
      [ATTR_SERVICE_VERSION]: process.env["npm_package_version"] || "0.0.0",
    }),

    // ── Trace Processor ────────────────────────────────────────────
    spanProcessors: [new SimpleSpanProcessor(spanExporter)],

    // ── Log Processor ──────────────────────────────────────────────
    logRecordProcessor: new SimpleLogRecordProcessor(logExporter),

    // ── Metrics Provider ──────────────────────────────────────────
    meterProvider,

    // ── Instrumentations (explicit registrations) ─────────────────
    instrumentations: [new HttpInstrumentation(), new PinoInstrumentation()],
  });

  // Wrap in try-catch for best-effort observability (ADR-0019: never crash the app)
  try {
    sdk.start();
    const exporterType = otlpEndpoint ? "Honeycomb OTLP" : "stdout";
    console.log(`[otel] OpenTelemetry SDK initialised (${exporterType} exporter)`);
  } catch (err) {
    console.error("[otel] Failed to initialise OpenTelemetry SDK:", err);
    console.log(
      "[otel] Continuing without observability — logs will go to stdout only",
    );
  }

  // Graceful shutdown
  process.on("SIGTERM", () => {
    sdk.shutdown().catch((err) => {
      console.error("[otel] Error during SDK shutdown:", err);
    });
  });
}
