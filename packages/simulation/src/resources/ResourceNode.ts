import type { ResourceNodeState, ResourceType } from '@fluxpolis/types';
import { PLACE_RADIUS } from '@fluxpolis/types';
import { Place } from '../places/Place';
import { DEFAULT_RESOURCE_THROUGHPUT, DEFAULT_WORKER_NEEDS } from '../flux/FluxConfig';

export class ResourceNode extends Place<ResourceNodeState> {
	constructor(id: string, x: number, y: number, type: ResourceType) {
		super({
			id,
			x,
			y,
			type,
			placeType: 'resource-node',
			radius: PLACE_RADIUS['resource-node'],
			throughput: DEFAULT_RESOURCE_THROUGHPUT,
			workerNeeds: DEFAULT_WORKER_NEEDS,
		});
	}

	get type() {
		return this.state.type;
	}

	get workerNeeds() {
		return this.state.workerNeeds;
	}
}
