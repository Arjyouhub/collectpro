import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { apiRoutes } from './routes/apiRoutes';

dotenv.config();

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
  }
});

async function start() {
  try {
    // Connect Database
    await connectDB();

    // Register Plugins
    await app.register(cors, {
      origin: true,
      credentials: true
    });

    await app.register(jwt, {
      secret: process.env.JWT_SECRET || 'super-secret-jwt-key-change-in-production-32-chars-minimum'
    });

    await app.register(cookie);

    await app.register(multipart, {
      limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max file upload
      }
    });

    // Register Routes
    await app.register(apiRoutes, { prefix: '/api' });

    const port = Number(process.env.PORT) || 5000;
    const host = process.env.HOST || '0.0.0.0';

    await app.listen({ port, host });
    console.log(`🚀 Collection CRM Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
