import type { FlowType } from '@fluxpolis/types';

/**
 * Simulation-layer configuration for flux types.
 * Contains game logic metadata (capacity, flow rate, etc.)
 * with no presentation/rendering concerns.
 */
export interface FluxTypeConfig {
	flowType: FlowType;
	capacity: number;
}

/**
 * Configuration for all flux types.
 * TypeScript enforces complete Record coverage.
 */
export const FLUX_TYPE_CONFIGS: Record<FlowType, FluxTypeConfig> = {
	food: {
		flowType: 'food',
		capacity: 100,
	},
	workers: {
		flowType: 'workers',
		capacity: 50,
	},
};

/**
 * Get configuration for a specific flow type
 */
export function getFluxTypeConfig(flowType: FlowType): FluxTypeConfig {
	return FLUX_TYPE_CONFIGS[flowType];
}
