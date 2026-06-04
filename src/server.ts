import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap(): Promise<void> {
  await connectDatabase();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(`
        BYOND KIDS — Backend          
══════════════════════════════════════
  Status   : Running                  
  Port     : ${env.PORT}              
  Env      : ${env.NODE_ENV.padEnd(22)}
  Database : Connected      
    `);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[${signal}] Menutup server...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('Server ditutup. Sampai jumpa! 👋');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // Unhandled errors — log tapi jangan crash tanpa cleanup
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
  });
}

void bootstrap();
