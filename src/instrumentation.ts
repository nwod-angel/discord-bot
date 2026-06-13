/**
 * OpenTelemetry instrumentation for the Discord Bot.
 *
 * This file MUST be imported before any other module in the application.
 *
 * Configuration via env vars:
 *   OTEL_SERVICE_NAME          — service name (default: "nwod-bot")
 *   OTEL_EXPORTER_OTLP_ENDPOINT — Honeycomb OTLP endpoint (optional)
 *   OTEL_EXPORTER_OTLP_HEADERS  — Honeycomb API key header (optional)
 */

import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
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

const isTestEnv =
  process.env["VITEST"] !== undefined ||
  process.env["JEST_WORKER_ID"] !== undefined;

if (!isTestEnv) {
  // Enable OTel diagnostic logging to see SDK internals
  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

  const otlpEndpoint = process.env["OTEL_EXPORTER_OTLP_ENDPOINT"];
  const otlpHeaders = process.env["OTEL_EXPORTER_OTLP_HEADERS"];

  // Log actual env var values (mask API key)
  console.log("[otel-diagnostics] env check:");
  console.log("  OTEL_EXPORTER_OTLP_ENDPOINT:", otlpEndpoint || "(not set)");
  console.log("  OTEL_EXPORTER_OTLP_HEADERS:", otlpHeaders ? "SET (masked)" : "(not set)");
  console.log("  OTEL_SERVICE_NAME:", process.env["OTEL_SERVICE_NAME"] || "(not set)");

  // Build headers for OTLP exporters
  const headers: Record<string, string> = {};
  if (otlpHeaders) {
    headers["x-honeycomb-team"] = otlpHeaders;
  }

  // When OTLP endpoint is set, use OTLP exporters with full paths
  // When not set, fall back to console (stdout)
  const useOtlp = !!otlpEndpoint;
  const baseUrl = otlpEndpoint || "";

  const spanExporter = useOtlp
    ? new OTLPTraceExporter({ url: `${baseUrl}/v1/traces`, headers })
    : new ConsoleSpanExporter();

  const logExporter = useOtlp
    ? new OTLPLogExporter({ url: `${baseUrl}/v1/logs`, headers })
    : new ConsoleLogRecordExporter();

  const metricExporter = useOtlp
    ? new OTLPMetricExporter({ url: `${baseUrl}/v1/metrics`, headers })
    : new ConsoleMetricExporter();

  // Intercept export calls to verify data is actually being sent
  if (useOtlp) {
    const originalSpanExport = spanExporter.export.bind(spanExporter);
    spanExporter.export = (spans, resultCallback) => {
      console.log(`[otel-diagnostics] EXPORTING ${spans.length} SPANS to ${baseUrl}/v1/traces`);
      return originalSpanExport(spans, resultCallback);
    };

    const originalLogExport = logExporter.export.bind(logExporter);
    logExporter.export = (logs, resultCallback) => {
      console.log(`[otel-diagnostics] EXPORTING ${logs.length} LOG RECORDS to ${baseUrl}/v1/logs`);
      return originalLogExport(logs, resultCallback);
    };
  }

  const metricReader = new PeriodicExportingMetricReader({
    exporter: metricExporter,
    exportIntervalMillis: 30_000,
  });

  const meterProvider = new MeterProvider({ readers: [metricReader] });

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
    console.log(`[otel] OpenTelemetry SDK initialised (${useOtlp ? "Honeycomb OTLP" : "stdout"} exporter)`);
    if (useOtlp) {
      console.log(`[otel] Endpoint: ${baseUrl}`);
    }

    // Create a test span to verify spans are being created and exported
    const { trace } = await import("@opentelemetry/api");
    const tracer = trace.getTracer("diagnostics");
    const testSpan = tracer.startSpan("diagnostics-startup-test");
    testSpan.setAttribute("test.type", "diagnostics");
    testSpan.end();
    console.log("[otel-diagnostics] Test span created and ended");
  } catch (err) {
    console.error("[otel] Failed to initialise OpenTelemetry SDK:", err);
  }

  process.on("SIGTERM", () => {
    sdk.shutdown().catch((err) => {
      console.error("[otel] Error during SDK shutdown:", err);
    });
  });
}
