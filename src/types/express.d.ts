import {UserRole} from './common.types.ts';
declare global{
    namespace Express{
        interface Request{
            user?:{
                id:string;
                email:string;
                role:UserRole;
            };
        }
    }
}