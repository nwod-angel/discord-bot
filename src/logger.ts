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
import { logs, type Logger as OtelLogger, SeverityNumber } from "@opentelemetry/api-logs";

const level = process.env["LOG_LEVEL"] || "info";

// Lazy-init OTel logger — safe to call before SDK is started;
// the LoggerProvider won't be registered until sdk.start() in instrumentation.ts.
let _otelLogger: OtelLogger | undefined;
function otelLogger(): OtelLogger | undefined {
  // Only bridge when OTel SDK has been started (LoggerProvider is registered)
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

function bridgeToOtel(bindings: Record<string, unknown>, method: string) {
  const otel = otelLogger();
  if (!otel) return;

  // Extract the message and known pino fields
  const { msg, level: _lvl, time: _time, pid: _pid, hostname: _host, ...rest } = bindings;
  const severity = SEVERITY_MAP[method] ?? SeverityNumber.INFO;

  otel.emit({
    severityNumber: severity,
    severityText: method.toUpperCase(),
    body: typeof msg === "string" ? msg : "",
    attributes: Object.keys(rest).length > 0 ? rest : undefined,
  });
}

export const logger = pino({
  level,
  // Pretty-print only when explicitly in development mode (pino-pretty is a devDependency)
  // In production or when NODE_ENV is unset, output structured JSON
  transport:
    process.env["NODE_ENV"] === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
}, bridgeToOtel);

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
