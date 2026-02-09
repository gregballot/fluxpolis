import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import type { ResourceNodeState, ResourceType } from '@fluxpolis/types';
import { EVENTS } from '@fluxpolis/events';
import { Logger } from '../Logger';

import { Flux } from './Flux';
import type { PlaceRegistry } from '../places/PlaceRegistry';
import { DEFAULT_INFLUENCE_RADIUS } from '../places/PlaceConfig';

/**
 * Manages Flux entities that represent resource/worker flows between places.
 * Listens to place creation events and automatically creates fluxes to nearby places.
 */
export class FluxManager implements IManager {
	private fluxes = new Map<string, Flux>();
	private nextId = 1;

	constructor(
		private events: TypedEventBus,
		private placeRegistry: PlaceRegistry,
	) {
		// Listen to district creation to auto-create fluxes
		this.events.on(EVENTS.SIMULATION_DISTRICTS_NEW, (data) => {
			this.createFluxesForNewPlace(data.district.id);
		});

		// Future: listen to resource node creation if needed
		// For now, districts are created after resource nodes, so this handles the flow
	}

	/**
	 * Create fluxes linking a newly placed place to nearby places within influence radius.
	 * For now: creates unidirectional fluxes from ResourceNodes → Districts
	 */
	private createFluxesForNewPlace(placeId: string): void {
		// Get the place from registry
		const allPlaces = this.placeRegistry.getAll();
		const newPlace = allPlaces.find((p) => p.id === placeId);

		if (!newPlace) {
			Logger.warn(`FluxManager: Place ${placeId} not found in registry`);
			return;
		}

		// Find nearby places within influence radius
		const nearbyPlaces = this.placeRegistry.getNearbyPlaces(
			newPlace,
			DEFAULT_INFLUENCE_RADIUS,
		);

		if (nearbyPlaces.length === 0) {
			Logger.info(`Flux: No nearby places for ${placeId}`);
			return;
		}

		// Create fluxes based on place types
		for (const nearbyPlace of nearbyPlaces) {
			// For issue #36: only create ResourceNode → District fluxes
			if (
				nearbyPlace.placeType === 'resource-node' &&
				newPlace.placeType === 'district'
			) {
				// Type assertion safe because we checked placeType above
				const resourceNodeState = nearbyPlace.state as ResourceNodeState;

				const distance = newPlace.distanceTo(nearbyPlace);
				this.createFlux(
					resourceNodeState.id,
					newPlace.id,
					resourceNodeState.type,
					distance,
				);

				Logger.info(
					`Flux created: ${resourceNodeState.type} from ${resourceNodeState.id} → ${newPlace.id} (distance: ${distance.toFixed(1)}m)`,
				);
			}
		}
	}

	/**
	 * Create a new flux between source and destination
	 */
	private createFlux(
		sourceId: string,
		destinationId: string,
		resourceType: ResourceType,
		distance: number,
	): Flux {
		const flux = new Flux(
			`flux-${this.nextId++}`,
			sourceId,
			destinationId,
			resourceType,
			distance,
		);

		this.fluxes.set(flux.id, flux);

		// Emit event for client layer to render
		this.events.emit(EVENTS.SIMULATION_FLUX_NEW, { flux: flux.state });

		return flux;
	}

	/**
	 * Tick simulation - future work will gradually fill fluxes based on throughput
	 */
	tick(): void {
		// Stub for issue #39 - gradual filling simulation
		// Future: simulate flow from source to destination based on throughput
	}

	getAll(): readonly Flux[] {
		return Array.from(this.fluxes.values());
	}
}
