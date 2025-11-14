import rateLimit from "express-rate-limit";
import { config } from "../config/environment.js";
import { HTTP_STATUS } from "../config/constants.js";

// General rate limiter middleware
export const generalLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs, // e.g., 15 minutes
    max: config.rateLimit.maxRequests, // e.g., limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Auth-specific rate limiter middleware
export const authLimiter = rateLimit({
    windowMs: 15*60*1000, // e.g., 15 minutes
    max: 5, // e.g., limit each IP to 20 requests per windowMs
    message: "Too many authentication attempts from this IP, please try again later.",
    skipSuccessfulRequests: true, // Only count failed requests toward the rate limit
});

// booking-specific rate limiter middleware
export const bookingLimiter = rateLimit({
    windowMs: 60*60*1000, // e.g., 1 hour
    max: 10, // e.g., limit each IP to 10 requests per windowMs
    message: "Too many booking attempts from this IP, please try again later.",

});