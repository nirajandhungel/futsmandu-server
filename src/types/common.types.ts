export enum UserRole{
    PLAYER = 'PLAYER',
    OWNER = 'OWNER',
    ADMIN = 'ADMIN'
}

export enum UserMode{
    PLAYER = 'PLAYER',
    OWNER = 'OWNER',
    ADMIN = 'ADMIN'
}

export enum OwnerVerificationStatus{
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    INACTIVE = 'INACTIVE'
}

export enum BookingStatus {
    PENDING = 'PENDING',
    CONFIRMED= 'CONFIRMED',
    CANCELLED = 'CANCELLED',
    COMPLETED = 'COMPLETED'
}

export enum BookingType{
    FULL_TEAM = 'FULL_TEAM',
    PARTIAL_TEAM = 'PARTIAL_TEAM',
    SOLO = 'SOLO',
}
export interface ApiResponse<T = any>{
    success:boolean;
    message?:string;
    data?:T;
    error?:string;
    statusCode?:number;
    pagination?:PaginationInfo;
}

export interface PaginationInfo{
    page:number;
    limit:number;
    totalPages:number;
    totalItems:number;

}

export interface QueryParams{
    page?:number;
    limit?:number;
    sort?:string;
    search?:string;
    [key:string]:any
}