import type { FluxState } from '@fluxpolis/types';

/**
 * Client-side ECS component for flux rendering.
 * Extends simulation FluxState with denormalized positions (omits distance).
 */
export interface FluxComponent extends Omit<FluxState, 'distance'> {
	sourceX: number;
	sourceY: number;
	destX: number;
	destY: number;
}

export const FLUX_COMPONENT = 'FluxComponent';
