export const AUTH_PATTERNS = {
  PING: 'auth.ping',
  LOGIN: 'auth.login',
} as const;

export type AuthPattern = (typeof AUTH_PATTERNS)[keyof typeof AUTH_PATTERNS];
export const ALL_AUTH_PATTERNS = Object.values(AUTH_PATTERNS);
