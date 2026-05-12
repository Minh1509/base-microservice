export const USER_PATTERNS = {
  PING: 'user.ping',
} as const;

export type UserPattern = (typeof USER_PATTERNS)[keyof typeof USER_PATTERNS];
export const ALL_USER_PATTERNS = Object.values(USER_PATTERNS);
