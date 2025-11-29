import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from './auth.service.js';
import { User } from '../models/user.model.js';
import { 
    ApproveOwnerRequestDto, 
    UpdateOwnerStatusDto, 
    UpdateUserStatusDto,
    AdminOwnerQueryParams,
    AdminUserQueryParams,
    AdminFutsalQueryParams,
    AdminDashboardStats
} from '../types/admin.types.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { OwnerVerificationStatus, UserMode, UserRole } from '../types/common.types.js';
import { calculatePagination } from '../utils/helpers.js';
import { APP_CONSTANTS } from '../config/constants.js';
import { FutsalVenueModel, CourtModel } from '../models/court.model.js';
import logger from '../utils/logger.js';

export class AdminService {
    private userRepository: UserRepository;
    private authService: AuthService;

    constructor() {
        this.userRepository = new UserRepository();
        this.authService = new AuthService();
    }

    /**
     * Get dashboard statistics
     */
    async getDashboardStats(): Promise<AdminDashboardStats> {
        const [
            totalUsers,
            totalOwners,
            totalPlayers,
            pendingOwnerRequests,
            approvedOwners,
            rejectedOwners,
            totalVenues,
            verifiedVenues,
            pendingVenues,
            activeVenues,
            suspendedVenues
        ] = await Promise.all([
            this.userRepository.count({}),
            this.userRepository.count({ role: UserRole.OWNER }),
            this.userRepository.count({ role: UserRole.PLAYER }),
            this.userRepository.count({ 'ownerProfile.status': OwnerVerificationStatus.PENDING }),
            this.userRepository.count({ 'ownerProfile.status': OwnerVerificationStatus.APPROVED }),
            this.userRepository.count({ 'ownerProfile.status': OwnerVerificationStatus.REJECTED }),
            FutsalVenueModel.countDocuments({}),
            FutsalVenueModel.countDocuments({ isVerified: true, isActive: true }),
            FutsalVenueModel.countDocuments({ isVerified: false, isActive: true }),
            FutsalVenueModel.countDocuments({ isActive: true }),
            FutsalVenueModel.countDocuments({ isActive: false })
        ]);

        return {
            totalUsers,
            totalOwners,
            totalPlayers,
            pendingOwnerRequests,
            approvedOwners,
            rejectedOwners,
            totalVenues,
            verifiedVenues,
            pendingVenues,
            activeVenues,
            suspendedVenues
        };
    }

    /**
     * Get pending owner requests with pagination and filters
     */
    async getPendingOwnerRequests(params: AdminOwnerQueryParams) {
        const page = params.page ?? APP_CONSTANTS.DEFAULT_PAGE;
        const limit = params.limit ?? APP_CONSTANTS.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const filter: any = {
            'ownerProfile.status': params.status ?? OwnerVerificationStatus.PENDING,
            role: UserRole.OWNER
        };

        if (params.search) {
            filter.$or = [
                { email: { $regex: params.search, $options: 'i' } },
                { fullName: { $regex: params.search, $options: 'i' } },
                { phoneNumber: { $regex: params.search, $options: 'i' } },
                { 'ownerProfile.panNumber': { $regex: params.search, $options: 'i' } }
            ];
        }

        const sort: any = {};
        if (params.sort) {
            const [field, order] = params.sort.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -refreshToken')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.userRepository.count(filter)
        ]);

        const pagination = calculatePagination(page, limit, total);

        const owners = users.map(user => {
            const ownerProfile = user.ownerProfile
                ? {
                    ...user.ownerProfile,
                    additionalKyc: user.ownerProfile.additionalKyc instanceof Map
                        ? Object.fromEntries(user.ownerProfile.additionalKyc)
                        : user.ownerProfile.additionalKyc
                }
                : undefined;

            return {
                id: user._id.toString(),
                email: user.email,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                mode: user.mode,
                ownerProfile,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        });

        return {
            owners,
            pagination
        };
    }

    /**
     * Approve or reject owner request
     */
    async approveOwnerRequest(ownerId: string, payload: ApproveOwnerRequestDto): Promise<any> {
        const user = await this.userRepository.findById(ownerId);
        
        if (!user) {
            throw new NotFoundError('Owner');
        }

        if (!user.ownerProfile) {
            throw new ValidationError('Owner profile not found');
        }

        if (user.ownerProfile.status !== OwnerVerificationStatus.PENDING) {
            throw new ValidationError(`Owner request is already ${user.ownerProfile.status}`);
        }

        const updateData: any = {
            'ownerProfile.status': payload.status
        };

        if (payload.status === OwnerVerificationStatus.APPROVED) {
            user.mode = UserMode.OWNER;
            updateData.mode = UserMode.OWNER;
        }

        await this.userRepository.updateById(ownerId, updateData);

        logger.info('Owner request processed', {
            ownerId,
            status: payload.status,
            adminRemarks: payload.remarks
        });

        const updatedUser = await this.userRepository.findById(ownerId);
        return this.authService.toPublicUser(updatedUser!);
    }

