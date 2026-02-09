import type { FlowType } from '@fluxpolis/types';

/**
 * Client-side component for flux rendering.
 * Stores flux data with denormalized positions to avoid cross-entity lookups during rendering.
 */
export interface FluxState {
	id: string;
	sourceId: string;
	destinationId: string;
	sourceX: number;
	sourceY: number;
	destX: number;
	destY: number;
	flowType: FlowType;
	capacity: number;
	content: number;
}

export const FLUX_STATE = 'FluxState';
