/**
 * Structured logger for the Discord Bot.
 *
 * Uses pino for high-performance JSON logging AND emits OTel log records
 * so logs appear in Honeycomb.
 *
 * PinoInstrumentation only adds trace context fields to pino entries —
 * it does NOT route pino output through OTel's log pipeline. This module
 * bridges the gap by emitting OTel log records alongside pino output.
 *
 * Configuration via env vars:
 *   LOG_LEVEL — minimum log level (default: "info")
 *              Options: "fatal", "error", "warn", "info", "debug", "trace"
 */

import pino from "pino";
import { PassThrough } from "node:stream";
import { logs, type Logger as OtelLogger, SeverityNumber } from "@opentelemetry/api-logs";

const level = process.env["LOG_LEVEL"] || "info";

// Lazy-init OTel logger — safe to call before SDK is started;
// the LoggerProvider won't be registered until sdk.start() in instrumentation.ts.
let _otelLogger: OtelLogger | undefined;
function otelLogger(): OtelLogger | undefined {
  if (!_otelLogger) {
    try {
      _otelLogger = logs.getLogger("nwod-bot");
    } catch {
      // OTel not initialised yet — skip bridging silently
    }
  }
  return _otelLogger;
}

const SEVERITY_MAP: Record<string, SeverityNumber> = {
  trace: SeverityNumber.TRACE,
  debug: SeverityNumber.DEBUG,
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

/**
 * Writable stream that bridges pino output to OTel log records.
 * Pino sends newline-delimited JSON strings to stream.write().
 */
const otelBridgeStream = new PassThrough({
  write(chunk: Buffer, _encoding: BufferEncoding, callback: () => void) {
    try {
      const otel = otelLogger();
      if (otel) {
        const parsed = JSON.parse(chunk.toString());
        const { msg, level: _lvl, time: _time, pid: _pid, hostname: _host, trace_id, span_id, ...rest } = parsed;
        const severity = SEVERITY_MAP[_lvl] ?? SeverityNumber.INFO;

        // Re-include trace context if PinoInstrumentation added it
        if (trace_id) rest["trace_id"] = trace_id;
        if (span_id) rest["span_id"] = span_id;

        otel.emit({
          severityNumber: severity,
          severityText: String(_lvl).toUpperCase(),
          body: typeof msg === "string" ? msg : "",
          attributes: Object.keys(rest).length > 0 ? rest : undefined,
        });
      }
    } catch {
      // Swallow — never let OTel bridge break pino
    }
    callback();
  },
});

export const logger = pino(
  {
    level,
    // Pretty-print only when explicitly in development mode (pino-pretty is a devDependency)
    // In production or when NODE_ENV is unset, output structured JSON
    transport:
      process.env["NODE_ENV"] === "development"
        ? { target: "pino-pretty", options: { colorize: true } }
        : undefined,
  },
  pino.multistream([
    { level, stream: process.stdout },
    { level, stream: otelBridgeStream },
  ]),
);

/**
 * Create a child logger with request-scoped context.
 *
 * @example
 * const cmdLog = logger.child({ userId, guildId, command: "roll" });
 * cmdLog.info("roll command invoked");
 */
export function createChildLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
