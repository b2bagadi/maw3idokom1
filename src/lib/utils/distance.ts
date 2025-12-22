/**
 * Calculate distance between two coordinates using the Haversine formula
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) *
        Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return Math.round(distance * 10) / 10; // Round to 1 decimal
}

function toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
}

/**
 * Filter businesses by distance from a given location
 */
export function filterByDistance<T extends { lat?: number | null; lng?: number | null }>(
    items: T[],
    centerLat: number,
    centerLng: number,
    maxDistanceKm: number
): Array<T & { distance: number }> {
    return items
        .filter((item) => item.lat != null && item.lng != null && typeof item.lat === 'number' && typeof item.lng === 'number')
        .map((item) => ({
            ...item,
            distance: calculateDistance(centerLat, centerLng, item.lat as number, item.lng as number),
        }))
        .filter((item) => item.distance <= maxDistanceKm)
        .sort((a, b) => a.distance - b.distance);
}
