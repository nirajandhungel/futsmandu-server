import type { Express } from 'express';
import { UserRepository } from '../repositories/user.repository.js';
import { AuthService } from './auth.service.js';
import { OwnerActivationDto, OwnerDocumentsUpload, ModeSwitchResponse } from '../types/user.types.js';
import { NotFoundError, ValidationError } from '../middleware/error.middleware.js';
import { uploadImageBuffer } from '../utils/cloudinary.js';
import { config } from '../config/environment.js';
import { OwnerVerificationStatus, UserMode, UserRole } from '../types/common.types.js';

export class OwnerService {
    private userRepository: UserRepository;
    private authService: AuthService;

    constructor() {
        this.userRepository = new UserRepository();
        this.authService = new AuthService();
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
}

