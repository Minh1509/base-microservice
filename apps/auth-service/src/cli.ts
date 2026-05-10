import { CommandFactory } from 'nest-commander';
import { AuthServiceModule } from './auth-service.module';

async function bootstrap() {
  try {
    await CommandFactory.runWithoutClosing(AuthServiceModule, {
      logger: ['error', 'warn', 'log'],
    });
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    process.exit(process.exitCode ?? 0);
  }
}

void bootstrap();
