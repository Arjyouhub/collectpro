"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutes = apiRoutes;
const authController_1 = require("../controllers/authController");
const caseController_1 = require("../controllers/caseController");
const excelController_1 = require("../controllers/excelController");
const logController_1 = require("../controllers/logController");
const mapController_1 = require("../controllers/mapController");
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
async function apiRoutes(fastify) {
    // Health check
    fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date() }));
    // Auth Public Routes
    fastify.post('/auth/register', authController_1.register);
    fastify.post('/auth/login', authController_1.login);
    // Authenticated Routes Group
    fastify.register(async (protectedRoutes) => {
        protectedRoutes.addHook('onRequest', authMiddleware_1.authenticate);
        // Auth & Profile
        protectedRoutes.get('/auth/profile', authController_1.getProfile);
        // Cases
        protectedRoutes.get('/cases', caseController_1.getCases);
        protectedRoutes.get('/cases/:id', caseController_1.getCaseById);
        protectedRoutes.post('/cases', caseController_1.createCase);
        protectedRoutes.put('/cases/:id', caseController_1.updateCase);
        protectedRoutes.delete('/cases/:id', caseController_1.deleteCase);
        protectedRoutes.post('/cases/:id/ai-analyze', caseController_1.analyzeCaseAI);
        // Excel Import
        protectedRoutes.post('/excel/preview', excelController_1.previewExcel);
        protectedRoutes.post('/excel/commit', excelController_1.commitExcel);
        // Logs & PTP
        protectedRoutes.post('/logs/call', logController_1.addCallLog);
        protectedRoutes.post('/logs/visit', logController_1.addVisitLog);
        // Map & Route Optimization
        protectedRoutes.post('/map/optimize', mapController_1.optimizeVisitRoute);
        // Analytics Dashboard
        protectedRoutes.get('/analytics/dashboard', analyticsController_1.getDashboardStats);
    });
}
