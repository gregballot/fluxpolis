import type { IFluxHandler } from './IFluxHandler';
import type { Flux } from '../Flux';
import type { Place } from '../../places/Place';
import type { PlaceState, ResourceNodeState, DistrictState } from '@fluxpolis/types';
import type { TypedEventBus } from '@fluxpolis/events';
import type { PlaceRegistry } from '../../places/PlaceRegistry';
import { EVENTS } from '@fluxpolis/events';

/**
 * Handler for food flux logic.
 * Food flows from resource nodes to districts.
 */
export class FoodFluxHandler implements IFluxHandler {
	constructor(private events: TypedEventBus) {}

	/**
	 * Fill food flux from resource node based on production capacity.
	 * Caps filling based on destination demand + surplus buffer.
	 */
	fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number {
		if (source.placeType !== 'resource-node') return 0;

		const nodeState = source.state as ResourceNodeState;
		const production = Math.floor(
			nodeState.throughput * (nodeState.workerNeeds.supply / nodeState.workerNeeds.demand),
		);

		if (production <= 0) return 0;

		// Query destination demand to cap filling
		const destination = placeRegistry.getById(flux.destinationId);
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
	 * Deliver food to district.
	 */
	deliver(flux: Flux, destination: Place<PlaceState>): number {
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
			this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, {
				district: districtState as DistrictState,
			});
		}

		return delivered;
	}
}
