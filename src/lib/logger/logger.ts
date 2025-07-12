import pino from "pino"

// Determine if we should use pretty printing
// Only use pino-pretty in development AND when not in serverless/edge environments
const shouldUsePretty =
  process.env.NODE_ENV === "development" &&
  !process.env.VERCEL &&
  !process.env.NEXT_RUNTIME

const loggerConfig = {
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  // Only use pino-pretty in local development
  transport: shouldUsePretty
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "yyyy-mm-dd HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  formatters: {
    level: (label: string) => {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
  },
}

// Create the logger instance
const logger = pino(loggerConfig)

// Helper function to log with proper pino format
const logWithMetadata = (
  logFn: (obj: unknown, msg?: string) => void,
  message: string,
  ...args: unknown[]
) => {
  // If first arg is an object, use it as metadata
  if (args.length > 0 && typeof args[0] === "object" && args[0] !== null) {
    logFn(args[0], message)
  } else {
    logFn(message)
  }
}

// Export logger with typed interface
export const log = {
  trace: (message: string, ...args: unknown[]) =>
    logWithMetadata(logger.trace.bind(logger), message, ...args),
  debug: (message: string, ...args: unknown[]) =>
    logWithMetadata(logger.debug.bind(logger), message, ...args),
  info: (message: string, ...args: unknown[]) =>
    logWithMetadata(logger.info.bind(logger), message, ...args),
  warn: (message: string, ...args: unknown[]) =>
    logWithMetadata(logger.warn.bind(logger), message, ...args),
  error: (message: string, ...args: unknown[]) =>
    logWithMetadata(logger.error.bind(logger), message, ...args),
  fatal: (message: string, ...args: unknown[]) =>
    logWithMetadata(logger.fatal.bind(logger), message, ...args),
  child: (bindings: Record<string, unknown>) => logger.child(bindings),
  // biome-ignore lint/suspicious/noConsole: this is for debugging
  console: (...args: unknown[]) => console.log(...args),
  consoleWithHeader: (message: string, ...args: unknown[]) => {
    log.console(`<==========${message}==========>`)
    log.console(...args)
    log.console(`</==========${message}==========/>`)
  },
}

// Export the raw pino instance for advanced usage
export const rawLogger = logger

// Export default logger
export default log

/**
 * Usage Examples:
 *
 * Basic logging:
 * log.info('Server started on port 3000');
 * log.error('Failed to connect to database');
 * log.debug('User data:', { userId: 123, name: 'John' });
 *
 * Structured logging:
 * log.info('User logged in', { userId: 123, email: 'user@example.com' });
 * log.warn('Rate limit exceeded', { ip: '192.168.1.1', attempts: 5 });
 *
 * Child loggers (for adding context):
 * const userLogger = log.child({ userId: 123 });
 * userLogger.info('Profile updated'); // Will include userId in all logs
 *
 * Error logging with stack traces:
 * try {
 *   // some code
 * } catch (error) {
 *   log.error('Operation failed', { error: error.message, stack: error.stack });
 * }
 */
