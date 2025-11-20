import type {Request, Response, NextFunction} from 'express';
import { OwnerVerificationStatus, UserMode } from '../types/common.types.js';
import { AuthorizationError } from './error.middleware.js';

export const requireMode = (modes: UserMode[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user || !modes.includes(req.user.mode)) {
            throw new AuthorizationError('Insufficient mode permissions', undefined, {
                requiredModes: modes,
                currentMode: req.user?.mode,
            });
        }
        next();
    };
};

export const requireOwnerStatus = (statuses: OwnerVerificationStatus[]) => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        if (!req.user || !statuses.includes(req.user.ownerStatus as OwnerVerificationStatus)) {
            throw new AuthorizationError('Owner verification required', undefined, {
                requiredStatuses: statuses,
                currentStatus: req.user?.ownerStatus,
            });
        }
        next();
    };
};

