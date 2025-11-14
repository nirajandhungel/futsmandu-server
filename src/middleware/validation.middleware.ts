import {Request, Response, NextFunction} from 'express';
import Joi from 'joi';
import {AppError} from './error.middleware.js';
import {HTTP_STATUS} from '../config/constants.js';

//validate request body against Joi schema
export const validateRequest = (schema:Joi.ObjectSchema)=>{
    return (req:Request, res:Response, next:NextFunction):void=>{
        const {error} = schema.validate(req.body, {
            abortEarly:false, 
            stripUnknown:true
        });
        if(error){
            const errorMessages = error.details.map((detail)=>detail.message).join(', ');
            return next(new AppError(errorMessages, HTTP_STATUS.BAD_REQUEST));
        }
        next();
    };
};

//define validation schemas
export const validationSchemas = {
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email':'Please provide a valid email address',
            'any.required':'Email is required'
        }),
        password: Joi.string().min(8).max(50).required().messages({
            'string.min':'Password must be at least 8 characters long',
            'string.max':'Password must be at most 50 characters long',
            'any.required':'Password is required'
        }),
        fullName: Joi.string().min(2).required().messages({
            'string.min':'Full name must be at least 2 characters long',
            'any.required':'Full name is required'

        }),
        phoneNumber: Joi.string().min(10).required().messages({
            'string.min':'Phone number must be 10 characters long',
            'any.required':'Phone number is required'
        }),
        role: Joi.string().valid('PLAYER', 'OWNER').required(),
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email':'Please provide a valid email address',
            'any.required':'Email is required'
        }),
        password: Joi.string().min(6).max(128).required().messages({
            'string.min':'Password must be at least 8 characters long',
            'string.max':'Password must be at most 50 characters long',
            'any.required':'Password is required'
        }),
    }),

    // add more schemas for create futsal/create booking as needed
};