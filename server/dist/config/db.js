"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDB = async () => {
    try {
        const connStr = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/collection_crm';
        console.log(`[DB] Attempting connection to MongoDB...`);
        const conn = await mongoose_1.default.connect(connStr, {
            serverSelectionTimeoutMS: 5000
        });
        console.log(`[DB] MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.warn(`[DB Warning] MongoDB Connection failed: ${error.message}`);
        console.warn(`[DB Warning] App running in Standalone / Demo Mode or waiting for MongoDB service.`);
    }
};
exports.connectDB = connectDB;
