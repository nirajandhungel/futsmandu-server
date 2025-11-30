import type { Server as HTTPServer } from 'http';
import App from './src/app.js';
import { config } from './src/config/environment.js';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import logger from './src/utils/logger.js';
import { createDefaultAdmin } from './src/seeders/createDefaultAdmin.js';

class Server {
  private readonly appInstance: App;
  private server?: HTTPServer;
  private isShuttingDown = false;

  constructor(private readonly port: number = config.port) {
    this.appInstance = new App();
    this.registerProcessHandlers();
  }

  public async start(): Promise<void> {
    try {
      logger.info('Starting server initialization...', {
        environment: config.env,
        port: this.port,
      });

      await connectDatabase();
      // Seed admin
      await createDefaultAdmin();

      this.server = this.appInstance.app.listen(this.port, () => {
        this.printServerBanner();
        logger.info('Server started successfully', {
          environment: config.env,
          port: this.port,
          pid: process.pid,
        });
      });

      this.setupServerEventHandlers();
    } catch (error) {
      logger.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  private printServerBanner(): void {
    const banner = `
╔════════════════════════════════════════════════════════════════╗
║                    ${config.app.name.toUpperCase()} SERVER     ║
╠════════════════════════════════════════════════════════════════╣
║  Environment:  ${config.env.padEnd(30)}                        ║
║  Port:         ${this.port.toString().padEnd(30)}              ║
║  API Prefix:   ${config.apiPrefix.padEnd(30)}                  ║
║  Database:     ${'Connected 🟢'.padEnd(30)}                    ║
║  Health Check: http://localhost:${this.port}/health${''.padEnd(9)} ║
║  Process ID:   ${process.pid.toString().padEnd(30)}            ║
╚════════════════════════════════════════════════════════════════╝
    `.trim();

    console.log(banner);
  }

  private setupServerEventHandlers(): void {
    if (!this.server) {
      return;
    }

    this.server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${this.port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error occurred', { error });
      }
    });

    this.server.on('listening', () => {
      logger.debug('Server is now listening for connections');
    });
  }

  private registerProcessHandlers(): void {
    const signals: NodeJS.Signals[] = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

    signals.forEach((signal) => {
      process.on(signal, () => {
        logger.info(`Received ${signal}, starting graceful shutdown...`);
        void this.gracefulShutdown(signal);
      });
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught exception occurred', {
        error: error.message,
        stack: error.stack,
      });
      void this.gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Promise Rejection detected', {
        reason: reason?.message || reason,
        promise,
      });
      void this.gracefulShutdown('unhandledRejection');
    });
  }

  private async gracefulShutdown(signal: string): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Graceful shutdown already in progress...');
      return;
    }

    this.isShuttingDown = true;
    const shutdownTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 30000);
    shutdownTimeout.unref();

    try {
      logger.info('Starting graceful shutdown sequence...', { signal });

      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close((err?: Error) => {
            if (err) {
              logger.warn('Error closing HTTP server', { error: err });
            } else {
              logger.info('HTTP server closed successfully.');
            }
            resolve();
          });
        });
      }

      await disconnectDatabase();

      logger.info(`Graceful shutdown completed for ${signal}. Exiting process.`);
      clearTimeout(shutdownTimeout);
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error });
      clearTimeout(shutdownTimeout);
      process.exit(1);
    }
  }

  public async stop(): Promise<void> {
    await this.gracefulShutdown('manualStop');
  }
}

const server = new Server();
server.start().catch((error: Error) => {
  logger.error('Fatal error during server startup', { error });
  process.exit(1);
});

export default server;

