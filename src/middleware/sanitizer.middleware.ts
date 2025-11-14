// src/middleware/sanitizer.middleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger.js';

/**
 * Industry-standard sanitizer that's compatible with Express v5
 * Prevents NoSQL injection attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters (read-only in Express v5, so we need to be careful)
    if (req.query && Object.keys(req.query).length > 0) {
      const sanitizedQuery = sanitizeObject(req.query);
      
      // Merge sanitized values back carefully
      Object.entries(sanitizedQuery).forEach(([key, value]) => {
        if (req.query[key] !== undefined) {
          (req.query as any)[key] = value;
        }
      });
    }

    // Sanitize URL parameters
    if (req.params) {
      const sanitizedParams = sanitizeObject(req.params);
      Object.assign(req.params, sanitizedParams);
    }

    next();
  } catch (error) {
    // In production, we don't want to break the request flow
    logger.warn('Input sanitization partially failed', { error });
    next();
  }
};

/**
 * Recursively sanitizes an object by removing MongoDB operators
 */
function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  // Handle primitive values
  if (typeof obj !== 'object') {
    return sanitizePrimitive(obj);
  }

  // Handle objects
  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(obj)) {
    // Remove keys that are MongoDB operators
    if (isMongoOperator(key)) {
      continue;
    }
    
    sanitized[key] = sanitizeObject(value);
  }
  
  return sanitized;
}

/**
 * Sanitize primitive values
 */
function sanitizePrimitive(value: any): any {
  if (typeof value === 'string') {
    // Remove MongoDB operators from strings
    return value.replace(/\$(where|eq|ne|gt|gte|lt|lte|in|nin|exists|type|mod|regex|text|search|all|elemMatch|size|bitsAllSet|bitsAnySet|bitsAllClear|bitsAnyClear)|\[(\$[^\]]+)\]/gi, '');
  }
  
  return value;
}

/**
 * Check if a key is a MongoDB operator
 */
function isMongoOperator(key: string): boolean {
  const mongoOperators = [
    '$where', '$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin',
    '$exists', '$type', '$mod', '$regex', '$text', '$search', '$all', 
    '$elemMatch', '$size', '$bitsAllSet', '$bitsAnySet', '$bitsAllClear', 
    '$bitsAnyClear', '$and', '$or', '$not', '$nor'
  ];
  
  return mongoOperators.includes(key);
}

export default sanitizeInput;