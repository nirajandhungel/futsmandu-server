import winston from 'winston';
import {config} from '../config/environment.js';
import { debug } from 'console';

const logLevels = {
    error:0,
    warn:1,
    info:2,
    http:3,
    debug:4,
};

const logFormat = winston.format.combine(
    winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
    winston.format.errors({stack:true}),
    winston.format((info)=>{
        // add correlation ID, user ID, etc in production
        if(config.env ==='production'){
            info.environment = config.env;
            info.service = config.app.name;
        }
        return info;
    })(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({format:'YYYY-MM-DD HH:mm:ss'}),
    winston.format.colorize(),
    winston.format.printf(({timestamp,level,message, ...meta})=>{
        let log = `${timestamp} [${level}]: ${message} `;
        if(Object.keys(meta).length){
            log += `| ${JSON.stringify(meta)}`;
        }
        return log;
    })
);

const logger = winston.createLogger({
    level:config.env ==='production'?'info':'debug',
    levels:logLevels,
    format:logFormat,
    defaultMeta:{service:config.app.name},
    transports:[
        new winston.transports.File({
            filename:'logs/error.log',
            level:'error',
            maxsize:5242880, //5MB
            maxFiles:5,
        }),
        new winston.transports.File({
            filename:'logs/combined.log',
            maxsize:5242880, //5MB
            maxFiles:5,
        }),
    ],
    exceptionHandlers:[
        new winston.transports.File({filename:'logs/exceptions.log'}),
    ],
    rejectionHandlers:[
        new winston.transports.File({filename:'logs/rejections.log'}),  
    ],
});

//add console transport for non-production
if(config.env !=='production'){
    logger.add(
        new winston.transports.Console({
            format:consoleFormat,
        })
    );
}else{

    // In production, we might want console outpot too, but formatted as JSON
    logger.add(
        new winston.transports.Console({
            format:winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
        })
    );
}

//create a stream object for morgan integration
export const stream = {
    write:(message:string)=>{
        logger.info(message.trim());
    },
};

export default logger;

