// __tests__/unit/haversine-geofencing.test.ts
// Unit tests for Haversine distance formula used in attendance geofencing

/**
 * Haversine formula — extracted from /api/attendance/clock/route.ts
 * Calculates the great-circle distance between two points on Earth
 */
function calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371e3; // Earth radius in metres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // distance in meters
}

function isWithinRadius(
    branchLat: number, branchLon: number,
    userLat: number, userLon: number,
    maxRadius: number
): boolean {
    const distance = calculateDistance(branchLat, branchLon, userLat, userLon);
    return distance <= maxRadius;
}

describe('Haversine Geofencing', () => {

    // Known coordinate: Branch Jakarta (~-6.175, 106.827)
    const BRANCH_LAT = -6.175;
    const BRANCH_LON = 106.827;

    describe('calculateDistance()', () => {
        it('should return 0 for the same point', () => {
            const distance = calculateDistance(BRANCH_LAT, BRANCH_LON, BRANCH_LAT, BRANCH_LON);
            expect(distance).toBeCloseTo(0, 1);
        });

        it('should calculate ~111km for 1 degree latitude difference', () => {
            // 1 degree latitude ≈ 111 km
            const distance = calculateDistance(0, 0, 1, 0);
            expect(distance).toBeGreaterThan(110000);
            expect(distance).toBeLessThan(112000);
        });

        it('should calculate known distance: Jakarta to Bandung (~150km)', () => {
            // Jakarta: -6.175, 106.827
            // Bandung: -6.914, 107.609
            const distance = calculateDistance(-6.175, 106.827, -6.914, 107.609);
            expect(distance).toBeGreaterThan(110000);
            expect(distance).toBeLessThan(160000);
        });

        it('should handle negative latitudes correctly (Southern Hemisphere)', () => {
            const distance = calculateDistance(-6.0, 106.0, -7.0, 106.0);
            expect(distance).toBeGreaterThan(110000); // ~111 km
        });

        it('should handle very small distances (~10m apart)', () => {
            // ~10m offset in latitude (0.00009 degrees ≈ 10m)
            const distance = calculateDistance(BRANCH_LAT, BRANCH_LON, BRANCH_LAT + 0.00009, BRANCH_LON);
            expect(distance).toBeGreaterThan(5);
            expect(distance).toBeLessThan(15);
        });
    });

    describe('isWithinRadius()', () => {
        it('should return true when user is at the same location', () => {
            expect(isWithinRadius(BRANCH_LAT, BRANCH_LON, BRANCH_LAT, BRANCH_LON, 100)).toBe(true);
        });

        it('should return true when user is ~50m away (within 100m radius)', () => {
            // ~50m north offset
            const userLat = BRANCH_LAT + 0.00045;
            expect(isWithinRadius(BRANCH_LAT, BRANCH_LON, userLat, BRANCH_LON, 100)).toBe(true);
        });

        it('should return false when user is ~500m away (outside 100m radius)', () => {
            // ~500m north offset
            const userLat = BRANCH_LAT + 0.0045;
            expect(isWithinRadius(BRANCH_LAT, BRANCH_LON, userLat, BRANCH_LON, 100)).toBe(false);
        });

        it('should return true when user is exactly at boundary', () => {
            // Calculate a point exactly at the max radius boundary
            // For 100m: ~0.0009 degrees latitude
            const userLat = BRANCH_LAT + 0.0009;
            const distance = calculateDistance(BRANCH_LAT, BRANCH_LON, userLat, BRANCH_LON);
            // Check the boundary condition is within 100m
            const result = isWithinRadius(BRANCH_LAT, BRANCH_LON, userLat, BRANCH_LON, Math.ceil(distance));
            expect(result).toBe(true);
        });

        it('should work with custom radius (200m)', () => {
            // ~150m away should be within 200m
            const userLat = BRANCH_LAT + 0.00135;
            expect(isWithinRadius(BRANCH_LAT, BRANCH_LON, userLat, BRANCH_LON, 200)).toBe(true);
        });

        it('should work with very small radius (10m)', () => {
            // ~5m away should be within 10m
            const userLat = BRANCH_LAT + 0.000045;
            expect(isWithinRadius(BRANCH_LAT, BRANCH_LON, userLat, BRANCH_LON, 10)).toBe(true);

            // ~20m away should be outside 10m
            const farLat = BRANCH_LAT + 0.00018;
            expect(isWithinRadius(BRANCH_LAT, BRANCH_LON, farLat, BRANCH_LON, 10)).toBe(false);
        });
    });
});
