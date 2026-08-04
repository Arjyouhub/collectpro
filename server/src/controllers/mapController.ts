import { FastifyRequest, FastifyReply } from 'fastify';
import Case from '../models/Case';
import { MapService, Waypoint } from '../services/mapService';

export async function optimizeVisitRoute(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (request.user as any).id;
    const { originLat, originLng, caseIds } = request.body as any;

    if (!originLat || !originLng) {
      return reply.status(400).send({ error: 'Origin coordinates (originLat, originLng) are required' });
    }

    let query: any = { user: userId };
    if (Array.isArray(caseIds) && caseIds.length > 0) {
      query._id = { $in: caseIds };
    }

    const cases = await Case.find(query).limit(50).lean();

    const waypoints: Waypoint[] = cases.map(c => ({
      id: c._id.toString(),
      customerName: c.customerName,
      address: c.address,
      lat: c.location?.coordinates?.[1] || 28.6139 + (Math.random() - 0.5) * 0.05,
      lng: c.location?.coordinates?.[0] || 77.209 + (Math.random() - 0.5) * 0.05,
      totalPOS: c.totalPOS,
      dpd: c.dpd
    }));

    const result = MapService.optimizeRoute(
      { lat: Number(originLat), lng: Number(originLng) },
      waypoints
    );

    return reply.send({
      message: 'Route optimized successfully',
      route: result
    });
  } catch (error: any) {
    return reply.status(500).send({ error: 'Route optimization failed', message: error.message });
  }
}
