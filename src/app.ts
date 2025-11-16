import express from 'express';
import type {Application} from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { sanitizeInput } from './middleware/sanitizer.middleware.js';
import {config} from './config/environment.js';
import {requestLogger} from './middleware/logging.middleware.js';
import {errorHandler, notFoundHandler} from './middleware/error.middleware.js'

import {generalLimiter} from './middleware/rateLimit.middleware.js';

// Import routes

import authRoutes from './routes/auth.routes.js';
import courtRoutes from './routes/court.routes.js';
import { databaseConnection } from './config/database.js';
// import futsalRoutes from './routes/futsal.routes.js';
// import bookingRoutes from './routes/booking.routes.js';
// import userRoutes from './routes/user.routes.js';

class App {
    public app:Application;
    constructor(){
        this.app=express();
        this.initializeMiddlewares();
        this.initializeRoutes();
        this.initializeErrorHandling();
    }

    private initializeMiddlewares():void{
        // security middleware

        this.app.use(helmet({
            crossOriginResourcePolicy:{policy:"cross-origin"}
        }));
        // data sanitization (NoSQL injection protection)
        this.app.use(sanitizeInput);

        //cors configuration
        this.app.use(
            cors({
                origin:config.app.clientUrl,
                methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                credentials: true,
                allowedHeaders:['Content-Type','Authorization','X-Requested-With'],
                preflightContinue:false,
                optionsSuccessStatus:204
            })
        );

        //handle preflight requests
        // this.app.options('*',cors());

        // body parsing middleware
        this.app.use(express.json({
            limit:'10mb',
            verify:(req:any,res,buf)=>{
                req.rawBody = buf; // store raw body for potential verification
            }
        }));
        this.app.use(express.urlencoded({
            extended:true, 
            limit:'10mb',
            parameterLimit:100 //maxm number of params
        }));

        //compression middleware
        this.app.use(compression());

        // //Request logging, after bofy parser
        this.app.use(requestLogger);

        // //rate limiting, after  request logging
        this.app.use(generalLimiter);
    }

    private initializeRoutes():void{
        // Health check endpoint -- no auth, no rae limiting

        this.app.get('/health',(req,res)=>{
            res.status(200).json({
                success:true,
                message:'Server is healthy',
                timestamp:new Date().toISOString(),
                environment:config.env,
                version:config.app.version,
                uptime:process.uptime(),
                memory:process.memoryUsage(),
                database:databaseConnection.getConnectionStatus()
            });

        });
        

        // API Routes 
        this.app.use(`${config.apiPrefix}/auth`,authRoutes);
        this.app.use(`${config.apiPrefix}/courts`,courtRoutes);
        // this.app.use(`${config.apiPrefix}/bookings`,bookingRoutes);
        // this.app.use(`${config.apiPrefix}/users`,userRoutes);


        //Root endpoint

        this.app.get('/',(req,res)=>{
            res.status(200).json({
                success:true,
                message:`Welcome to ${config.app.name} API`,
                version:config.app.version,
                documentation:`${config.app.clientUrl}/docs`,
                temestamp:new Date().toISOString(),

            });
        });

    }

    private initializeErrorHandling():void{
        //404 Not Found handler
        this.app.use(notFoundHandler);

        //Global error handler
        this.app.use(errorHandler);
    }


}

export default App;


