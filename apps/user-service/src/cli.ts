import { CommandFactory } from 'nest-commander';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  try {
    await CommandFactory.runWithoutClosing(UserServiceModule, {
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
