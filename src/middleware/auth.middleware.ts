import {Request , Response , NextFunction} from 'express';
import {AuthService} from '../services/auth.service.js';
import { UserRole } from '../types/common.types.js';
import { ERROR_MESSAGES, HTTP_STATUS } from '../config/constants.js';
import { AppError } from './error.middleware.js';

const authService = new AuthService();

//authenticate JWT token middleware
export const authenticate = async (req:Request , res:Response , next:NextFunction):Promise<void>=>{
    try{
        // get token from header 
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            throw new AppError(ERROR_MESSAGES.TOKEN_REQUIRED,HTTP_STATUS.UNAUTHORIZED);
        }
        const token = authHeader.split(' ')[1];
        
        // verify token
        const decoded = await authService.verifyToken(token);

        // attach user info to request object

        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role as UserRole,
        };
        next();
    }catch(error){
        next(new AppError(ERROR_MESSAGES.UNAUTHORIZED,HTTP_STATUS.UNAUTHORIZED));
    }
};

//authorize based on roles
export const authorize = (...roles:UserRole[])=>{
    return (req:Request , res:Response , next:NextFunction):void=>{
        if(!req.user){
            return next(new AppError(ERROR_MESSAGES.FORBIDDEN,HTTP_STATUS.FORBIDDEN));
        }
        if(!roles.includes(req.user.role)){
            return next(new AppError(ERROR_MESSAGES.FORBIDDEN,HTTP_STATUS.FORBIDDEN));
        }
        next();
    };
}