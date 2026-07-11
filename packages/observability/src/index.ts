export type LogContext = Record<string, string | number | boolean | null>;

export function createLogger(scope: string) {
  return {
    info(message: string, context: LogContext = {}) {
      console.info(JSON.stringify({ level: "info", scope, message, ...context }));
    },
    error(message: string, context: LogContext = {}) {
      console.error(JSON.stringify({ level: "error", scope, message, ...context }));
    }
  };
}
