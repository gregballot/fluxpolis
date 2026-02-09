export type FlowType = 'food' | 'workers' | 'local-jobs';

/**
 * Represents a flow connection between two places
 */
export interface FluxState {
	id: string;
	sourceId: string; // Place ID (source of the flow)
	destinationId: string; // Place ID (destination of the flow)
	flowType: FlowType;
	capacity: number; // Max units that can flow
	content: number; // Current units in transit
	distance: number; // Cached distance in meters
}
