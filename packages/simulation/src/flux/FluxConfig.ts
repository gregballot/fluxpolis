import type { Commodity, ResourceType } from '@fluxpolis/types';

/**
 * Default configuration values for the Flux system
 */

/** Default capacity for flux connections (units) */
export const DEFAULT_FLUX_CAPACITY = 100;

/** Default resource production rate (units per tick) */
export const DEFAULT_RESOURCE_THROUGHPUT = 10;

/** Default resource needs for districts */
export const DEFAULT_DISTRICT_NEEDS: Record<ResourceType, Commodity> = {
	food: {
		supply: 0,
		demand: 10,
	},
} as const;
