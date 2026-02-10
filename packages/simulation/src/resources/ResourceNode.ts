import type { ResourceNodeState, ResourceType } from '@fluxpolis/types';
import { PLACE_RADIUS, worldCoord } from '@fluxpolis/types';
import { Place } from '../places/Place';
import { DEFAULT_RESOURCE_THROUGHPUT, DEFAULT_WORKER_NEEDS } from '../flux/FluxConfig';

export class ResourceNode extends Place<ResourceNodeState> {
	constructor(id: string, x: number, y: number, type: ResourceType) {
		const position = worldCoord(x, y);

		super({
			...position,
			id,
			type,
			placeType: 'resource-node',
			radius: PLACE_RADIUS['resource-node'],
			throughput: DEFAULT_RESOURCE_THROUGHPUT,
			workerNeeds: { ...DEFAULT_WORKER_NEEDS },
		});
	}

	get type() {
		return this.state.type;
	}

	get workerNeeds() {
		return this.state.workerNeeds;
	}

	/**
	 * Calculate production based on worker availability
	 */
	calculateProduction(): number {
		const workerRatio = this.state.workerNeeds.supply / this.state.workerNeeds.demand;
		return Math.floor(this.state.throughput * workerRatio);
	}

	/**
	 * Assign workers to this node
	 */
	assignWorkers(amount: number): number {
		const available = this.state.workerNeeds.demand - this.state.workerNeeds.supply;
		const assigned = Math.min(amount, available);
		this.state.workerNeeds.supply += assigned;
		return assigned;
	}
}
