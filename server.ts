import App from './src/app.js'
import {config} from './src/config/environment.js';
import {connectDatabase} from './src/config/database.js';
import logger from './src/utils/logger.js';

class Server{
    private app:App;
    private server:any;
    constructor(){
        this.app = new App();
        this.setupGracefulShutdown();
    }

    public async start():Promise<void>{
        try{
            //connect to database
            await connectDatabase();

            //start server
            this.server = this.app.app.listen(config.port,()=>{
                logger.info(`

                            =========================================

                                ${config.app.name} SERVER STARTED SUCCESSFULLY
                                Environment: ${config.env.padEnd(25)}
                                Port: ${config.port.toString().padEnd(32)}
                                API Prefix: ${config.apiPrefix.padEnd(24)}
                                Database: Connected ${config.env==='production'?'🔒':'🔧'.padEnd}
                                Health Check: http://localhost:${config.port}/health

                            =========================================
                                
                    `);
            });

        }catch(error){logger.error('Failed to start server: ', error);
            process.exit(1);
        }
    }


    private setupGracefulShutdown():void{
        const signals = ['SIGTERM','SIGNIT','SIGUSR2'];

        signals.forEach((signal)=>{
            process.on(signal, ()=>{
                logger.info(`\n${signal} received. Starting graceful shutdown...`);
                this.gracefulShutdown(signal);
            });
        });

        process.on('unCaughtExceptionn',(error)=>{
            logger.error('Uncaught Exception: ', error);
            this.gracefulShutdown('unCaughtExceptionn');

        })

        // handle unhandled promise rejections
        process.on('unhandledRejection',(reason,promise)=>{
            logger.error('Unhandled Rejection at: ',promise,'reason:',reason);
        this.gracefulShutdown('unhandledRejection');
        });
    }

    private async gracefulShutdown(signal:string):Promise<void>{
        try{
            logger.info('Closing HTTP server...');
            if(this.server){
                this.server.close(()=>{
                    logger.info('HTTP server closed.');
                });
            }
            
            // Close database connection
            logger.info('Closing database connection...');
            const mongoose = await import('mongoose');
            await mongoose.connection.close();
            logger.info('Database connection closed.');
            
            logger.info(`Graceful shutdown completed for ${signal}. Exiting process.`);
            process.exit(0);
        }catch(error){
            logger.error('Error during graceful shutdown: ', error);
            process.exit(1);
        }
    }
}

//start the server
const server = new Server();
server.start().catch((error)=>{
    logger.error('Error starting server: ', error);
    process.exit(1);
})

export default server;

