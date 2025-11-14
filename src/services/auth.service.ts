import jwt from 'jsonwebtoken';


import {UserRepository} from '../repositories/user.repository.js';
import {CreateUserDto, LoginDto, AuthTokens, JwtPayload} from '../types/user.types.js';
import{config} from '../config/environment.js';
import { ERROR_MESSAGES } from '../config/constants.js';

export class AuthService{
    private userRepository:UserRepository;

    constructor(){
        this.userRepository = new UserRepository();
    }

    // register a new user
    async register(userData:CreateUserDto){

        // check if user already exists
        const existingUser = await this.userRepository.findByEmail(userData.email);
        if(existingUser){
            throw new Error(ERROR_MESSAGES.EMAIL_EXISTS);
        }

        const newUser = await this.userRepository.create(userData);
        //generate tokens
        const tokens = this.generateTokens({
            id:newUser._id.toString(),
            email:newUser.email,
            role:newUser.role,
        });

        //save refresh token 
        await this.userRepository.updateRefreshToken(newUser._id.toString(),tokens.refreshToken);
        return {user:{
            id:newUser._id.toString(),
            email:newUser.email,
            role:newUser.role,
            fullName:newUser.fullName,
        }, tokens};
    }

    // login user
    async login(credentials:LoginDto){

        //find user with password
        const user = await this.userRepository.findByEmail(credentials.email);
        if(!user || !user.isActive){
            throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }

        //validate password
        const isPasswordValid = await user.comparePassword(credentials.password);
        if(!isPasswordValid){
            throw new Error(ERROR_MESSAGES.INVALID_CREDENTIALS);
        }
        
        //generate tokens
        const tokens = this.generateTokens({
            id:user._id.toString(),
            email:user.email,
            role:user.role,
        });

        //save refresh token
        await this.userRepository.updateRefreshToken(user._id.toString(),tokens.refreshToken);
        return {
            user:{
                id:user._id.toString(),
                email:user.email,
                role:user.role,
            }, tokens};
    }

    // logout user
    async logout(userId:string):Promise<void>   {
        await this.userRepository.updateRefreshToken(userId,null);
    }

    //refresh access token
    async refreshToken(refreshToken:string){
        //verify refresh token
        let decoded:JwtPayload;
        try{
            decoded = jwt.verify(refreshToken,config.jwt.refreshSecret) as JwtPayload;
            // find user
            const user = await this.userRepository.findByRefreshToken(refreshToken);

            // if user not found or inactive
            if(!user || !user.isActive){
                throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
            }

            // generate new tokens
            const tokens = this.generateTokens({
                id:user._id.toString(),
                email:user.email,
                role:user.role,
            });
            //update refresh token
            await this.userRepository.updateRefreshToken(user._id.toString(),tokens.refreshToken);
            return tokens;

        }catch{
            throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
        }
    }
    
    // generate access and refresh tokens
    private generateTokens(payload:JwtPayload):AuthTokens{
        const accessToken = jwt.sign(payload,config.jwt.secret,{
            expiresIn:config.jwt.expiresIn,
        });

        const refreshToken = jwt.sign(payload,config.jwt.refreshSecret,{
            expiresIn:config.jwt.refreshExpiresIn,
        });
        
        return {accessToken, refreshToken};
    }

    // verify token
    verifyToken(token:string):JwtPayload{
        try{
            const decoded = jwt.verify(token,config.jwt.secret) as JwtPayload;
            return decoded;
        }catch{
            throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
        }
    }
}

