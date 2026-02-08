import type { PlaceState } from '@fluxpolis/types';

/**
 * Abstract base class for spatial entities that can be connected by Fluxes.
 * Provides shared behavior for position and distance calculations.
 *
 * @typeParam TState - The specific state interface (defaults to PlaceState for generic usage)
 */
export abstract class Place<TState extends PlaceState = PlaceState> {
	readonly state: TState;

	constructor(state: TState) {
		this.state = state;
	}

	get id(): string {
		return this.state.id;
	}

	get x(): number {
		return this.state.x;
	}

	get y(): number {
		return this.state.y;
	}

	get placeType(): string {
		return this.state.placeType;
	}

	/**
	 * Calculate Euclidean distance to another place
	 */
	distanceTo(other: Place): number {
		const dx = this.x - other.x;
		const dy = this.y - other.y;
		return Math.hypot(dx, dy);
	}
}
