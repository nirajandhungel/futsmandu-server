export enum UserRole{
    PLAYER = 'PALYER',
    OWNER = 'OWNER',
    ADMIN = 'ADMIN'
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