import {Request, Response, NextFunction} from 'express';
import logger from '../utils/logger.js';

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  logger.info('Incoming Request:',{
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  //log response details when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('Response Sent:',{
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  next();
};