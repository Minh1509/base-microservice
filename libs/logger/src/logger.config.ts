import * as winston from 'winston';

export interface BuildWinstonOptions {
  serviceName: string;
}

// ANSI color helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // foreground
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  // bright
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
};

const LEVEL_STYLES: Record<string, { color: string; label: string }> = {
  error: { color: c.brightRed, label: 'ERROR' },
  warn: { color: c.brightYellow, label: ' WARN' },
  info: { color: c.brightGreen, label: ' INFO' },
  http: { color: c.brightCyan, label: ' HTTP' },
  verbose: { color: c.brightMagenta, label: ' VERB' },
  debug: { color: c.brightBlue, label: 'DEBUG' },
  silly: { color: c.gray, label: 'SILLY' },
};

function colorize(text: string, color: string) {
  return `${color}${text}${c.reset}`;
}

export function buildWinstonOptions({
  serviceName,
}: BuildWinstonOptions): winston.LoggerOptions {
  const isProd = process.env.NODE_ENV === 'production';
  const level = process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug');

  const devFormat = winston.format.combine(
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level: lvl, message, context, stack }) => {
      const style = LEVEL_STYLES[lvl] ?? {
        color: c.white,
        label: lvl.toUpperCase().padStart(5),
      };
      const levelTag = colorize(`[${style.label}]`, `${c.bold}${style.color}`);
      const appTag = colorize(`[${serviceName}]`, `${c.bold}${c.yellow}`);
      const ctxTag = colorize(`[${context ?? serviceName}]`, `${c.cyan}`);
      const ts = colorize(timestamp as string, c.gray);
      const msg = colorize(message as string, style.color);
      const line = `${levelTag} ${ts} ${appTag} ${ctxTag} ${msg}`;
      return stack ? `${line}\n${colorize(stack as string, c.gray)}` : line;
    }),
  );

  const prodFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );

  return {
    level,
    defaultMeta: { service: serviceName },
    format: isProd ? prodFormat : devFormat,
    transports: [new winston.transports.Console()],
  };
}
