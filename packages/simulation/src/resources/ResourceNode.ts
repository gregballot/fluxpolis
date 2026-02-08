import type { ResourceNodeState, ResourceType } from '@fluxpolis/types';
import { Place } from '../places/Place';

export class ResourceNode extends Place<ResourceNodeState> {
	constructor(id: string, x: number, y: number, type: ResourceType) {
		super({
			id,
			x,
			y,
			type,
			placeType: 'resource-node',
		});
	}

	get type() {
		return this.state.type;
	}
}
