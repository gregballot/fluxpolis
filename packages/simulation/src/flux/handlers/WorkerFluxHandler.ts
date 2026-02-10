import type { IFluxHandler } from './IFluxHandler';
import type { Flux } from '../Flux';
import type { Place } from '../../places/Place';
import type { PlaceState, DistrictState, ResourceNodeState } from '@fluxpolis/types';
import type { TypedEventBus } from '@fluxpolis/events';
import type { PlaceRegistry } from '../../places/PlaceRegistry';
import { EVENTS } from '@fluxpolis/events';
import { getFluxTypeConfig } from '../FluxTypeConfig';

/**
 * Handler for worker flux logic.
 * Workers flow from districts to resource nodes (commuting)
 * and within districts (local jobs/self-flux).
 * Uses consistent 10% flow rate for both cases.
 */
export class WorkerFluxHandler implements IFluxHandler {
	constructor(private events: TypedEventBus) {}

	/**
	 * Fill worker flux from district.
	 * Handles both external (District → ResourceNode) and internal (District → District) flows.
	 */
	fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number {
		if (source.placeType !== 'district') return 0;

		const districtState = source.state as DistrictState;

		// Available workers = current population - workers already busy
		const availableWorkers =
			districtState.population.workers.current - districtState.population.workers.busy;

		if (availableWorkers <= 0) return 0;

		// Query destination to determine demand
		const destination = placeRegistry.getById(flux.destinationId);
		if (!destination) return 0;

		let demandSupply: { demand: number; supply: number };
		let destinationCapacity: number;

		if (destination.placeType === 'resource-node') {
			// External: District → ResourceNode
			const nodeState = destination.state as ResourceNodeState;
			demandSupply = nodeState.workerNeeds;

			// Calculate target with surplus (10% buffer, minimum 1)
			const surplus = Math.max(1, Math.ceil(demandSupply.demand * 0.1));
			const targetSupply = demandSupply.demand + surplus;

			// Stop if surplus is full (accounting for workers already in transit)
			if (demandSupply.supply + flux.content >= targetSupply) return 0;

			// Cap filling to destination capacity
			destinationCapacity = targetSupply - (demandSupply.supply + flux.content);
		} else if (destination.placeType === 'district') {
			// Internal: District → District (self-flux for local jobs)
			const destDistrictState = destination.state as DistrictState;
			demandSupply = destDistrictState.jobs.workers;

			// Check how many local jobs still need to be filled (accounting for workers already in transit)
			destinationCapacity = demandSupply.demand - (demandSupply.supply + flux.content);
			if (destinationCapacity <= 0) return 0;
		} else {
			return 0;
		}

		// Flow rate: 10% of capacity per tick (consistent for both external and internal)
		const config = getFluxTypeConfig('workers');
		const flowRate = Math.floor(config.capacity * 0.1);
		const toAdd = Math.min(flowRate, availableWorkers, destinationCapacity);

		// Mark workers as busy (assigned to flux)
		districtState.population.workers.busy += toAdd;
		const added = flux.addContent(toAdd);

		if (added > 0) {
			this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, {
				district: districtState as DistrictState,
			});
		}

		return added;
	}

	/**
	 * Deliver workers to destination.
	 * Handles both resource nodes (external jobs) and districts (local jobs).
	 */
	deliver(flux: Flux, destination: Place<PlaceState>): number {
		if (destination.placeType === 'resource-node') {
			// Deliver to resource node
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
				this.events.emit(EVENTS.SIMULATION_RESOURCE_NODE_UPDATE, {
					resourceNode: nodeState as ResourceNodeState,
				});
			}

			return delivered;
		} else if (destination.placeType === 'district') {
			// Deliver to district local jobs (self-flux)
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
				this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, {
					district: districtState as DistrictState,
				});
			}

			return delivered;
		}

		return 0;
	}
}
