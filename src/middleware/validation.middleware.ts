import {Request, Response, NextFunction} from 'express';
import Joi from 'joi';
import {AppError} from './error.middleware.js';
import { ValidationError } from './error.middleware.js';
import {HTTP_STATUS} from '../config/constants.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../config/constants.js';

//validate request body against Joi schema
// Validate request body against Joi schema
// Handles FormData arrays by converting them before validation
export const validateRequest = (schema: Joi.ObjectSchema) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // Normalize FormData arrays before validation
        // FormData sends arrays as multiple fields with same name or as comma-separated strings
        const normalizedBody = normalizeFormDataArrays(req.body);
        
        const { error, value } = schema.validate(normalizedBody, {
            abortEarly: false,
            stripUnknown: true,
            allowUnknown: false
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

/**
 * Normalize FormData arrays - ensures arrays are properly formatted
 * Handles cases where FormData sends arrays as strings or multiple fields
 */
function normalizeFormDataArrays(body: any): any {
    if (!body || typeof body !== 'object') {
        return body;
    }

    const normalized: any = { ...body };

    // Handle amenities array (can be string, array, or comma-separated)
    if (normalized.amenities !== undefined) {
        if (typeof normalized.amenities === 'string') {
            normalized.amenities = normalized.amenities
                .split(',')
                .map((a: string) => a.trim())
                .filter((a: string) => a.length > 0);
        } else if (!Array.isArray(normalized.amenities)) {
            normalized.amenities = [normalized.amenities];
        }
    }

    // Handle courts array and their nested amenities
    if (normalized.courts && Array.isArray(normalized.courts)) {
        normalized.courts = normalized.courts.map((court: any) => {
            const normalizedCourt = { ...court };
            
            // Normalize court amenities
            if (normalizedCourt.amenities !== undefined) {
                if (typeof normalizedCourt.amenities === 'string') {
                    normalizedCourt.amenities = normalizedCourt.amenities
                        .split(',')
                        .map((a: string) => a.trim())
                        .filter((a: string) => a.length > 0);
                } else if (!Array.isArray(normalizedCourt.amenities)) {
                    normalizedCourt.amenities = normalizedCourt.amenities ? [normalizedCourt.amenities] : [];
                }
            } else {
                normalizedCourt.amenities = [];
            }
            
            return normalizedCourt;
        });
    }

    return normalized;
}

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

    // Futsal court creation schema (for owner) - Simplified with smart defaults
    createFutsalCourt: Joi.object({
        name: Joi.string().min(2).max(100).required().messages({
            'string.min': 'Name must be at least 2 characters',
            'string.max': 'Name must be at most 100 characters',
            'string.empty': 'Name is required',
            'any.required': 'Name is required'
        }),
        description: Joi.string().min(10).max(1000).required().messages({
            'string.min': 'Description must be at least 10 characters',
            'string.max': 'Description must be at most 1000 characters',
            'string.empty': 'Description is required',
            'any.required': 'Description is required'
        }),
        location: Joi.object({
            address: Joi.string().min(5).max(200).required(),
            city: Joi.string().min(2).max(100).required(),
            state: Joi.string().max(100).optional(),
            coordinates: Joi.object({
                latitude: Joi.number().min(-90).max(90).optional(),
                longitude: Joi.number().min(-180).max(180).optional()
            }).optional()
        }).required(),
        contact: Joi.object({
            phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
                'string.pattern.base': 'Phone number must be exactly 10 digits'
            }),
            email: Joi.string().email().optional(),
            website: Joi.string().uri().optional()
        }).required(),
        amenities: Joi.array().items(Joi.string()).optional(),
        openingHours: Joi.object({
            monday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required(),
            tuesday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required(),
            wednesday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required(),
            thursday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required(),
            friday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required(),
            saturday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required(),
            sunday: Joi.object({
                open: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
                close: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
            }).required()
        }).required(),
        // Courts array - simplified with only essential fields required
        courts: Joi.array().items(
            Joi.object({
                courtNumber: Joi.string().required().messages({
                    'string.empty': 'Court number is required',
                    'any.required': 'Court number is required'
                }),
                name: Joi.string().min(2).max(100).required().messages({
                    'string.min': 'Court name must be at least 2 characters',
                    'string.max': 'Court name must be at most 100 characters',
                    'string.empty': 'Court name is required',
                    'any.required': 'Court name is required'
                }),
                size: Joi.string().valid('5v5', '6v6', '7v7').required().messages({
                    'any.only': 'Court size must be 5v5, 6v6, or 7v7',
                    'any.required': 'Court size is required'
                }),
                hourlyRate: Joi.number().min(0).required().messages({
                    'number.min': 'Hourly rate must be 0 or greater',
                    'any.required': 'Hourly rate is required'
                }),
                // Optional fields with smart defaults
                maxPlayers: Joi.number().min(10).max(14).optional(),
                openingTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
                closingTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
                peakHourRate: Joi.number().min(0).optional(),
                isActive: Joi.boolean().optional(),
                isAvailable: Joi.boolean().optional(),
                amenities: Joi.array().items(Joi.string()).optional()
            })
        ).min(1).required().messages({
            'array.min': 'At least one court is required',
            'any.required': 'Courts array is required'
        })
        // Note: images are uploaded via multer, not in JSON body
    }),

    // Booking creation schema

    createBooking: Joi.object({
        courtId: Joi.string().hex().length(24).required(),
        date: Joi.date().iso().min('now').required(),
        startTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        endTime: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
        bookingType: Joi.string().valid('PARTIAL_TEAM', 'FULL_TEAM').required(), // Add this
        groupType: Joi.string().valid('public', 'private').optional(),
        maxPlayers: Joi.number().min(1).max(20).optional() // Change playerCount to maxPlayers
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
        ).optional().messages({
            'any.invalid': 'additionalKyc must be a valid JSON object'
        })
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
