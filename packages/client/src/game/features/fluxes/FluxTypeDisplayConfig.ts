import type { FlowType } from '@fluxpolis/types';

/**
 * Client-layer configuration for flux type presentation.
 * Contains rendering metadata (colors, display names, etc.)
 * with no game logic concerns.
 */
export interface FluxTypeDisplayConfig {
	flowType: FlowType;
	renderColor: number; // Hex color for rendering
	displayName: string;
}

/**
 * Display configuration for all flux types.
 * TypeScript enforces complete Record coverage.
 */
export const FLUX_TYPE_DISPLAY_CONFIGS: Record<FlowType, FluxTypeDisplayConfig> = {
	food: {
		flowType: 'food',
		renderColor: 0xffaa00, // Orange
		displayName: 'Food',
	},
	workers: {
		flowType: 'workers',
		renderColor: 0xff6666, // Red
		displayName: 'Workers',
	},
};

/**
 * Get display configuration for a specific flow type
 */
export function getFluxTypeDisplayConfig(flowType: FlowType): FluxTypeDisplayConfig {
	return FLUX_TYPE_DISPLAY_CONFIGS[flowType];
}
