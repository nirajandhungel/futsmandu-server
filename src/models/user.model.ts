import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcrypt';
import { OwnerVerificationStatus, UserMode, UserRole } from '../types/common.types.js';
import type { OwnerProfile } from '../types/user.types.js';

export interface IUser extends Document {
    _id: Types.ObjectId;
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    role: UserRole;
    mode: UserMode;
    profileImage?: string;
    isActive: boolean;
    refreshToken?: string | null;
    ownerProfile?: OwnerProfile;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
    {
        email: { 
            type: String, 
            required: [true, 'Email is required'], 
            unique: true,
            lowercase: true,
            trim: true,
            match: [/\S+@\S+\.\S+/, 'Invalid email format'],
        },
        password: { 
            type: String, 
            required: [true, 'Password is required'],
            minlength: [8, 'Password must be at least 8 characters long'], 
            select: false 
        },
        fullName: { 
            type: String, 
            required: [true, 'Full name is required'], 
            trim: true 
        },
        phoneNumber: { 
            type: String, 
            required: [true, 'Phone number is required'], 
            trim: true 
        },
        role: { 
            type: String, 
            enum: Object.values(UserRole), 
            default: UserRole.PLAYER 
        },
        mode: {
            type: String,
            enum: Object.values(UserMode),
            default: UserMode.PLAYER,
        },
        ownerProfile: {
            profilePhotoUrl: { type: String },
            citizenshipFrontUrl: { type: String },
            citizenshipBackUrl: { type: String },
            panNumber: { type: String, trim: true },
            address: { type: String, trim: true },
            additionalKyc: {
                type: Map,
                of: String,
                default: undefined,
            },
            status: {
                type: String,
                enum: Object.values(OwnerVerificationStatus),
                default: OwnerVerificationStatus.DRAFT,
            },
            lastSubmittedAt: { type: Date },
        },
        profileImage: { type: String },
        isActive: { 
            type: Boolean,
            default: true
        },
        refreshToken: { type: String, select: false },

    }, { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema) as mongoose.Model<IUser>;