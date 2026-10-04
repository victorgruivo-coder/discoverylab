import { config } from './config.js';
import { disconnect } from './db.js';
import { buildServer } from './server.js';

const app = await buildServer();

await app.listen({ port: config.PORT, host: '0.0.0.0' });

app.log.info(`API listening on http://localhost:${config.PORT}`);

async function shutdown(signal: NodeJS.Signals): Promise<void> {
  app.log.info(`${signal} received, shutting down`);

  await app.close();
  await disconnect();

  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
