import {UserRole} from './common.types.js';
export interface CreateUserDto{
    email:string;
    password:string;
    fullName:string;
    phonrNumber:string;
    role:UserRole;
}

export interface LoginDto{
    email:string;
    password:string;
}

export interface AuthTokens{
    accessToken:string;
    refreshToken:string;
}

export interface JwtPayload{
    id:string;
    email:string;
    role:UserRole;
}

export interface UpdateUserDto{
    fullName?:string;
    phoneNumber?:string;
    profileImage?:string;
}