    /**
     * Update owner status (approve, reject, deactivate, block)
     */
    async updateOwnerStatus(ownerId: string, payload: UpdateOwnerStatusDto): Promise<any> {
        const user = await this.userRepository.findById(ownerId);
        
        if (!user) {
            throw new NotFoundError('Owner');
        }

        if (!user.ownerProfile) {
            throw new ValidationError('Owner profile not found');
        }

        const updateData: any = {
            'ownerProfile.status': payload.status
        };

        if (payload.status === OwnerVerificationStatus.APPROVED) {
            user.mode = UserMode.OWNER;
            updateData.mode = UserMode.OWNER;
        } else if (payload.status === OwnerVerificationStatus.INACTIVE || 
                   payload.status === OwnerVerificationStatus.REJECTED) {
            user.mode = UserMode.PLAYER;
            updateData.mode = UserMode.PLAYER;
        }

        await this.userRepository.updateById(ownerId, updateData);

        logger.info('Owner status updated', {
            ownerId,
            status: payload.status,
            remarks: payload.remarks
        });

        const updatedUser = await this.userRepository.findById(ownerId);
        return this.authService.toPublicUser(updatedUser!);
    }

    /**
     * Get all users with pagination and filters
     */
    async getAllUsers(params: AdminUserQueryParams) {
        const page = params.page ?? APP_CONSTANTS.DEFAULT_PAGE;
        const limit = params.limit ?? APP_CONSTANTS.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (params.role) {
            filter.role = params.role;
        }

        if (params.isActive !== undefined) {
            filter.isActive = params.isActive;
        }

        if (params.search) {
            filter.$or = [
                { email: { $regex: params.search, $options: 'i' } },
                { fullName: { $regex: params.search, $options: 'i' } },
                { phoneNumber: { $regex: params.search, $options: 'i' } }
            ];
        }

        const sort: any = {};
        if (params.sort) {
            const [field, order] = params.sort.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-password -refreshToken')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            this.userRepository.count(filter)
        ]);

        const pagination = calculatePagination(page, limit, total);

        const usersList = users.map(user => {
            const ownerProfile = user.ownerProfile
                ? {
                    ...user.ownerProfile,
                    additionalKyc: user.ownerProfile.additionalKyc instanceof Map
                        ? Object.fromEntries(user.ownerProfile.additionalKyc)
                        : user.ownerProfile.additionalKyc
                }
                : undefined;

            return {
                id: user._id.toString(),
                email: user.email,
                fullName: user.fullName,
                phoneNumber: user.phoneNumber,
                role: user.role,
                mode: user.mode,
                ownerProfile,
                profileImage: user.profileImage,
                isActive: user.isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
        });

        return {
            users: usersList,
            pagination
        };
    }

    /**
     * Get user by ID
     */
    async getUserById(userId: string): Promise<any> {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new NotFoundError('User');
        }

        return this.authService.toPublicUser(user);
    }

    /**
     * Update user status (activate/deactivate)
     */
    async updateUserStatus(userId: string, payload: UpdateUserStatusDto): Promise<any> {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new NotFoundError('User');
        }

        await this.userRepository.updateById(userId, { isActive: payload.isActive });

        logger.info('User status updated', {
            userId,
            isActive: payload.isActive,
            reason: payload.reason
        });

        const updatedUser = await this.userRepository.findById(userId);
        return this.authService.toPublicUser(updatedUser!);
    }

    /**
     * Delete user
     */
    async deleteUser(userId: string): Promise<void> {
        const user = await this.userRepository.findById(userId);
        
        if (!user) {
            throw new NotFoundError('User');
        }

        await this.userRepository.deleteById(userId);

        logger.info('User deleted', { userId });
    }

    /**
     * Get all futsal courts with pagination and filters
     */
    async getAllFutsalCourts(params: AdminFutsalQueryParams) {
        const page = params.page ?? APP_CONSTANTS.DEFAULT_PAGE;
        const limit = params.limit ?? APP_CONSTANTS.DEFAULT_LIMIT;
        const skip = (page - 1) * limit;

        const filter: any = {};

        if (params.isVerified !== undefined) {
            filter.isVerified = params.isVerified;
        }

        if (params.isActive !== undefined) {
            filter.isActive = params.isActive;
        }

        if (params.search) {
            filter.$or = [
                { name: { $regex: params.search, $options: 'i' } },
                { description: { $regex: params.search, $options: 'i' } },
                { 'location.address': { $regex: params.search, $options: 'i' } },
                { 'location.city': { $regex: params.search, $options: 'i' } }
            ];
        }

        const sort: any = {};
        if (params.sort) {
            const [field, order] = params.sort.split(':');
            sort[field] = order === 'desc' ? -1 : 1;
        } else {
            sort.createdAt = -1;
        }

        const [venues, total] = await Promise.all([
            FutsalVenueModel.find(filter)
                .populate('ownerId', 'email fullName phoneNumber')
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            FutsalVenueModel.countDocuments(filter)
        ]);

        const pagination = calculatePagination(page, limit, total);

        return {
            venues,
            pagination
        };
    }

    /**
     * Verify venue
     */
    async verifyVenue(venueId: string): Promise<any> {
        const venue = await FutsalVenueModel.findById(venueId);
        
        if (!venue) {
            throw new NotFoundError('Venue');
        }

        venue.isVerified = true;
        await venue.save();

        logger.info('Venue verified', { venueId });

        return venue;
    }

    /**
     * Suspend venue
     */
    async suspendVenue(venueId: string): Promise<any> {
        const venue = await FutsalVenueModel.findById(venueId);
        
        if (!venue) {
            throw new NotFoundError('Venue');
        }

        venue.isActive = false;
        await venue.save();

        logger.info('Venue suspended', { venueId });

        return venue;
    }

    /**
     * Reactivate venue
     */
    async reactivateVenue(venueId: string): Promise<any> {
        const venue = await FutsalVenueModel.findById(venueId);
        
        if (!venue) {
            throw new NotFoundError('Venue');
        }

        venue.isActive = true;
        await venue.save();

        logger.info('Venue reactivated', { venueId });

        return venue;
    }
}

