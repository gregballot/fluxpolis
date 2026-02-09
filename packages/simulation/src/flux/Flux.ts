import type { FluxState, ResourceType } from '@fluxpolis/types';
import { DEFAULT_FLUX_CAPACITY } from './FluxConfig';

/**
 * Flux represents a flow connection between two places (e.g., resource node → district)
 */
export class Flux {
	readonly state: FluxState;

	constructor(
		id: string,
		sourceId: string,
		destinationId: string,
		resourceType: ResourceType,
		distance: number,
	) {
		this.state = {
			id,
			sourceId,
			destinationId,
			resourceType,
			capacity: DEFAULT_FLUX_CAPACITY,
			content: 0,
			distance,
		};
	}

	get id(): string {
		return this.state.id;
	}

	get sourceId(): string {
		return this.state.sourceId;
	}

	get destinationId(): string {
		return this.state.destinationId;
	}

	get resourceType(): ResourceType {
		return this.state.resourceType;
	}

	get capacity(): number {
		return this.state.capacity;
	}

	get content(): number {
		return this.state.content;
	}

	get distance(): number {
		return this.state.distance;
	}
}
