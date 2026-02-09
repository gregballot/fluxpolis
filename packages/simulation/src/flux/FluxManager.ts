import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import type { ResourceNodeState, FlowType, PlaceState, DistrictState } from '@fluxpolis/types';
import { EVENTS } from '@fluxpolis/events';
import { Logger } from '../Logger';

import { Flux } from './Flux';
import type { PlaceRegistry } from '../places/PlaceRegistry';
import type { Place } from '../places/Place';
import { DEFAULT_INFLUENCE_RADIUS } from '../places/PlaceConfig';
import { DEFAULT_FLUX_CAPACITY, DEFAULT_WORKER_FLUX_CAPACITY } from './FluxConfig';

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
	 * Creates bidirectional fluxes between ResourceNodes and Districts:
	 * - Food flux: ResourceNode → District
	 * - Worker flux: District → ResourceNode
	 * For districts, also creates a self-flux for local job filling:
	 * - Local jobs flux: District → District
	 */
	private createFluxesForNewPlace(placeId: string): void {
		// Get the place from registry
		const allPlaces = this.placeRegistry.getAll();
		const newPlace = allPlaces.find((p) => p.id === placeId);

		if (!newPlace) {
			Logger.warn(`FluxManager: Place ${placeId} not found in registry`);
			return;
		}

		// Create self-flux for local jobs if this is a district
		if (newPlace.placeType === 'district') {
			this.createFlux(
				newPlace.id,
				newPlace.id,
				'local-jobs',
				0, // Zero distance for self-flux
			);
			Logger.info(`Self-flux created for District ${newPlace.id} (local jobs)`);
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
			// Create bidirectional fluxes between ResourceNode and District
			if (
				nearbyPlace.placeType === 'resource-node' &&
				newPlace.placeType === 'district'
			) {
				// Type assertion safe because we checked placeType above
				const resourceNode = nearbyPlace.state as ResourceNodeState;
				const district = newPlace;

				const distance = newPlace.distanceTo(nearbyPlace);

				// Food flux: ResourceNode → District
				this.createFlux(
					resourceNode.id,
					district.id,
					'food',
					distance,
				);

				// Worker flux: District → ResourceNode
				this.createFlux(
					district.id,
					resourceNode.id,
					'workers',
					distance,
				);

				Logger.info(
					`Fluxes created between District ${district.id} ↔ ResourceNode ${resourceNode.id} (distance: ${distance}m)`,
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
		// Determine capacity based on flow type
		const capacity = (flowType === 'workers' || flowType === 'local-jobs')
			? DEFAULT_WORKER_FLUX_CAPACITY
			: DEFAULT_FLUX_CAPACITY;

		const flux = new Flux(
			`flux-${this.nextId++}`,
			sourceId,
			destinationId,
			flowType,
			distance,
			capacity,
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
	 * Fill flux from source based on flow type
	 */
	private fillFlux(flux: Flux): number {
		const source = this.placeRegistry.getById(flux.sourceId);
		if (!source) return 0;

		if (flux.flowType === 'food') {
			return this.fillFoodFlux(flux, source);
		} else if (flux.flowType === 'workers') {
			return this.fillWorkerFlux(flux, source);
		} else if (flux.flowType === 'local-jobs') {
			return this.fillLocalJobsFlux(flux, source);
		}

		return 0;
	}

	/**
	 * Fill food flux from resource node
	 */
	private fillFoodFlux(flux: Flux, source: Place<PlaceState>): number {
		if (source.placeType !== 'resource-node') return 0;

		const nodeState = source.state as ResourceNodeState;
		const production = Math.floor(nodeState.throughput * (nodeState.workerNeeds.supply / nodeState.workerNeeds.demand));

		if (production <= 0) return 0;

		// Query destination demand to cap filling
		const destination = this.placeRegistry.getById(flux.destinationId);
		if (!destination || destination.placeType !== 'district') return 0;

		const districtState = destination.state as DistrictState;
		const need = districtState.needs.food;

		// Calculate target with surplus (10% buffer, minimum 1)
		const surplus = Math.max(1, Math.ceil(need.demand * 0.1));
		const targetSupply = need.demand + surplus;

		// Stop if surplus is full (accounting for food already in transit)
		if (need.supply + flux.content >= targetSupply) return 0;

		// Cap filling to destination capacity (subtract both current supply and flux content)
		const destinationCapacity = targetSupply - (need.supply + flux.content);
		const toFill = Math.min(production, destinationCapacity);

		return flux.addContent(toFill);
	}

	/**
	 * Fill worker flux from district
	 */
	private fillWorkerFlux(flux: Flux, source: Place<PlaceState>): number {
		if (source.placeType !== 'district') return 0;

		const districtState = source.state as DistrictState;

		// Available workers = current population - workers already busy
		const availableWorkers = districtState.population.workers.current - districtState.population.workers.busy;

		if (availableWorkers <= 0) return 0;

		// Query destination demand to cap filling
		const destination = this.placeRegistry.getById(flux.destinationId);
		if (!destination || destination.placeType !== 'resource-node') return 0;

		const nodeState = destination.state as ResourceNodeState;
		const workerNeeds = nodeState.workerNeeds;

		// Calculate target with surplus (10% buffer, minimum 1)
		const surplus = Math.max(1, Math.ceil(workerNeeds.demand * 0.1));
		const targetSupply = workerNeeds.demand + surplus;

		// Stop if surplus is full (accounting for workers already in transit)
		if (workerNeeds.supply + flux.content >= targetSupply) return 0;

		// Cap filling to destination capacity (subtract both current supply and flux content)
		const destinationCapacity = targetSupply - (workerNeeds.supply + flux.content);

		// Flow rate: 10% of capacity per tick
		const flowRate = Math.floor(DEFAULT_WORKER_FLUX_CAPACITY * 0.1);
		const toAdd = Math.min(flowRate, availableWorkers, destinationCapacity);

		// Mark workers as busy (assigned to flux)
		districtState.population.workers.busy += toAdd;
		const added = flux.addContent(toAdd);

		if (added > 0) {
			this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: districtState as DistrictState });
		}

		return added;
	}

	/**
	 * Fill local jobs flux (self-flux for district internal employment)
	 */
	private fillLocalJobsFlux(flux: Flux, source: Place<PlaceState>): number {
		if (source.placeType !== 'district') return 0;

		const districtState = source.state as DistrictState;

		// Available workers = current population - workers already busy
		const availableWorkers = districtState.population.workers.current - districtState.population.workers.busy;

		if (availableWorkers <= 0) return 0;

		// Check how many local jobs still need to be filled (accounting for workers already in transit)
		const jobsNeeded = districtState.jobs.workers.demand - (districtState.jobs.workers.supply + flux.content);
		if (jobsNeeded <= 0) return 0;

		// Flow rate: 20% of capacity per tick (faster than external since it's local)
		const flowRate = Math.floor(DEFAULT_WORKER_FLUX_CAPACITY * 0.2);
		const toAdd = Math.min(flowRate, availableWorkers, jobsNeeded);

		// Mark workers as busy (assigned to local jobs flux)
		districtState.population.workers.busy += toAdd;
		const added = flux.addContent(toAdd);

		if (added > 0) {
			this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: districtState as DistrictState });
		}

		return added;
	}

	/**
	 * Deliver flux content to destination
	 */
	private deliverFlux(flux: Flux): number {
		const destination = this.placeRegistry.getById(flux.destinationId);
		if (!destination) return 0;

		if (flux.flowType === 'food') {
			return this.deliverFood(flux, destination);
		} else if (flux.flowType === 'workers') {
			return this.deliverWorkers(flux, destination);
		} else if (flux.flowType === 'local-jobs') {
			return this.deliverLocalJobs(flux, destination);
		}

		return 0;
	}

	/**
	 * Deliver food to district
	 */
	private deliverFood(flux: Flux, destination: Place<PlaceState>): number {
		if (destination.placeType !== 'district') return 0;

		const districtState = destination.state as DistrictState;
		const need = districtState.needs.food;

		// Check if destination has capacity
		if (need.supply >= need.demand) return 0;

		// Deliver content
		const toDeliver = flux.content;
		const available = need.demand - need.supply;
		const delivered = Math.min(toDeliver, available);
		need.supply += delivered;
		flux.removeContent(delivered);

		if (delivered > 0) {
			this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: districtState as DistrictState });
		}

		return delivered;
	}

	/**
	 * Deliver workers to resource node
	 */
	private deliverWorkers(flux: Flux, destination: Place<PlaceState>): number {
		if (destination.placeType !== 'resource-node') return 0;

		const nodeState = destination.state as ResourceNodeState;
		const workerNeeds = nodeState.workerNeeds;

		// Check if node has capacity for more workers
		if (workerNeeds.supply >= workerNeeds.demand) return 0;

		// Deliver workers
		const toDeliver = flux.content;
		const available = workerNeeds.demand - workerNeeds.supply;
		const delivered = Math.min(toDeliver, available);
		workerNeeds.supply += delivered;
		flux.removeContent(delivered);

		if (delivered > 0) {
			this.events.emit(EVENTS.SIMULATION_RESOURCE_NODE_UPDATE, { resourceNode: nodeState as ResourceNodeState });
		}

		return delivered;
	}

	/**
	 * Deliver workers to district local jobs (self-flux)
	 */
	private deliverLocalJobs(flux: Flux, destination: Place<PlaceState>): number {
		if (destination.placeType !== 'district') return 0;

		const districtState = destination.state as DistrictState;
		const jobs = districtState.jobs.workers;

		// Check if district has capacity for more local jobs
		if (jobs.supply >= jobs.demand) return 0;

		// Deliver workers to local jobs
		const toDeliver = flux.content;
		const available = jobs.demand - jobs.supply;
		const delivered = Math.min(toDeliver, available);
		jobs.supply += delivered;
		flux.removeContent(delivered);

		if (delivered > 0) {
			this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: districtState as DistrictState });
		}

		return delivered;
	}

	getAll(): readonly Flux[] {
		return Array.from(this.fluxes.values());
	}
}
