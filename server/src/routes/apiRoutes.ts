import { FastifyInstance } from 'fastify';
import { register, login, getProfile } from '../controllers/authController';
import { getCases, getCaseById, createCase, updateCase, deleteCase, analyzeCaseAI } from '../controllers/caseController';
import { previewExcel, commitExcel } from '../controllers/excelController';
import { addCallLog, addVisitLog } from '../controllers/logController';
import { optimizeVisitRoute } from '../controllers/mapController';
import { getDashboardStats } from '../controllers/analyticsController';
import { authenticate } from '../middleware/authMiddleware';

export async function apiRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));

  // Auth Public Routes
  fastify.post('/auth/register', register);
  fastify.post('/auth/login', login);

  // Authenticated Routes Group
  fastify.register(async (protectedRoutes) => {
    protectedRoutes.addHook('onRequest', authenticate);

    // Auth & Profile
    protectedRoutes.get('/auth/profile', getProfile);

    // Cases
    protectedRoutes.get('/cases', getCases);
    protectedRoutes.get('/cases/:id', getCaseById);
    protectedRoutes.post('/cases', createCase);
    protectedRoutes.put('/cases/:id', updateCase);
    protectedRoutes.delete('/cases/:id', deleteCase);
    protectedRoutes.post('/cases/:id/ai-analyze', analyzeCaseAI);

    // Excel Import
    protectedRoutes.post('/excel/preview', previewExcel);
    protectedRoutes.post('/excel/commit', commitExcel);

    // Logs & PTP
    protectedRoutes.post('/logs/call', addCallLog);
    protectedRoutes.post('/logs/visit', addVisitLog);

    // Map & Route Optimization
    protectedRoutes.post('/map/optimize', optimizeVisitRoute);

    // Analytics Dashboard
    protectedRoutes.get('/analytics/dashboard', getDashboardStats);
  });
}
