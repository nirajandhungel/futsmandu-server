import mongoose from 'mongoose';
import{config} from './environment.js';
import logger from '../utils/logger.js'

export const connectDatabase=async():Promise<void>=>{
    try{
        mongoose.set('strictQuery',false);
        await mongoose.connect(config.mongodb.uri);
        logger.info('Database connected successfully');

        mongoose.connection.on('error',(err)=>{
            logger.error(`Database connection error: ${err}`);
        });

        mongoose.connection.on('disconnected',()=>{
            logger.warn('Mongodb disconnected. Attempting to reconnect...');
        });

    }catch(error){
        logger.error(`Database connection failed: ${error}`);
        process.exit(1);
    }
}

