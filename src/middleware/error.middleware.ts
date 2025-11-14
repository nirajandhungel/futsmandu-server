import type {Request, Response, NextFunction} from 'express';
import {HTTP_STATUS,ERROR_MESSAGES} from '../config/constants.js';
import logger from '../utils/logger.js';
import {createResponse} from '../utils/helpers.js'
import {config} from '../config/environment.js';
import { time } from 'console';
import path from 'path';

export class AppError extends Error{
    public statusCode: number;
    public isOperational: boolean;
    public details?: any;


    constructor(message: string, statusCode: number, details?: any){
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        this.details = details;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

// validation error handler
export class ValidationError extends AppError{
    constructor(message: string, details?: any){
        super(message, HTTP_STATUS.BAD_REQUEST, details);
    }
}

//Authentication error
export class AuthenticationError extends AppError{
    constructor(message: string = ERROR_MESSAGES.INVALID_TOKEN, details?: any){
        super(message, HTTP_STATUS.UNAUTHORIZED);
    }
}

//authorization error
export class AuthorizationError extends AppError{
    constructor(message: string = ERROR_MESSAGES.FORBIDDEN){
        super(message, HTTP_STATUS.FORBIDDEN);
    }
}

// Not Found error
export class NotFoundError extends AppError{
    constructor(message: string = ERROR_MESSAGES.NOT_FOUND){
        super(message, HTTP_STATUS.NOT_FOUND);
    }
}

// 404 Not Found Middleware --catch all unhandled routes
export const notFoundHandler=(
    req: Request,
    res: Response,
    next: NextFunction
):void=>{
    const error = new NotFoundError(`Route ${req.method} ${req.originalUrl} not found on this server`);
    next(error);
};

// Global Error Handling Middleware

export const errorHandler=(
    err:any,
    req: Request,
    res: Response,
    next: NextFunction
):void=>{

    // TEMPORARY: Show actual error in development
    if (process.env.NODE_ENV !== 'production') {
        console.error('🔥 ACTUAL ERROR:', err);
        console.error('🔥 ERROR STACK:', err.stack);
    }
    
    let error = err;

    //default error structure
    if(!err.statusCode || !err.message){
        error.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
        error.message = ERROR_MESSAGES.INTERNAL_ERROR;
    }

    //Log the error with appropriate level
    if(err.statusCode && err.statusCod >= 500){
        // server errors - log as error
        logger.error('Server Error:',{
            message:err.message,
            stack:err.stack,
            url:req.originalUrl,
            method:req.method,
            ip:req.ip,
            userAgent:req.get('User-Agent'),
            userId:req.user?.id || 'Guest',
        });
    }else{
        // client errors - log as warn
        logger.warn('Client Error:',{
            message:err.message,
            statusCode:err.statusCode,
            url:req.originalUrl,
            method:req.method,
            ip:req.ip,
            userId:(req as any).user?.id,
        });
    }

    // handle specific error types
    error = handleSpecificErrors(error);

    //determine if we should include error details
    const includeDetails = config.env !== 'production';

    //prepare error response
    const errorResponse:any = { 
        success:false,
        message:error.message,
        timestamp:new Date().toISOString(),
        path:req.originalUrl,
        method:req.method,
    }

    //add error code if available
    if(error.code){
        errorResponse.code = error.code;
    }

    // add details in development or for specific error types
    if(includeDetails && error.details){
        errorResponse.details = error.details;
    }

    // add stack trace only in development
    if(includeDetails && error.stack ){
        errorResponse.stack = error.stack;
    }

    //send error response
    res.status(error.statusCode).json(errorResponse);
}

// handle specific error types and normalize them
function handleSpecificErrors(err: any): AppError {
    let error = err;

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map((e: any) => ({
            field: e.path,
            message: e.message,
            value: e.value
        }));
        
        error = new ValidationError(
            'Validation failed', 
            { validationErrors: errors }
        );
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error = new ValidationError(
            `Duplicate field value: ${field} = ${value}`,
            { duplicateField: field, duplicateValue: value }
        );
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        error = new ValidationError(
            `Invalid ${err.path}: ${err.value}`,
            { path: err.path, value: err.value }
        );
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = new AuthenticationError('Invalid authentication token');
    }

    if (err.name === 'TokenExpiredError') {
        error = new AuthenticationError('Authentication token expired');
    }

    // Syntax error (e.g., invalid JSON in request body)
    if (err instanceof SyntaxError && 'status' in err && err.status === 400 && 'body' in err) {
        error = new ValidationError('Invalid JSON in request body');
    }

    return error;
}

/**
 * Async error handler wrapper - for handling async route handlers
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

export default errorHandler;
