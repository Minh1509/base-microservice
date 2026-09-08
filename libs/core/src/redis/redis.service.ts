import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './redis.constant';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async setValue<T = any>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async getValue<T = any>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    if (!data) return null;

    try {
      return JSON.parse(data) as T;
    } catch {
      return data as unknown as T;
    }
  }

  async deleteKey(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  public getResetPasswordKey(userId: string): string {
    return `user:${userId}:reset_password`;
  }

  public getVerifyEmailKey(userId: string): string {
    return `user:${userId}:verify`;
  }

  public getUserTokenKey(userId: string, jti: string): string {
    return `user:${userId}:token:${jti}`;
  }

  public getUserTokenPattern(userId: string): string {
    return `user:${userId}:token:*`;
  }

  public getVerifyOTPKey(userId: string): string {
    return `user:${userId}:verifyOTP`;
  }
}
