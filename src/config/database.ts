import mongoose from 'mongoose';
import { config } from './environment.js';
import logger from '../utils/logger.js';

const DEFAULT_RECONNECT_INTERVAL = 5000; // 5 seconds
const MAX_RECONNECT_ATTEMPTS = 10;

export class DatabaseConnection {
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  public async connect(): Promise<void> {
    try {
      mongoose.set('strictQuery', false);
      
      // Set connection options
      const options: mongoose.ConnectOptions = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 30000,
      };

      await mongoose.connect(config.mongodb.uri, options);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      logger.info('Database connected successfully', {
        database: mongoose.connection.db?.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port
      });

      this.setupEventHandlers();

    } catch (error) {
      logger.error('Database connection failed', { error });
      await this.handleConnectionFailure();
      throw error;
    }
  }

  private setupEventHandlers(): void {
    mongoose.connection.on('error', (error: any) => {
      logger.error('Database connection error', { error });
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('Database disconnected');
      this.isConnected = false;
      this.handleReconnection();
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('Database reconnected successfully');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    mongoose.connection.on('connected', () => {
      logger.debug('Database connection established');
      this.isConnected = true;
    });
  }

  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      logger.error('Maximum reconnection attempts reached. Giving up.');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;
      logger.warn(`Attempting to reconnect to database (attempt ${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
      
      try {
        await mongoose.connect(config.mongodb.uri);
      } catch (error) {
        logger.error('Database reconnection attempt failed', { 
          attempt: this.reconnectAttempts,
          error 
        });
        await this.handleReconnection();
      }
    }, DEFAULT_RECONNECT_INTERVAL);
  }

  private async handleConnectionFailure(): Promise<void> {
    if (this.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      logger.warn('Will attempt to reconnect to database...');
      await this.handleReconnection();
    } else {
      logger.error('Maximum connection attempts reached. Application may not function correctly.');
    }
  }

  public async disconnect(): Promise<void> {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    try {
      await mongoose.connection.close();
      logger.info('Database connection closed successfully');
    } catch (error) {
      logger.error('Error closing database connection', { error });
      throw error;
    }
  }

  public getConnectionStatus(): boolean {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
}

// Create singleton instance
export const databaseConnection = new DatabaseConnection();

// Export connect function for backward compatibility
export const connectDatabase = (): Promise<void> => databaseConnection.connect();
export const disconnectDatabase = (): Promise<void> => databaseConnection.disconnect();