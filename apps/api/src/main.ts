import type { Server } from 'node:http';
import { AppConfig } from '#infrastructure/config/AppConfig';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { Logger } from '#infrastructure/logger/Logger';
import { IntervalJobScheduler } from '#infrastructure/scheduling/IntervalJobScheduler';
import { MongoJobLock } from '#infrastructure/scheduling/MongoJobLock';
import { Application } from './app/Application';

const KEEP_ALIVE_MS = 65_000;

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
    server.closeIdleConnections();
  });
}

// Composition Root
async function bootstrap(): Promise<void> {
  const { env } = AppConfig.getInstance();
  const logger = Logger.getInstance();
  const database = MongoConnection.getInstance();

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled promise rejection', { err: reason });
  });

  await database.connect(env.MONGO_URI, env.MONGO_MAX_POOL_SIZE);
  logger.info('Connected to MongoDB');

  const application = new Application();
  await application.bootstrapModules();
  const migrated = await application.runMigrations();
  if (migrated.length > 0) {
    logger.info('Data migrations applied', { migrations: migrated });
  }
  const server = await application.createServer().listen(env.PORT);
  server.keepAliveTimeout = KEEP_ALIVE_MS;
  server.headersTimeout = KEEP_ALIVE_MS + 1_000;
  logger.info(`API listening on http://localhost:${env.PORT} (docs at /api/docs)`);

  const scheduler = new IntervalJobScheduler(
    logger.child({ component: 'scheduler' }),
    new MongoJobLock(database),
  );
  if (env.SCHEDULER_ENABLED) {
    scheduler.start(application.scheduledJobs());
  }

  let stopping = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (stopping) {
      return;
    }
    stopping = true;
    logger.info(`Received ${signal}, shutting down`);
    const forced = setTimeout(() => {
      logger.error('Shutdown timed out, exiting');
      process.exit(1);
    }, env.SHUTDOWN_TIMEOUT_MS);
    forced.unref();
    await closeServer(server);
    await scheduler.stop();
    await database.disconnect();
    process.exit(0);
  };
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error: unknown) => {
  console.error('Failed to start the API', error);
  process.exit(1);
});
