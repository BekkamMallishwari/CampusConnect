import mongoose from 'mongoose';

const sanitizeUri = (uri: string): string => {
  try {
    return uri
      .replace(/\/\/(.*):(.*)@/, (_match, user) => `//${user}:****@`)
      .replace(/([?&])authSource=[^&]*(&|$)/, '$1')
      .replace(/[?&]$/, '');
  } catch {
    return '[Protected URI]';
  }
};

const setupMongooseListeners = (): void => {
  mongoose.connection.on('connecting', () => {
    console.log('📡 [Mongoose Event] Connecting to MongoDB...');
  });

  mongoose.connection.on('connected', () => {
    console.log('📡 [Mongoose Event] Connected to MongoDB database instance');
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ [Mongoose Event] Database connection error:', err?.message || err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ [Mongoose Event] Disconnected from MongoDB');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 [Mongoose Event] Reconnected to MongoDB');
  });
};

// Register connection event listeners once
setupMongooseListeners();

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('❌ MONGO_URI is missing in environment variables. Database connection aborted.');
    process.exit(1);
  }

  const sanitized = sanitizeUri(mongoUri);
  const dbName = process.env.MONGO_DB_NAME || 'CampusConnect';

  console.log(`🔗 Initiating connection to MongoDB Atlas (${sanitized})...`);
  console.log(`   Target Database: ${dbName}`);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`⏳ Attempt ${attempt}/${MAX_RETRIES}: Starting connection...`);
      const conn = await mongoose.connect(mongoUri, {
        dbName,
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
        maxPoolSize: 10,
        // MongoDB Atlas requires Server API to prevent legacy wire protocol commands
        // which could otherwise cause "SSL alert number 80" TLS drops on modern clusters.
        serverApi: {
          version: '1',
          strict: true,
          deprecationErrors: true,
        },
      });

      console.log(`✅ MongoDB Atlas Connected Successfully (Attempt ${attempt}/${MAX_RETRIES})`);
      console.log(`   Database : ${conn.connection.name}`);
      console.log(`   Host     : ${conn.connection.host}`);
      return;
    } catch (err: any) {
      console.error(`❌ MongoDB Atlas connection attempt ${attempt}/${MAX_RETRIES} failed:`, err?.message || err);

      if (attempt < MAX_RETRIES) {
        console.log(`⏱️ Retrying connection in ${RETRY_DELAY_MS / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error('\n============================ MONGODB CONNECTION DIAGNOSTICS ============================');
        console.error('❌ Failed to connect to MongoDB Atlas after multiple retries.');
        console.error('🔍 Common Causes & Solutions:');
        console.error('   1. IP Whitelist (ReplicaSetNoPrimary / ServerSelectionError):');
        console.error('      - Log into MongoDB Atlas (https://cloud.mongodb.com)');
        console.error('      - Go to Security > Network Access');
        console.error('      - Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0) or add current IP.');
        console.error('   2. MONGO_URI Format & Credentials:');
        console.error('      - Verify username & password in MONGO_URI.');
        console.error('      - Use a standard MongoDB SRV connection string with your own credentials and cluster host.');
        console.error('   3. Database User Permissions:');
        console.error('      - In Atlas, go to Security > Database Access');
        console.error('      - Ensure database user has readWriteAnyDatabase or readWrite permissions on CampusConnect.');
        console.error('=======================================================================================\n');

        throw err;
      }
    }
  }
};

export default connectDB;
