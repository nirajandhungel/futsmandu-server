import App from './src/app.js'
import {config} from './src/config/environment.js';
import { connectDatabase, disconnectDatabase } from './src/config/database.js';
import logger from './src/utils/logger.js';

interface ServerConfig{
    port:number;
    env:string;
    apiPrefix:string;
    appName:string;
}

class Server{
    private app:App;
    private server:any;
    private isShuttingDown:boolean = false;

    constructor(){
        this.app = new App();
        this.setupGracefulShutdown();
    }

    public async start():Promise<void>{
        try{
            logger.info('Starting server initialization...',{
                environment:config.env,
                port:config.port,
            });
            //connect to database
            await connectDatabase();

            //start server
            this.server = this.app.app.listen(config.port,()=>{
                this.printServerBanner();
                logger.info('Server started successfully', {
                    environment:config.env,
                    port:config.port,
                    pid:process.pid,
                });
            });
            this.setupServerEventHandlers();

        }catch(error){logger.error('Failed to start server: ', error);
            process.exit(1);
        }
    }

    // Print server banner

     private printServerBanner(): void {
    const banner = `
╔════════════════════════════════════════════════════════════════╗
║                    ${config.app.name.toUpperCase()} SERVER     ║
╠════════════════════════════════════════════════════════════════╣
║  Environment:  ${config.env.padEnd(30)}                        ║
║  Port:         ${config.port.toString().padEnd(30)}            ║
║  API Prefix:   ${config.apiPrefix.padEnd(30)}                  ║
║  Database:     ${'Connected 🟢'.padEnd(30)}                    ║
║  Health Check: http://localhost:${config.port}/health${''.padEnd(9)} ║
║  Process ID:   ${process.pid.toString().padEnd(30)}            ║
╚════════════════════════════════════════════════════════════════╝
    `.trim();

    console.log(banner);
  }

  // Setup server event handlers

   private setupServerEventHandlers(): void {
    this.server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${config.port} is already in use`);
        process.exit(1);
      } else {
        logger.error('Server error occurred', { error });
      }
    });

    this.server.on('listening', () => {
      logger.debug('Server is now listening for connections');
    });
  }

  // Graceful shutdown setup
    private setupGracefulShutdown():void{
        const signals : NodeJS.Signals[]=['SIGTERM','SIGINT','SIGUSR2'];

        signals.forEach((signal)=>{
            process.on(signal, ()=>{
                logger.info(`\nReceived ${signal}, starting graceful shutdown...`);
                this.gracefulShutdown(signal);
            });
        });

        process.on('unCaughtExceptionn',(error:Error)=>{
            logger.error('Uncaught Exception Occurred: ', {
                error: error.message,
                stack: error.stack,
            });
            this.gracefulShutdown('uncaughtExceptionn');

        });

        // handle unhandled promise rejections
        process.on('unhandledRejection',(reason:any,promise:Promise<any>)=>{
            logger.error('Unhandled Promise Rejection at: ',{
                reason: reason?.message || reason,
                promise,
            });
        this.gracefulShutdown('unhandledRejection');
        });
    }

    private async gracefulShutdown(signal:string):Promise<void>{

            if(this.isShuttingDown){
                logger.warn('Graceful shutdown already in progress...');
                return;
            }

            this.isShuttingDown = true;
            const shutdownTimeout = setTimeout(()=>{
                logger.error('Graceful shutdown timed out. Forcing exit.');
                process.exit(1);
            },30000); //30 seconds
            shutdownTimeout.unref();

        try{
            logger.info('Starting graceful shutdown sequence ...');

            // Close HTTP server
            if(this.server){
                await new Promise<void>((resolve)=>{
                    this.server.close((err:any)=>{
                        if(err){
                            logger.warn('Error closing HTTP server: ', {error: err});
                        }else{
                            logger.info('HTTP server closed successfully.');
                        }
                        resolve();
                    });
                });
            }
             // Close database connections
            await disconnectDatabase();


            // Close database connection
            logger.info(`Graceful shutdown completed for ${signal}. Exiting process.`);
            clearTimeout(shutdownTimeout);
            process.exit(0);
        }catch(error){
            logger.error('Error during graceful shutdown: ', {error});
            clearTimeout(shutdownTimeout);
            process.exit(1);
        }
    }

    public async stop():Promise<void>{
        await this.gracefulShutdown('manualStop');
    }
}

// create and start  server instance
const server = new Server();
server.start().catch((error:Error)=>{
    logger.error('Fatal error during server startup:  ', {error});
    process.exit(1);
});

export default server;

