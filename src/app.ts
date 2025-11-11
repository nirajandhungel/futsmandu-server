import express from 'express';
import type {Application} from 'express';
import helmet from 'helmet';
import cors from 'cors';

// import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import {config} from './config/environment.js';
// import {requestLogger} from './middleware/logging.middleware.js';
// import {errorHandler, notFoundHandler} from './middleware/error.middleware.js'

// import {generalLimiter} from './middleware/rateLimit.middleware.js';

// Import routes

// import authRoutes from './routes/auth.routes.js';
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

        this.app.use(helmet());
        this.app.use(mongoSanitize());

        //cors configuration
        this.app.use(
            cors({
                origin:config.app.clientUrl,
                methods:['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
                credentials: true,
                allowedHeaders:['Content-Type','Authorization','X-Requested-With'],
            })
        );

        // body parsing middleware
        this.app.use(express.json({limit:'10mb'}));
        this.app.use(express.urlencoded({extended:true, limit:'10mb'}));

        //compression middleware
        // this.app.use(compression());

        // //Request logging
        // this.app.use(requestLogger);

        // //rate limiting
        // this.app.use(generalLimiter);
    }

    private initializeRoutes():void{
        // Health check endpoint

        this.app.get('/health',(req,res)=>{
            res.status(200).json({
                success:true,
                message:'Server is healthy',
                timestamp:new Date().toISOString(),
                environment:config.env,
                version:'1.0.0',
            });

        });
        

        // API Routes 
        // this.app.use(`${config.apiPrefix}/auth`,authRoutes);
        // this.app.use(`${config.apiPrefix}/futsals`,futsalRoutes);
        // this.app.use(`${config.apiPrefix}/bookings`,bookingRoutes);
        // this.app.use(`${config.apiPrefix}/users`,userRoutes);


        //Root endpoint

        this.app.get('/',(req,res)=>{
            res.status(200).json({
                success:true,
                message:`Welcome to ${config.app.name} API`,
                version:'1.0.0',
                documentation:`${config.app.clientUrl}/docs`,
                temestamp:new Date().toISOString(),
            });
        });

    }

    private initializeErrorHandling():void{
        //404 Not Found handler
        // this.app.use(notFoundHandler);

        //Global error handler
        // this.app.use(errorHandler);
    }


}

export default App;


