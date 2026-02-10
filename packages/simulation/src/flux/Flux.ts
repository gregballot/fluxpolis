import type { FluxState, FlowType } from '@fluxpolis/types';

/**
 * Flux represents a flow connection between two places (e.g., resource node → district)
 */
export class Flux {
	readonly state: FluxState;

	constructor(
		id: string,
		sourceId: string,
		destinationId: string,
		flowType: FlowType,
		distance: number,
		capacity: number,
	) {
		this.state = {
			id,
			sourceId,
			destinationId,
			flowType,
			capacity,
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

	get flowType(): FlowType {
		return this.state.flowType;
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

	/**
	 * Add content to the flux from source (up to capacity)
	 * Returns amount actually added
	 */
	addContent(amount: number): number {
		const available = this.capacity - this.content;
		const toAdd = Math.min(amount, available);
		this.state.content += toAdd;
		return toAdd;
	}

	/**
	 * Remove content from flux (delivery to destination)
	 * Returns amount removed
	 */
	removeContent(amount: number): number {
		const toRemove = Math.min(amount, this.content);
		this.state.content -= toRemove;
		return toRemove;
	}

	/**
	 * Check if flux has content to deliver
	 */
	hasContent(): boolean {
		return this.content > 0;
	}

	/**
	 * Check if flux has room for more content
	 */
	hasCapacity(): boolean {
		return this.content < this.capacity;
	}
}
