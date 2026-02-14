/**
 * Configuration constants for district growth system
 */

export const GROWTH_CONFIG = {
	// Timing
	GROWTH_INTERVAL_TICKS: 10,

	// Spatial growth
	GROWTH_DISTANCE: 500,
	MIN_ANGLE_DEGREES: 30,
	COLLISION_MARGIN: 3,

	// Size limits
	MAX_AREA: 50_000_000,

	// Density fallback
	DEFAULT_DENSITY: 100,
	MAX_DENSITY: 1000,
	DENSITY_GROWTH_AMOUNT: 50,

	// Visual
	DENSITY_DARKENING_FACTOR: 2000,
} as const;
