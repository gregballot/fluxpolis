import type { PlaceType } from './PlaceType';

/**
 * Default physical radius for each place type (in meters).
 * Used for collision detection and spatial queries.
 */
export const PLACE_RADIUS: Record<PlaceType, number> = {
	'district': 1500,        // 1.5 km
	'resource-node': 1000,   // 1 km
} as const;
