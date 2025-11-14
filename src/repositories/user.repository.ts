import {User, IUser} from '../models/user.model.js';
import {BaseRepository} from './base.repository.js';

export class UserRepository extends BaseRepository<IUser>{
    constructor(){
        super(User);
    }

    // find user by email
    async findByEmail(email:string):Promise<IUser | null>{
        return this.model.findOne({email}).select('+password +refreshToken');
    }
    // find user by email without sensitive fields
    async findByEmailPublic(email:string):Promise<IUser | null>{
        return this.model.findOne({email});
    }

    // update user password
    async updatePassword(userId:string, newPassword:string):Promise<IUser | null>{
        const user = await this.model.findById(userId).select('+password');
        if(!user) return null;
        user.password = newPassword;
        return user.save();
        return user;
    }

    // update refresh token
    async updateRefreshToken(userId:string, refreshToken:string | null):Promise<void>{
        await this.model.findByIdAndUpdate(userId,{refreshToken});
    }

    // find user by refresh token
    async findByRefreshToken(refreshToken:string):Promise<IUser | null>{
        return this.model.findOne({refreshToken}).select('+refreshToken');
    }

    // deactivate user
    async deactivateUser(userId:string):Promise<IUser | null>{
        return this.updateById(userId,{isActive:false});
    }

    // activate user
    async activateUser(userId:string):Promise<IUser | null>{
        return this.updateById(userId,{isActive:true});
    }

    //get active users count by role
    async countByRole(role:string):Promise<number>{
        return this.count({role,isActive:true});
    }
}