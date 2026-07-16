import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer | null = null;

const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGO_URI;
    const dbName = process.env.MONGO_DB_NAME || 'CampusConnect';

    if (!mongoUri) {
      console.log('MONGO_URI not configured. Starting MongoDB Memory Server...');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri, { dbName: 'CampusConnect' });
      console.log('🚀 Connected to MongoDB Memory Server successfully!');
      return;
    }

    try {
      console.log('Connecting to MongoDB Atlas...');
      const conn = await mongoose.connect(mongoUri, {
        dbName,
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB Connected Successfully');
      console.log(`MongoDB Host: ${conn.connection.host}`);
    } catch (dbErr) {
      console.warn('Could not connect to MongoDB Atlas (perhaps IP whitelist blocked it). Falling back to MongoDB Memory Server...');
      mongod = await MongoMemoryServer.create();
      const uri = mongod.getUri();
      await mongoose.connect(uri, { dbName: 'CampusConnect' });
      console.log('🚀 Connected to fallback MongoDB Memory Server successfully!');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('MongoDB connection error:', message);
    process.exit(1);
  }
};

export default connectDB;
