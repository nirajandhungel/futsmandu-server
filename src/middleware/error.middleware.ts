import {Request, Response, NextFunction} from 'express';
import {HTTP_STATUS,ERROR_MESSAGES} from '../config/constants.ts';
import logger from '../utils/logger.ts';
import {createResponse} from '../utils/helpers.ts'

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
    err.message = err.message || ERROR_MESSAGES.INTERNAL_SERVER_ERROR;
}