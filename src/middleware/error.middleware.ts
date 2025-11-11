import type {Request, Response, NextFunction} from 'express';
import {HTTP_STATUS,ERROR_MESSAGES} from '../config/constants.js';
import logger from '../utils/logger.js';
import {createResponse} from '../utils/helpers.js'

export class AppError extends Error{
    statusCode: number;
    isOperational: boolean;

    constructor(message: string, statusCode: number){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// Global Error Handling Middleware

export const errorHandler=(
    err:any,
    req: Request,
    res: Response,
    next: NextFunction
):void=>{
    err.statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
    err.message = err.message || ERROR_MESSAGES.INTERNAL_ERROR;
    // log error 
    logger.error('Error:',{
        message:err.message,
        stack:err.stack,
        url:req.originalUrl,
        method:req.method,
    });

     // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e: any) => e.message);
    err.message = `Validation Error: ${errors.join(', ')}`;
    err.statusCode = HTTP_STATUS.BAD_REQUEST;
  }
}
