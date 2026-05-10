import { DynamicModule } from '@nestjs/common';
import { ConfigFactory, ConfigModule as NestConfigModule } from '@nestjs/config';
import { join } from 'path';

export interface BuildConfigModuleOptions {
  load: ConfigFactory[];
  envFilePath?: string[];
}

export function buildConfigModule(
  options: BuildConfigModuleOptions,
): Promise<DynamicModule> {
  const cwd = process.cwd();
  const envFilePath = (options.envFilePath ?? []).map((p) => join(cwd, p));

  return NestConfigModule.forRoot({
    isGlobal: true,
    load: options.load,
    envFilePath,
    cache: true,
  });
}
