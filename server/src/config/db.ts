import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    let connStr = (process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collection_crm').trim();
    
    // Automatically sanitize and strip any accidental 'MONGO_URI=' prefix from environment variables
    while (connStr.startsWith('MONGO_URI=')) {
      connStr = connStr.replace('MONGO_URI=', '').trim();
    }

    console.log(`[DB] Attempting connection to MongoDB...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 8000
    });
    console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
  } catch (error: any) {
    console.warn(`[DB Warning] MongoDB Connection failed: ${error.message}`);
    console.warn(`[DB Warning] App running in Standalone / Demo Mode or waiting for MongoDB service.`);
  }
};
