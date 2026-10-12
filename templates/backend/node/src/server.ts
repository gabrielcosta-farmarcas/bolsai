import { app } from './app.js';
import { analysesRepository } from './modules/analyses/analyses.repository.js';
import { env } from './config/env.js';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';

// Análises que ficaram em processamento antes de a API reiniciar viram falha.
void analysesRepository
  .failStuck('A análise foi interrompida porque a API foi reiniciada. Analise de novo.')
  .then((count) => {
    if (count > 0) logger.warn({ count }, 'stuck analyses marked as failed');
  })
  .catch((error: unknown) => {
    logger.error({ err: error }, 'could not recover stuck analyses');
  });

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'server started');
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'shutting down');
  server.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
