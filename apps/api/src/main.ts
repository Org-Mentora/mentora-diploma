import { AppConfig } from '#infrastructure/config/AppConfig';
import { MongoConnection } from '#infrastructure/database/MongoConnection';
import { Logger } from '#infrastructure/logger/Logger';
import { Application } from './app/Application';

async function bootstrap(): Promise<void> {
  const { env } = AppConfig.getInstance();
  const logger = Logger.getInstance();
  const database = MongoConnection.getInstance();

  await database.connect(env.MONGO_URI);
  logger.info('Connected to MongoDB');

  const application = new Application();
  await application.bootstrapModules();
  const server = await application.createServer().listen(env.PORT);
  logger.info(`API listening on http://localhost:${env.PORT} (docs at /api/docs)`);

  const shutdown = async (signal: string): Promise<void> => {
    logger.info(`Received ${signal}, shutting down`);
    server.close();
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
