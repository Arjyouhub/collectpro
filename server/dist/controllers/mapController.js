"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizeVisitRoute = optimizeVisitRoute;
const Case_1 = __importDefault(require("../models/Case"));
const mapService_1 = require("../services/mapService");
async function optimizeVisitRoute(request, reply) {
    try {
        const userId = request.user.id;
        const { originLat, originLng, caseIds } = request.body;
        if (!originLat || !originLng) {
            return reply.status(400).send({ error: 'Origin coordinates (originLat, originLng) are required' });
        }
        let query = { user: userId };
        if (Array.isArray(caseIds) && caseIds.length > 0) {
            query._id = { $in: caseIds };
        }
        const cases = await Case_1.default.find(query).limit(50).lean();
        const waypoints = cases.map(c => ({
            id: c._id.toString(),
            customerName: c.customerName,
            address: c.address,
            lat: c.location?.coordinates?.[1] || 28.6139 + (Math.random() - 0.5) * 0.05,
            lng: c.location?.coordinates?.[0] || 77.209 + (Math.random() - 0.5) * 0.05,
            totalPOS: c.totalPOS,
            dpd: c.dpd
        }));
        const result = mapService_1.MapService.optimizeRoute({ lat: Number(originLat), lng: Number(originLng) }, waypoints);
        return reply.send({
            message: 'Route optimized successfully',
            route: result
        });
    }
    catch (error) {
        return reply.status(500).send({ error: 'Route optimization failed', message: error.message });
    }
}
