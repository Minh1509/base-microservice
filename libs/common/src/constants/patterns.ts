/**
 * Central registry of Kafka message patterns shared between gateway and
 * microservices. Patterns là "contract" cross-service, không phải cơ chế
 * vận chuyển — để ở `constants` hợp lý hơn `rpc`.
 *
 * Quy ước: `<service>.<action>` — 'auth.login', 'user.find-by-id'.
 * Thêm pattern mới: append vào AUTH_PATTERNS/USER_PATTERNS, gateway tự
 * pick qua ALL_*_PATTERNS để subscribeToResponseOf.
 */
export const AUTH_PATTERNS = {
  PING: 'auth.ping',
} as const;

export const USER_PATTERNS = {
  PING: 'user.ping',
} as const;

export type AuthPattern = (typeof AUTH_PATTERNS)[keyof typeof AUTH_PATTERNS];
export type UserPattern = (typeof USER_PATTERNS)[keyof typeof USER_PATTERNS];

export const ALL_AUTH_PATTERNS = Object.values(AUTH_PATTERNS);
export const ALL_USER_PATTERNS = Object.values(USER_PATTERNS);
