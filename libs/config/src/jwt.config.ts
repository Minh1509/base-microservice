import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET ?? 'dev-only-secret',
  expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
}));

export type JwtConfig = ReturnType<typeof jwtConfig>;
