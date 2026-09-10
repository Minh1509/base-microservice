import { NodeEnv } from '../enums';

export const APP_DEFAULTS = {
  NODE_ENV: NodeEnv.Local,
  APP_NAME: 'Multi-Domain Backend Platform',
  APP_PORT: 3000,
  ACCESS_TOKEN_EXPIRES_IN: '1d',
  REFRESH_TOKEN_EXPIRES_IN: '30d',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATE_FORMAT_V2: 'DD MMM YYYY',
  DATE_TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  TIME_FORMAT: 'HH:mm:ss',
  HOUR_FORMAT: 'h:mm A',
  PAGINATION: {
    PAGE_DEFAULT: 1,
    LIMIT_DEFAULT: 10,
  },
  MAX_FILE_SIZE: 100 * 1024 * 1024,
} as const;
