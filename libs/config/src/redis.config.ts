import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  url: process.env.REDIS_URL,
}));
