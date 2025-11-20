import {UserRole, UserMode, OwnerVerificationStatus} from './common.types.js';
declare global{
    namespace Express{
        interface Request{
            user?:{
                id:string;
                email:string;
                role:UserRole;
                mode:UserMode;
                ownerStatus?:OwnerVerificationStatus;
            };
        }
    }
}

export {};