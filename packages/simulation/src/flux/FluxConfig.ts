import type { Commodity, ResourceType, Population } from '@fluxpolis/types';

/**
 * Default configuration values for the Flux system
 */

/** Default capacity for flux connections (units) */
export const DEFAULT_FLUX_CAPACITY = 100;

/** Default capacity for worker flux connections (units) */
export const DEFAULT_WORKER_FLUX_CAPACITY = 50;

/** Default resource production rate (units per tick) */
export const DEFAULT_RESOURCE_THROUGHPUT = 10;

/** Default resource needs for districts */
export const DEFAULT_DISTRICT_NEEDS: Record<ResourceType, Commodity> = {
	food: {
		supply: 0,
		demand: 10,
	},
} as const;

/** Default population for new districts */
export const DEFAULT_DISTRICT_POPULATION: Population = {
	total: { capacity: 500, current: 250, busy: 0 },
	workers: { capacity: 350, current: 175, busy: 0 }, // 70% of total
	inactive: { capacity: 150, current: 75, busy: 0 },  // 30% of total
};

/** Default jobs for districts - local employment needs (e.g., administration, services) */
export const DEFAULT_DISTRICT_JOBS = {
	workers: {
		supply: 0,  // Initially no local jobs filled
		demand: 50, // Need 50 workers for district operations (20% of 250 population)
	},
};

/** Default worker needs for resource nodes */
export const DEFAULT_WORKER_NEEDS: Commodity = {
	supply: 0, // Filled by incoming worker fluxes
	demand: 5, // Need 5 workers to operate at full capacity
};
