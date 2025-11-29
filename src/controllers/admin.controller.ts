import type { Request, Response } from 'express';
import { HTTP_STATUS } from '../config/constants.js';
import { createResponse } from '../utils/helpers.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { AdminService } from '../services/admin.service.js';
import type {
    ApproveOwnerRequestDto,
    UpdateOwnerStatusDto,
    UpdateUserStatusDto,
    AdminOwnerQueryParams,
    AdminUserQueryParams,
    AdminFutsalQueryParams
} from '../types/admin.types.js';

const adminService = new AdminService();

/**
 * Get dashboard statistics
 */
export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await adminService.getDashboardStats();

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            stats,
            'Dashboard statistics fetched successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Get pending owner requests
 */
export const getPendingOwnerRequests = asyncHandler(async (req: Request, res: Response) => {
    const params: AdminOwnerQueryParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        status: req.query.status as any,
        search: req.query.search as string,
        sort: req.query.sort as string
    };

    const result = await adminService.getPendingOwnerRequests(params);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result.owners,
            'Pending owner requests fetched successfully',
            HTTP_STATUS.OK,
            result.pagination
        )
    );
});

/**
 * Approve or reject owner request
 */
export const approveOwnerRequest = asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;
    const payload: ApproveOwnerRequestDto = req.body;

    const owner = await adminService.approveOwnerRequest(ownerId, payload);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            owner,
            `Owner request ${payload.status === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
            HTTP_STATUS.OK
        )
    );
});

/**
 * Update owner status
 */
export const updateOwnerStatus = asyncHandler(async (req: Request, res: Response) => {
    const { ownerId } = req.params;
    const payload: UpdateOwnerStatusDto = req.body;

    const owner = await adminService.updateOwnerStatus(ownerId, payload);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            owner,
            'Owner status updated successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Get all users
 */
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
    const params: AdminUserQueryParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        role: req.query.role as any,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
        sort: req.query.sort as string
    };

    const result = await adminService.getAllUsers(params);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result.users,
            'Users fetched successfully',
            HTTP_STATUS.OK,
            result.pagination
        )
    );
});

/**
 * Get user by ID
 */
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    const user = await adminService.getUserById(userId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            user,
            'User fetched successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Update user status
 */
export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const payload: UpdateUserStatusDto = req.body;

    const user = await adminService.updateUserStatus(userId, payload);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            user,
            `User ${payload.isActive ? 'activated' : 'deactivated'} successfully`,
            HTTP_STATUS.OK
        )
    );
});

/**
 * Delete user
 */
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const { userId } = req.params;

    await adminService.deleteUser(userId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            null,
            'User deleted successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Get all venues
 */
export const getAllVenues = asyncHandler(async (req: Request, res: Response) => {
    const params: AdminFutsalQueryParams = {
        page: req.query.page ? Number(req.query.page) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        isVerified: req.query.isVerified ? req.query.isVerified === 'true' : undefined,
        isActive: req.query.isActive ? req.query.isActive === 'true' : undefined,
        search: req.query.search as string,
        sort: req.query.sort as string
    };

    const result = await adminService.getAllFutsalCourts(params);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            result.venues,
            'Venues fetched successfully',
            HTTP_STATUS.OK,
            result.pagination
        )
    );
});

/**
 * Verify venue
 */
export const verifyVenue = asyncHandler(async (req: Request, res: Response) => {
    const { venueId } = req.params;

    const venue = await adminService.verifyVenue(venueId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            venue,
            'Venue verified successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Suspend venue
 */
export const suspendVenue = asyncHandler(async (req: Request, res: Response) => {
    const { venueId } = req.params;

    const venue = await adminService.suspendVenue(venueId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            venue,
            'Venue suspended successfully',
            HTTP_STATUS.OK
        )
    );
});

/**
 * Reactivate venue
 */
export const reactivateVenue = asyncHandler(async (req: Request, res: Response) => {
    const { venueId } = req.params;

    const venue = await adminService.reactivateVenue(venueId);

    res.status(HTTP_STATUS.OK).json(
        createResponse(
            true,
            venue,
            'Venue reactivated successfully',
            HTTP_STATUS.OK
        )
    );
});

