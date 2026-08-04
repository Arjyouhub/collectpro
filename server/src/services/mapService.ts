export interface Waypoint {
  id: string;
  customerName: string;
  address: string;
  lat: number;
  lng: number;
  totalPOS: number;
  dpd: number;
}

export class MapService {
  /**
   * Optimizes visit sequence based on nearest neighbor algorithm / distance matrix
   */
  static optimizeRoute(
    origin: { lat: number; lng: number },
    waypoints: Waypoint[]
  ): { sortedWaypoints: Waypoint[]; totalDistanceKm: number; estimatedDurationMin: number; googleNavUrl: string } {
    if (waypoints.length === 0) {
      return {
        sortedWaypoints: [],
        totalDistanceKm: 0,
        estimatedDurationMin: 0,
        googleNavUrl: ''
      };
    }

    const unvisited = [...waypoints];
    const sorted: Waypoint[] = [];
    let currentPoint = origin;
    let totalDistanceKm = 0;

    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371; // Earth radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    while (unvisited.length > 0) {
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const dist = haversine(currentPoint.lat, currentPoint.lng, unvisited[i].lat, unvisited[i].lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const nextStop = unvisited.splice(nearestIdx, 1)[0];
      sorted.push(nextStop);
      totalDistanceKm += minDistance;
      currentPoint = { lat: nextStop.lat, lng: nextStop.lng };
    }

    // Estimate duration: ~25 km/h urban speed + 15 mins per collection visit
    const estimatedDurationMin = Math.round((totalDistanceKm / 25) * 60 + sorted.length * 15);

    // Build Google Maps turn-by-turn multi-waypoint URL
    const destination = `${sorted[sorted.length - 1].lat},${sorted[sorted.length - 1].lng}`;
    const waypointsStr = sorted
      .slice(0, sorted.length - 1)
      .map(w => `${w.lat},${w.lng}`)
      .join('|');

    const googleNavUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination}${
      waypointsStr ? `&waypoints=${waypointsStr}` : ''
    }&travelmode=driving`;

    return {
      sortedWaypoints: sorted,
      totalDistanceKm: parseFloat(totalDistanceKm.toFixed(2)),
      estimatedDurationMin,
      googleNavUrl
    };
  }

  /**
   * Builds single destination Google Maps Turn-by-Turn Navigation URL
   */
  static getSingleNavigationUrl(lat: number, lng: number, address?: string): string {
    if (address) {
      return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
}
