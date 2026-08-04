"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const cookie_1 = __importDefault(require("@fastify/cookie"));
const multipart_1 = __importDefault(require("@fastify/multipart"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const apiRoutes_1 = require("./routes/apiRoutes");
dotenv_1.default.config();
const app = (0, fastify_1.default)({
    logger: {
        level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
    }
});
async function start() {
    try {
        // Connect Database
        await (0, db_1.connectDB)();
        // Register Plugins
        await app.register(cors_1.default, {
            origin: true,
            credentials: true
        });
        await app.register(jwt_1.default, {
            secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-32-chars-minimum'
        });
        await app.register(cookie_1.default);
        await app.register(multipart_1.default, {
            limits: {
                fileSize: 50 * 1024 * 1024 // 50MB max file upload
            }
        });
        // Register Routes
        await app.register(apiRoutes_1.apiRoutes, { prefix: '/api' });
        const port = Number(process.env.PORT) || 5000;
        const host = process.env.HOST || '0.0.0.0';
        await app.listen({ port, host });
        console.log(`🚀 Collection CRM Server running on http://localhost:${port}`);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
}
start();
