import dotenv from 'dotenv';
import Joi from 'joi';
import { env } from 'process';

dotenv.config();

const envSchema = Joi.object({
    NODE_ENV:Joi.string().valid('development', 'production','test').default('development'),
    PORT:Joi.number().default(5000),
    API_PREFIX:Joi.string(),
    
    MONGO_URI:Joi.string().required(),
    JWT_SECRET:Joi.string().required(),
    JWT_EXPIRES_IN:Joi.string().default('1h')
    ,   JWT_REFRESH_SECRET:Joi.string().required(),
    JWT_REFRESH_EXPIRES_IN:Joi.string().default('30d'),
    
    SMTP_HOST:Joi.string().required(),
    SMTP_PORT:Joi.number().required(),
    SMTP_USER:Joi.string().required(),
    SMTP_PASSWORD:Joi.string().required(),
    EMAIL_FROM:Joi.string().email().required(),
    
    RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),// 15 minutes 
    RATE_LIMIT_MAX_REQUESTS:Joi.number().default(100),// max requests per window per IP
    APP_NAME:Joi.string().default('FUTSMANDU'),
    APP_VERSION:Joi.string().default('1.0.0'),
    CLIENT_URL:Joi.string().uri().required(),
    CLOUDINARY_CLOUD_NAME:Joi.string().required(),
    CLOUDINARY_API_KEY:Joi.string().required(),
    CLOUDINARY_API_SECRET:Joi.string().required(),
    CLOUDINARY_UPLOAD_PRESET:Joi.string().optional(),
    CLOUDINARY_BASE_FOLDER:Joi.string().default('futsmandu'),
}).unknown();

const {error, value:envVars} = envSchema.validate(process.env);

if(error){
    throw new Error(`Config validation error: ${error.message}`)
}

export const config={
    env:envVars.NODE_ENV,
    port:envVars.PORT,
    apiPrefix:envVars.API_PREFIX,

    mongodb:{
        uri:envVars.MONGO_URI,
    },

    jwt:{
        secret:envVars.JWT_SECRET,
        expiresIn:envVars.JWT_EXPIRES_IN,
        refreshSecret:envVars.JWT_REFRESH_SECRET,
        refreshExpiresIn:envVars.JWT_REFRESH_EXPIRES_IN,
        issuer:envVars.JWT_ISSUER
    },

    email:{
        host:envVars.SMTP_HOST,
        port:envVars.SMTP_PORT,
        user:envVars.SMTP_USER,
        password:envVars.SMTP_PASSWORD,
        from:envVars.EMAIL_FROM,
    },

    rateLimit:{
        windowMs:envVars.RATE_LIMIT_WINDOW_MS,
        maxRequests:envVars.RATE_LIMIT_MAX_REQUESTS,
    },

    app:{
        name:envVars.APP_NAME,
        version:envVars.APP_VERSION,
        clientUrl:envVars.CLIENT_URL,
    },

    cloudinary:{
        cloudName:envVars.CLOUDINARY_CLOUD_NAME,
        apiKey:envVars.CLOUDINARY_API_KEY,
        apiSecret:envVars.CLOUDINARY_API_SECRET,
        uploadPreset:envVars.CLOUDINARY_UPLOAD_PRESET,
        baseFolder:envVars.CLOUDINARY_BASE_FOLDER,
    },

}

