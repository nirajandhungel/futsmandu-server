import { Response } from 'express';
import { HTTP_STATUS } from '../config/constants.js';

interface SuccessMeta {
  timestamp: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Consistent success response builder
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string,
  statusCode: number = HTTP_STATUS.OK,
  meta: Record<string, unknown> = {}
): Response => {
  const responseMeta: SuccessMeta = {
    timestamp: new Date().toISOString(),
    ...meta,
  };

  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: responseMeta,
  });
};

export default sendSuccess;

