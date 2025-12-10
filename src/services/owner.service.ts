import type { Express } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from './auth.service.js';
import { CourtService } from './court.service.js';
import { BookingRepository } from '../repositories/booking.repository.js';
import { OwnerActivationDto, OwnerDocumentsUpload, ModeSwitchResponse } from '../types/user.types.js';
import { CreateFutsalVenueRequest } from '../types/court.types.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { uploadImageBuffer } from '../utils/cloudinary.js';
import { config } from '../config/environment.js';
import { OwnerVerificationStatus, UserMode, UserRole, BookingStatus } from '../types/common.types.js';
import logger from '../utils/logger.js';
import { getOwnerVenues } from '@/controllers/owner.controller.js';

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

        // Add null checks for payload
        if (!payload) {
            throw new ValidationError('Payload is required');
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

        const additionalKyc = payload.additionalKyc ? this.normalizeAdditionalKyc(payload.additionalKyc) : undefined;

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



    // async activateOwnerMode(
    //     userId: string,
    //     payload: OwnerActivationDto,
    //     files: OwnerDocumentsUpload
    // ): Promise<ModeSwitchResponse> {
    //     const user = await this.userRepository.findById(userId);
    //     if (!user) {
    //         throw new NotFoundError('User');
    //     }

    //     const profilePhoto = this.pickFile(files, 'profilePhoto');
    //     const citizenshipFront = this.pickFile(files, 'citizenshipFront');
    //     const citizenshipBack = this.pickFile(files, 'citizenshipBack');

    //     const folder = `${config.cloudinary.baseFolder ?? 'futsmandu'}/owners/${user._id.toString()}`;

    //     const [profilePhotoUpload, frontUpload, backUpload] = await Promise.all([
    //         uploadImageBuffer(profilePhoto, { folder, publicId: 'profile-photo' }),
    //         uploadImageBuffer(citizenshipFront, { folder, publicId: 'citizenship-front' }),
    //         uploadImageBuffer(citizenshipBack, { folder, publicId: 'citizenship-back' }),
    //     ]);

    //     const additionalKyc = this.normalizeAdditionalKyc(payload.additionalKyc);

    //     user.ownerProfile = {
    //         ...user.ownerProfile,
    //         profilePhotoUrl: profilePhotoUpload.secure_url,
    //         citizenshipFrontUrl: frontUpload.secure_url,
    //         citizenshipBackUrl: backUpload.secure_url,
    //         panNumber: payload.panNumber,
    //         address: payload.address,
    //         additionalKyc: additionalKyc ? new Map(Object.entries(additionalKyc)) : undefined,
    //         status: OwnerVerificationStatus.PENDING,
    //         lastSubmittedAt: new Date(),
    //     };

    //     user.mode = UserMode.OWNER;
    //     user.role = UserRole.OWNER;

    //     await user.save();

    //     const tokens = this.authService.generateUserTokens(user);
    //     await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

    //     return {
    //         user: this.authService.toPublicUser(user),
    //         tokens,
    //     };
    // }

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
    // use-player-mode
    async usePlayerMode(userId: string): Promise<ModeSwitchResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }

        user.mode = UserMode.PLAYER;
        await user.save();

        const tokens = this.authService.generateUserTokens(user);
        await this.userRepository.updateRefreshToken(user._id.toString(), tokens.refreshToken);

        return {
            user: this.authService.toPublicUser(user),
            tokens,
        };
    }
    // activate-player-mode
    async useOwnerMode(userId: string): Promise<ModeSwitchResponse> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }

        user.mode = UserMode.OWNER;
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
        if (!data) return undefined;

        try {
            // Handle both string JSON and object cases
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;

            if (typeof parsedData === 'object' && !Array.isArray(parsedData) && parsedData !== null) {
                return Object.entries(parsedData).reduce<Record<string, string>>((acc, [key, value]) => {
                    acc[key] = String(value ?? '');
                    return acc;
                }, {});
            }

            return undefined;
        } catch (error) {
            throw new ValidationError('Invalid additionalKyc format');
        }
    }

    /**
     * Create a new venue with courts
     * At least one court (5v5 or 6v6) is required
     * Applies smart defaults for courts and handles image uploads
     */
    async createVenue(
        userId: string,
        venueData: CreateFutsalVenueRequest,
        venueImages?: Express.Multer.File[],
        courtImagesMap?: { [courtIndex: number]: Express.Multer.File[] }
    ) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new NotFoundError('User');
        }

        const baseFolder = `${config.cloudinary.baseFolder ?? 'futsmandu'}/venues/${userId}`;
        let venueImageUrls: string[] = [];

        // Upload venue images to Cloudinary if provided
        if (venueImages && venueImages.length > 0) {
            const uploadPromises = venueImages.map((image, index) =>
                uploadImageBuffer(image, {
                    folder: baseFolder,
                    publicId: `venue-image-${Date.now()}-${index}`
                })
            );

            const uploadResults = await Promise.all(uploadPromises);
            venueImageUrls = uploadResults.map(result => result.secure_url);

            logger.info('Venue images uploaded', {
                userId,
                imageCount: venueImageUrls.length
            });
        }

        // Upload court images and apply smart defaults to courts
        const courtsWithDefaults = await Promise.all(
            venueData.courts.map(async (court, index) => {
                // Upload court images if provided
                let courtImageUrls: string[] = [];
                if (courtImagesMap && courtImagesMap[index] && courtImagesMap[index].length > 0) {
                    const courtFolder = `${baseFolder}/courts/court-${index}`;
                    const uploadPromises = courtImagesMap[index].map((image, imgIndex) =>
                        uploadImageBuffer(image, {
                            folder: courtFolder,
                            publicId: `court-image-${Date.now()}-${imgIndex}`
                        })
                    );

                    const uploadResults = await Promise.all(uploadPromises);
                    courtImageUrls = uploadResults.map(result => result.secure_url);
                }

                // Apply smart defaults
                const courtWithDefaults = this.applyCourtDefaults(court, venueData.openingHours);

                return {
                    ...courtWithDefaults,
                    images: courtImageUrls.length > 0 ? courtImageUrls : (court.images || [])
                };
            })
        );

        // Add image URLs to venue data
        const venueDataWithImages: CreateFutsalVenueRequest = {
            ...venueData,
            images: venueImageUrls.length > 0 ? venueImageUrls : (venueData.images || []),
            courts: courtsWithDefaults
        };

        return this.courtService.createVenueWithCourts(venueDataWithImages, userId);
    }

    /**
     * Apply smart defaults to court data
     * - maxPlayers: auto-calculate based on size (5v5=10, 6v6=12, 7v7=14)
     * - openingTime/closingTime: inherit from venue's first day opening hours
     * - peakHourRate: auto-calculate as hourlyRate * 1.25
     * - isActive: default to true
     * - isAvailable: default to true
     * - amenities: default to empty array
     */
    private applyCourtDefaults(
        court: CreateFutsalVenueRequest['courts'][0],
        venueOpeningHours: CreateFutsalVenueRequest['openingHours']
    ): CreateFutsalVenueRequest['courts'][0] {
        // Calculate maxPlayers based on size
        const calculateMaxPlayers = (size: string): number => {
            switch (size) {
                case '5v5':
                    return 10;
                case '6v6':
                    return 12;
                case '7v7':
                    return 14;
                default:
                    return 10; // Default fallback
            }
        };

        // Get venue opening hours from first available day
        const getVenueOpeningHours = (): { open: string; close: string } => {
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            for (const day of days) {
                if (venueOpeningHours[day as keyof typeof venueOpeningHours]) {
                    return venueOpeningHours[day as keyof typeof venueOpeningHours];
                }
            }
            // Fallback to default hours
            return { open: '06:00', close: '22:00' };
        };

        const venueHours = getVenueOpeningHours();

        return {
            ...court,
            maxPlayers: court.maxPlayers ?? calculateMaxPlayers(court.size),
            openingTime: court.openingTime ?? venueHours.open,
            closingTime: court.closingTime ?? venueHours.close,
            peakHourRate: court.peakHourRate ?? Math.round(court.hourlyRate * 1.25),
            isActive: court.isActive ?? true,
            isAvailable: court.isAvailable ?? true,
            amenities: court.amenities ?? []
        };
    }

    /**
     * Get owner dashboard analytics
     */
    async getDashboardAnalytics(ownerId: string) {
        // Get all venues owned by user
        const { venues, courts } = await this.courtService.getOwnerVenues(ownerId);
        const venueIds = venues.map(v => v.id!);

        // Get all bookings for owner's venues
        const allBookings = await Promise.all(
            venueIds.map(venueId =>
                this.bookingRepository.findBookingsByOwner(ownerId, { venueId })
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
                totalVenues: venues.length,
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
    /**
     * Get owner dashboard analytics
     */
    async getOwnerVenues(ownerId: string) {
        // Get all venues owned by user
        const { venues, courts } = await this.courtService.getOwnerVenues(ownerId);
        // const venueIds = venues.map(v => v.id!);

        
        logger.info('Dashboard analytics retrieved', { ownerId, venues });

        return {
            venues
        }
    }
}

