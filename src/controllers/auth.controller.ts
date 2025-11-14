import {Request, Response, NextFunction} from 'express';
import {AuthService} from '../services/auth.service.js';
import {EmailService} from '../services/email.service.js';
import { HTTP_STATUS } from '../config/constants.js';
import { createResponse } from '../utils/helpers.js';
import { CreateUserDto, LoginDto } from '../types/user.types.js';

const authService = new AuthService();
const emailService = new EmailService();

// Register a new user
export const register = async (
    req:Request, 
    res:Response, 
    next:NextFunction
):Promise<void>=>{
    try{
        const userData:CreateUserDto = req.body;
        const result = await authService.register(userData);

        // send welcome email
        emailService.sendWelcomeEmail(result.user.email, result.user.fullName).catch((err)=>{
            console.error('Failed to send welcome email:', err);
        });

        res.status(HTTP_STATUS.CREATED).json(
            createResponse(true,result, 'User registered successfully')
        );
    }catch(error){
        next(error);
    }
}

// Login user
export const login = async (
    req:Request, 
    res:Response, 
    next:NextFunction
):Promise<void>=>{
    try{
        const credentials:LoginDto = req.body;
        const result = await authService.login(credentials);

        res.status(HTTP_STATUS.OK).json(
            createResponse(true,result, 'User logged in successfully')
        );
    }catch(error){
        next(error);
    }
}

// Logout user
export const logout = async (
    req:Request, 
    res:Response, 
    next:NextFunction
):Promise<void>=>{
    try{

        await authService.logout(req.user!.id);
        res.status(HTTP_STATUS.OK).json(
            createResponse(true,null, 'User logged out successfully')
        );
    }catch(error){
        next(error);
    }
}

// refresh access tokens
export const refreshToken = async (
    req:Request, 
    res:Response, 
    next:NextFunction
):Promise<void>=>{
    try{
        const {refreshToken} = req.body;
        const tokens = await authService.refreshToken(refreshToken);

        res.status(HTTP_STATUS.OK).json(
            createResponse(true,tokens, 'Tokens refreshed successfully')
        );
    }catch(error){
        next(error);
    }
}