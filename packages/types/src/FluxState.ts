import type { ResourceType } from './ResourceNodeState';

/**
 * Represents a flow connection between two places
 */
export interface FluxState {
	id: string;
	sourceId: string; // Place ID (resource node for now)
	destinationId: string; // Place ID (district for now)
	resourceType: ResourceType;
	capacity: number; // Max units that can flow
	content: number; // Current units in transit
	distance: number; // Cached distance in meters
}
