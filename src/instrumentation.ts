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
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";

// Only initialise OTel if not in test environment
const isTestEnv =
  process.env["VITEST"] !== undefined ||
  process.env["JEST_WORKER_ID"] !== undefined;

if (!isTestEnv) {
  const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"];
  const otlpHeaders = process.env["OTEL_EXPORTER_OTLP_HEADERS"];

  // Build headers object for OTLP exporters
  const headers: Record<string, string> = {};
  if (otlpHeaders) {
    headers["x-honeycomb-team"] = otlpHeaders;
  }

  // Select exporters based on env vars
  // Honeycomb requires full path when setting URL in code
  const spanExporter = otlpEndpoint
    ? new OTLPTraceExporter({ url: `${otlpEndpoint}/v1/traces`, headers })
    : new ConsoleSpanExporter();

  const logExporter = otlpEndpoint
    ? new OTLPLogExporter({ url: `${otlpEndpoint}/v1/logs`, headers })
    : new ConsoleLogRecordExporter();

  const metricExporter = otlpEndpoint
    ? new OTLPMetricExporter({ url: `${otlpEndpoint}/v1/metrics`, headers })
    : new ConsoleMetricExporter();

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
    spanProcessors: [new SimpleSpanProcessor(spanExporter)],
    logRecordProcessor: new SimpleLogRecordProcessor(logExporter),
    meterProvider,
    instrumentations: [new HttpInstrumentation(), new PinoInstrumentation()],
  });

  try {
    sdk.start();
    const exporterType = otlpEndpoint ? "Honeycomb OTLP" : "stdout";
    console.log(`[otel] OpenTelemetry SDK initialised (${exporterType} exporter)`);
  } catch (err) {
    console.error("[otel] Failed to initialise OpenTelemetry SDK:", err);
  }

  process.on("SIGTERM", () => {
    sdk.shutdown().catch((err) => {
      console.error("[otel] Error during SDK shutdown:", err);
    });
  });
}
