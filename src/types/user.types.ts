import type {Express} from 'express';
import {OwnerVerificationStatus, UserMode, UserRole} from './common.types.js';
export interface CreateUserDto{
    email:string;
    password:string;
    fullName:string;
    phoneNumber:string;
    role?:UserRole;
}

export interface LoginDto{
    email:string;
    password:string;
    role:UserRole;
}

export interface AuthTokens{
    accessToken:string;
    refreshToken:string;
}

export interface JwtPayload{
    id:string;
    email:string;
    role:UserRole;
    mode:UserMode;
    ownerStatus?:OwnerVerificationStatus;
}

export interface UpdateUserDto{
    fullName?:string;
    phoneNumber?:string;
    profileImage?:string;
}

export interface OwnerProfile{
    profilePhotoUrl:string;
    citizenshipFrontUrl:string;
    citizenshipBackUrl:string;
    panNumber:string;
    address:string;
    additionalKyc?:Record<string,string> | Map<string,string>;
    status:OwnerVerificationStatus;
    lastSubmittedAt?:Date;
}

export interface OwnerActivationDto{
    panNumber:string;
    address:string;
    additionalKyc?:Record<string,string>;
}

export interface OwnerDocumentsUpload{
    profilePhoto?:Express.Multer.File[];
    citizenshipFront?:Express.Multer.File[];
    citizenshipBack?:Express.Multer.File[];
}

export interface ModeSwitchResponse{
    user:any;
    tokens:AuthTokens;
}