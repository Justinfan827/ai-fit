import pino from "pino"

// Logger configuration based on environment
const loggerConfig = {
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV === "development"
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

// Export logger with typed interface
export const log = {
  trace: (message: string, ...args: unknown[]) =>
    logger.trace(message, ...args),
  debug: (message: string, ...args: unknown[]) =>
    logger.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => logger.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => logger.warn(message, ...args),
  error: (message: string, ...args: unknown[]) =>
    logger.error(message, ...args),
  fatal: (message: string, ...args: unknown[]) =>
    logger.fatal(message, ...args),
  child: (bindings: Record<string, unknown>) => logger.child(bindings),
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
