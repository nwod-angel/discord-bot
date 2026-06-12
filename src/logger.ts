/**
 * Structured logger for the Discord Bot.
 *
 * Uses pino for high-performance JSON logging.
 * When OTel instrumentation is loaded, logs are automatically correlated
 * with active traces (trace_id, span_id added to every log entry).
 *
 * Configuration via env vars:
 *   LOG_LEVEL — minimum log level (default: "info")
 *              Options: "fatal", "error", "warn", "info", "debug", "trace"
 */

import pino from "pino";

const level = process.env["LOG_LEVEL"] || "info";

export const logger = pino({
  level,
  // Pretty-print only when explicitly in development mode (pino-pretty is a devDependency)
  // In production or when NODE_ENV is unset, output structured JSON
  transport:
    process.env["NODE_ENV"] === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});

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
