type LogContext = Record<string, unknown>;

function sanitize(context?: LogContext): LogContext | undefined {
  if (!context) return undefined;

  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (key.toLowerCase().includes("token")) {
        return [key, "[redacted]"];
      }

      return [key, value];
    }),
  );
}

export const logger = {
  info(message: string, context?: LogContext) {
    console.info(message, sanitize(context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(message, sanitize(context));
  },
  error(message: string, context?: LogContext) {
    console.error(message, sanitize(context));
  },
};
