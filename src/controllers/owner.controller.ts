import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants.js';
import { createResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { OwnerService } from '../services/owner.service.js';
import type { OwnerDocumentsUpload } from '../types/user.types.js';

const ownerService = new OwnerService();

export const activateOwnerMode = asyncHandler(async (req: Request, res: Response) => {
    const result = await ownerService.activateOwnerMode(
        req.user!.id,
        {
            panNumber: req.body.panNumber,
            address: req.body.address,
            additionalKyc: req.body.additionalKyc,
        },
        (req.files ?? {}) as OwnerDocumentsUpload
    );

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result,
            'Owner mode enabled successfully',
            HTTP_STATUS.OK
        )
    );
});

export const deactivateOwnerMode = asyncHandler(async (req: Request, res: Response) => {
    const result = await ownerService.deactivateOwnerMode(req.user!.id);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result,
            'Owner mode disabled. You are back in player mode.',
            HTTP_STATUS.OK
        )
    );
});

export const getOwnerProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await ownerService.getOwnerProfile(req.user!.id);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            profile,
            'Owner profile fetched successfully',
            HTTP_STATUS.OK
        )
    );
});

