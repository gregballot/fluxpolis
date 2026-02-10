import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import type { FlowType } from '@fluxpolis/types';
import { EVENTS } from '@fluxpolis/events';
import { Logger } from '../Logger';

import { Flux } from './Flux';
import type { PlaceRegistry } from '../places/PlaceRegistry';
import { DEFAULT_INFLUENCE_RADIUS } from '../places/PlaceConfig';
import { getFluxTypeConfig } from './FluxTypeConfig';
import { getFluxCreationRules } from './FluxCreationRules';
import { FluxHandlerRegistry } from './handlers/FluxHandlerRegistry';
import { FoodFluxHandler } from './handlers/FoodFluxHandler';
import { WorkerFluxHandler } from './handlers/WorkerFluxHandler';

/**
 * Manages Flux entities that represent resource/worker flows between places.
 * Listens to place creation events and automatically creates fluxes to nearby places.
 */
export class FluxManager implements IManager {
	private fluxes = new Map<string, Flux>();
	private nextId = 1;
	private handlerRegistry: FluxHandlerRegistry;

	constructor(
		private events: TypedEventBus,
		private placeRegistry: PlaceRegistry,
	) {
		// Initialize handler registry
		this.handlerRegistry = new FluxHandlerRegistry();
		this.registerHandlers();

		// Listen to district creation to auto-create fluxes
		this.events.on(EVENTS.SIMULATION_DISTRICTS_NEW, (data) => {
			this.createFluxesForNewPlace(data.district.id);
		});

		// Future: listen to resource node creation if needed
		// For now, districts are created after resource nodes, so this handles the flow
	}

	/**
	 * Register all flux handlers.
	 * Adding a new flow type only requires adding a handler here.
	 */
	private registerHandlers(): void {
		this.handlerRegistry.register('food', new FoodFluxHandler(this.events));
		this.handlerRegistry.register('workers', new WorkerFluxHandler(this.events));
	}

	/**
	 * Create fluxes linking a newly placed place to nearby places within influence radius.
	 * Uses declarative rules from FluxCreationRules to determine which fluxes to create.
	 */
	private createFluxesForNewPlace(placeId: string): void {
		const newPlace = this.placeRegistry.getById(placeId);

		if (!newPlace) {
			Logger.warn(`FluxManager: Place ${placeId} not found in registry`);
			return;
		}

		// Create self-fluxes based on rules
		const selfRules = getFluxCreationRules(newPlace.placeType, newPlace.placeType, true);
		for (const rule of selfRules) {
			this.createFlux(newPlace.id, newPlace.id, rule.flowType, 0);
			Logger.info(
				`Self-flux created for ${newPlace.placeType} ${newPlace.id} (${rule.flowType})`,
			);
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

		// Create fluxes to/from nearby places based on rules
		for (const nearbyPlace of nearbyPlaces) {
			const distance = newPlace.distanceTo(nearbyPlace);

			// Forward direction: newPlace → nearbyPlace
			const forwardRules = getFluxCreationRules(
				newPlace.placeType,
				nearbyPlace.placeType,
				false,
			);

			for (const rule of forwardRules) {
				this.createFlux(newPlace.id, nearbyPlace.id, rule.flowType, distance);
				Logger.info(
					`Flux created: ${newPlace.placeType} ${newPlace.id} → ${nearbyPlace.placeType} ${nearbyPlace.id} (${rule.flowType}, ${distance}m)`,
				);
			}

			// Reverse direction: nearbyPlace → newPlace
			const reverseRules = getFluxCreationRules(
				nearbyPlace.placeType,
				newPlace.placeType,
				false,
			);

			for (const rule of reverseRules) {
				this.createFlux(nearbyPlace.id, newPlace.id, rule.flowType, distance);
				Logger.info(
					`Flux created: ${nearbyPlace.placeType} ${nearbyPlace.id} → ${newPlace.placeType} ${newPlace.id} (${rule.flowType}, ${distance}m)`,
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
		flowType: FlowType,
		distance: number,
	): Flux {
		// Get capacity from config
		const config = getFluxTypeConfig(flowType);

		const flux = new Flux(
			`flux-${this.nextId++}`,
			sourceId,
			destinationId,
			flowType,
			distance,
			config.capacity,
		);

		this.fluxes.set(flux.id, flux);

		// Emit event for client layer to render
		this.events.emit(EVENTS.SIMULATION_FLUX_NEW, { flux: flux.state });

		return flux;
	}

	/**
	 * Tick simulation - gradually fill fluxes and deliver content
	 */
	tick(): void {
		// Phase 1: Fill fluxes from sources
		for (const flux of this.fluxes.values()) {
			if (!flux.hasCapacity()) continue;

			const filled = this.fillFlux(flux);
			if (filled > 0) {
				this.events.emit(EVENTS.SIMULATION_FLUX_UPDATE, { flux: flux.state });
			}
		}

		// Phase 2: Deliver content to destinations
		for (const flux of this.fluxes.values()) {
			if (!flux.hasContent()) continue;

			const delivered = this.deliverFlux(flux);
			if (delivered > 0) {
				this.events.emit(EVENTS.SIMULATION_FLUX_UPDATE, { flux: flux.state });
			}
		}
	}

	/**
	 * Fill flux from source using registered handler
	 */
	private fillFlux(flux: Flux): number {
		const source = this.placeRegistry.getById(flux.sourceId);
		if (!source) return 0;

		const handler = this.handlerRegistry.get(flux.flowType);
		if (!handler) {
			Logger.warn(`No handler registered for flowType: ${flux.flowType}`);
			return 0;
		}

		return handler.fill(flux, source, this.placeRegistry);
	}

	/**
	 * Deliver flux content to destination using registered handler
	 */
	private deliverFlux(flux: Flux): number {
		const destination = this.placeRegistry.getById(flux.destinationId);
		if (!destination) return 0;

		const handler = this.handlerRegistry.get(flux.flowType);
		if (!handler) {
			Logger.warn(`No handler registered for flowType: ${flux.flowType}`);
			return 0;
		}

		return handler.deliver(flux, destination);
	}

	getAll(): readonly Flux[] {
		return Array.from(this.fluxes.values());
	}
}
