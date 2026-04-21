const EARTH_RADIUS_KM = 6371;

const toRadians = (value) => (value * Math.PI) / 180;

export function haversineDistanceKm(from, to) {
  const latDiff = toRadians(to.latitude - from.latitude);
  const lngDiff = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);

  const a =
    Math.sin(latDiff / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lngDiff / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function formatDistanceKm(distanceKm) {
  return `${distanceKm.toFixed(1)} km`;
}

export async function getRoadDistanceKm() {
  // Future extension point:
  // Replace this stub with a call to your routing provider
  // (OSRM, Google Routes, Mapbox, OpenRouteService, etc.)
  // and return the road distance in kilometers.
  throw new Error("Road distance is not implemented yet.");
}
