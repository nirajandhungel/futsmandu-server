import {Request, Response, NextFunction} from 'express';
import Joi from 'joi';
import {AppError} from './error.middleware.js';
import { ValidationError } from './error.middleware.js';
import {HTTP_STATUS} from '../config/constants.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';

//validate request body against Joi schema
// Validate request body against Joi schema
export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const { error, value } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true
        });

        if (error) {
            const errorDetails = error.details.map((detail) => ({
                field: detail.path.join('.'),
                message: detail.message,
                type: detail.type
            }));

            throw new ValidationError(
                ERROR_MESSAGES[ERROR_CODES.VALIDATION_FAILED],
                { validationErrors: errorDetails }
            );
        }
        req.body = value;
        next();
    };
};

// Define validation schemas with enhanced messages
export const validationSchemas = {
    register: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
        password: Joi.string()
            .min(8)
            .max(50)
            .required()
            .messages({
                'string.min': 'Password must be at least 8 characters long',
                'string.max': 'Password must be at most 50 characters long',
                'string.empty': 'Password is required',
                'any.required': 'Password is required'
            }),
        fullName: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Full name must be at least 2 characters long',
            'string.max': 'Full name must be at most 100 characters long',
            'string.empty': 'Full name is required',
            'any.required': 'Full name is required'
        }),
        phoneNumber: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .required()
            .messages({
                'string.pattern.base': 'Phone number must be exactly 10 digits',
                'string.empty': 'Phone number is required',
                'any.required': 'Phone number is required'
            }),
        role: Joi.string().valid('PLAYER', 'OWNER').default('PLAYER')
    }),

    login: Joi.object({
        email: Joi.string().email().required().messages({
            'string.email': 'Please provide a valid email address',
            'string.empty': 'Email is required',
            'any.required': 'Email is required'
        }),
        password: Joi.string().required().messages({
            'string.empty': 'Password is required',
            'any.required': 'Password is required'
        }),
    }),

    refreshToken: Joi.object({
        refreshToken: Joi.string().required().messages({
            'string.empty': 'Refresh token is required',
            'any.required': 'Refresh token is required'
        })
    }),

    // Futsal creation schema
    createFutsal: Joi.object({
        name: Joi.string().min(2).max(100).required(),
        address: Joi.string().min(5).max(200).required(),
        location: Joi.object({
            coordinates: Joi.array().items(Joi.number()).length(2),
            type: Joi.string().valid('Point').default('Point')
        }),
        amenities: Joi.array().items(Joi.string()),
        openingHours: Joi.object({
            open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
            close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        })
    }),

    // Booking creation schema
    createBooking: Joi.object({
        courtId: Joi.string().hex().length(24).required(),
        date: Joi.date().iso().min('now').required(),
        startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        playerCount: Joi.number().min(1).max(20).required()
    }),

    ownerActivate: Joi.object({
        panNumber: Joi.string().trim().max(20).required().messages({
            'string.empty': 'PAN number is required',
        }),
        address: Joi.string().trim().min(5).max(200).required().messages({
            'string.min': 'Address must be at least 5 characters',
            'string.empty': 'Address is required',
        }),
        additionalKyc: Joi.alternatives().try(
            Joi.object().pattern(Joi.string(), Joi.string().allow('').max(255)),
            Joi.string().custom((value, helpers) => {
                try {
                    const parsed = JSON.parse(value);
                    if (typeof parsed !== 'object' || Array.isArray(parsed) || parsed === null) {
                        return helpers.error('any.invalid');
                    }
                    return parsed;
                } catch (error) {
                    return helpers.error('any.invalid');
                }
            })
        ).optional()
    }),

    ownerDeactivate: Joi.object({
        reason: Joi.string().max(255).optional(),
    }),

    // Admin schemas
    approveOwnerRequest: Joi.object({
        status: Joi.string().valid('APPROVED', 'REJECTED').required().messages({
            'any.only': 'Status must be either APPROVED or REJECTED',
            'any.required': 'Status is required'
        }),
        remarks: Joi.string().max(500).optional()
    }),

    updateOwnerStatus: Joi.object({
        status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE', 'DRAFT').required().messages({
            'any.only': 'Status must be one of: PENDING, APPROVED, REJECTED, INACTIVE, DRAFT',
            'any.required': 'Status is required'
        }),
        remarks: Joi.string().max(500).optional()
    }),

    updateUserStatus: Joi.object({
        isActive: Joi.boolean().required().messages({
            'boolean.base': 'isActive must be a boolean',
            'any.required': 'isActive is required'
        }),
        reason: Joi.string().max(500).optional()
    }),
};
