import type { Express } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from './auth.service.js';
import { CourtService } from './court.service.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { OwnerActivationDto, OwnerDocumentsUpload, ModeSwitchResponse } from '../types/user.types.js';
import { CreateFutsalCourtRequest } from '../types/court.types.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { uploadImageBuffer } from '../utils/cloudinary.js';
import { config } from '../config/environment.js';
import { OwnerVerificationStatus, UserMode, UserRole, BookingStatus } from '../types/common.types.js';
import logger from '../utils/logger.js';

export class OwnerService {
    private userRepository: UserRepository;
    private authService: AuthService;
    private courtService: CourtService;
    private bookingRepository: BookingRepository;

    constructor() {
        this.userRepository = new UserRepository();
        this.authService = new AuthService();
        this.courtService = new CourtService();
        this.bookingRepository = new BookingRepository();
    }

    async activateOwnerMode(
        userId: string,
        payload: OwnerActivationDto,
        files: OwnerDocumentsUpload
    ): Promise<ModeSwitchResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }

        const profilePhoto = this.pickFile(files, 'profilePhoto');
        const citizenshipFront = this.pickFile(files, 'citizenshipFront');
        const citizenshipBack = this.pickFile(files, 'citizenshipBack');

        const folder = `${config.cloudinary.baseFolder ?? 'futsmandu'}/owners/${user._id.toString()}`;

        const [profilePhotoUpload, frontUpload, backUpload] = await Promise.all([
            uploadImageBuffer(profilePhoto, { folder, publicId: 'profile-photo' }),
            uploadImageBuffer(citizenshipFront, { folder, publicId: 'citizenship-front' }),
            uploadImageBuffer(citizenshipBack, { folder, publicId: 'citizenship-back' }),
        ]);

        const additionalKyc = this.normalizeAdditionalKyc(payload.additionalKyc);

        user.ownerProfile = {
            ...user.ownerProfile,
            profilePhotoUrl: profilePhotoUpload.secure_url,
            citizenshipFrontUrl: frontUpload.secure_url,
            citizenshipBackUrl: backUpload.secure_url,
            panNumber: payload.panNumber,
            address: payload.address,
            additionalKyc: additionalKyc ? new Map(Object.entries(additionalKyc)) : undefined,
            status: OwnerVerificationStatus.PENDING,
            lastSubmittedAt: new Date(),
        };

        user.mode = UserMode.OWNER;
        user.role = UserRole.OWNER;

        await user.save();

        const tokens = this.authService.generateUserTokens(user);
        await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

        return {
            user: this.authService.toPublicUser(user),
            tokens,
        };
    }

    async deactivateOwnerMode(userId: string): Promise<ModeSwitchResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }

        user.mode = UserMode.PLAYER;
        if (user.ownerProfile) {
            user.ownerProfile.status = OwnerVerificationStatus.INACTIVE;
        }

        await user.save();

        const tokens = this.authService.generateUserTokens(user);
        await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

        return {
            user: this.authService.toPublicUser(user),
            tokens,
        };
    }

    async getOwnerProfile(userId: string): Promise<any> {
        const user = await this.userRepository.findById(userId);
        if (!user || !user.ownerProfile) {
            throw new NotFoundError('Owner profile');
        }

        return {
            mode: user.mode,
            ownerProfile: this.authService.toPublicUser(user).ownerProfile,
        };
    }

    private pickFile(files: OwnerDocumentsUpload, field: keyof OwnerDocumentsUpload): Express.Multer.File {
        const fileList = files?.[field];
        if (!fileList || !fileList.length) {
            throw new ValidationError(`Missing required file: ${field}`);
        }
        return fileList[0];
    }

    private normalizeAdditionalKyc(
        data: OwnerActivationDto['additionalKyc']
    ): Record<string, string> | undefined {
        if (!data) {
            return undefined;
        }

        if (typeof data === 'string') {
            try {
                const parsed = JSON.parse(data);
                return this.normalizeAdditionalKyc(parsed as Record<string, string>);
            } catch (error) {
                throw new ValidationError('Invalid additionalKyc payload');
            }
        }

        if (typeof data === 'object' && !Array.isArray(data)) {
            return Object.entries(data).reduce<Record<string, string>>((acc, [key, value]) => {
                acc[key] = String(value ?? '');
                return acc;
            }, {});
        }

        return undefined;
    }

    /**
     * Create a new futsal court (venue)
     */
    async createFutsalCourt(
        userId: string, 
        futsalCourtData: CreateFutsalCourtRequest,
        images?: Express.Multer.File[]
    ) {
        let imageUrls: string[] = [];

        // Upload images to Cloudinary if provided
        if (images && images.length > 0) {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new NotFoundError('User');
            }

            const folder = `${config.cloudinary.baseFolder ?? 'futsmandu'}/futsal-courts/${userId}`;
            
            // Upload all images in parallel
            const uploadPromises = images.map((image, index) => 
                uploadImageBuffer(image, { 
                    folder, 
                    publicId: `image-${Date.now()}-${index}` 
                })
            );

            const uploadResults = await Promise.all(uploadPromises);
            imageUrls = uploadResults.map(result => result.secure_url);

            logger.info('Futsal court images uploaded', {
                userId,
                imageCount: imageUrls.length
            });
        }

        // Add image URLs to futsal court data
        const futsalCourtDataWithImages = {
            ...futsalCourtData,
            images: imageUrls.length > 0 ? imageUrls : futsalCourtData.images || []
        };

        return this.courtService.createFutsalCourt(futsalCourtDataWithImages, userId);
    }

    /**
     * Get owner dashboard analytics
     */
    async getDashboardAnalytics(ownerId: string) {
        // Get all futsal courts owned by user
        const { futsalCourts, courts } = await this.courtService.getOwnerCourts(ownerId);
        const futsalCourtIds = futsalCourts.map(fc => fc.id!);

        // Get all bookings for owner's futsal courts
        const allBookings = await Promise.all(
            futsalCourtIds.map(futsalCourtId =>
                this.bookingRepository.findBookingsByOwner(ownerId, { futsalCourtId })
            )
        );
        const bookings = allBookings.flat();

        // Calculate statistics
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === BookingStatus.CONFIRMED);
        const pendingBookings = bookings.filter(b => b.status === BookingStatus.PENDING);
        const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED);

        // Calculate revenue
        const totalRevenue = confirmedBookings.reduce((sum, b) => sum + b.totalAmount, 0);
        const completedRevenue = completedBookings.reduce((sum, b) => sum + b.totalAmount, 0);

        // Get bookings by date range (last 7 days, last 30 days)
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        const bookingsLast7Days = bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= last7Days;
        });
        const bookingsLast30Days = bookings.filter(b => {
            const bookingDate = new Date(b.date);
            return bookingDate >= last30Days;
        });

        const revenueLast7Days = bookingsLast7Days
            .filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
            .reduce((sum, b) => sum + b.totalAmount, 0);
        const revenueLast30Days = bookingsLast30Days
            .filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
            .reduce((sum, b) => sum + b.totalAmount, 0);

        // Calculate peak hours (group by hour)
        const hourCounts: Record<number, number> = {};
        confirmedBookings.forEach(booking => {
            const [hour] = booking.startTime.split(':').map(Number);
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        const peakHours = Object.entries(hourCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([hour]) => `${hour}:00`);

        // Court availability insights
        const totalCourts = courts.length;
        const activeCourts = courts.filter(c => c.isActive).length;
        const availableCourts = courts.filter(c => c.isAvailable).length;

        // Bookings per court
        const bookingsPerCourt = courts.map(court => {
            const courtBookings = bookings.filter(b => b.courtId === court.id);
            return {
                courtId: court.id,
                courtName: court.name,
                totalBookings: courtBookings.length,
                revenue: courtBookings
                    .filter(b => b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.COMPLETED)
                    .reduce((sum, b) => sum + b.totalAmount, 0)
            };
        }).sort((a, b) => b.totalBookings - a.totalBookings);

        logger.info('Dashboard analytics retrieved', { ownerId, totalBookings });

        return {
            overview: {
                totalFutsalCourts: futsalCourts.length,
                totalCourts,
                activeCourts,
                availableCourts,
                totalBookings,
                confirmedBookings: confirmedBookings.length,
                pendingBookings: pendingBookings.length,
                completedBookings: completedBookings.length
            },
            revenue: {
                total: totalRevenue,
                completed: completedRevenue,
                last7Days: revenueLast7Days,
                last30Days: revenueLast30Days
            },
            bookings: {
                last7Days: bookingsLast7Days.length,
                last30Days: bookingsLast30Days.length,
                byStatus: {
                    pending: pendingBookings.length,
                    confirmed: confirmedBookings.length,
                    completed: completedBookings.length,
                    cancelled: bookings.filter(b => b.status === BookingStatus.CANCELLED).length
                }
            },
            insights: {
                peakHours,
                bookingsPerCourt: bookingsPerCourt.slice(0, 10), // Top 10
                averageBookingValue: confirmedBookings.length > 0
                    ? totalRevenue / confirmedBookings.length
                    : 0
            }
        };
    }
}

