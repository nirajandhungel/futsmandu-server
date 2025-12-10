import { OwnerVerificationStatus, UserRole } from './common.types.js';

export interface ApproveOwnerRequestDto {
    status: OwnerVerificationStatus.APPROVED | OwnerVerificationStatus.REJECTED;
    remarks?: string;
}

export interface UpdateOwnerStatusDto {
    status: OwnerVerificationStatus;
    remarks?: string;
}

export interface UpdateUserStatusDto {
    isActive: boolean;
    reason?: string;
}

export interface AdminOwnerQueryParams {
    page?: number;
    limit?: number;
    status?: OwnerVerificationStatus;
    search?: string;
    sort?: string;
}

export interface AdminUserQueryParams {
    page?: number;
    limit?: number;
    role?: UserRole;
    isActive?: boolean;
    search?: string;
    sort?: string;
}

export interface AdminFutsalQueryParams {
    page?: number;
    limit?: number;
    isVerified?: boolean;
    isActive?: boolean;
    search?: string;
    sort?: string;
}

export interface AdminDashboardStats {
    totalUsers: number;
    totalOwners: number;
    totalPlayers: number;
    pendingOwnerRequests: number;
    approvedOwners: number;
    rejectedOwners: number;
    totalVenues: number;
    verifiedVenues: number;
    pendingVenues: number;
    activeVenues: number;
    suspendedVenues: number;
    // Booking stats
    totalBookings: number;
    todayBookings: number;
    thisWeekBookings: number;
    thisMonthBookings: number;
    pendingBookings: number;
    confirmedBookings: number;
    cancelledBookings: number;
    completedBookings: number;
    totalRevenue: number;
    todayRevenue: number;
}

