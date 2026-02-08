import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import { ResourceNode } from './ResourceNode';
import type { GeneratedResourceNode } from '../map/MapGenerator';
import type { PlaceRegistry } from '../places/PlaceRegistry';

export class ResourceNodeManager implements IManager {
	private resourceNodes = new Map<string, ResourceNode>();

	constructor(
		private events: TypedEventBus,
		private placeRegistry: PlaceRegistry,
	) {
    // Handle UI queries for resource node data
    this.events.on(EVENTS.UI_QUERY_RESOURCE_NODE, (data) => {
      const node = this.resourceNodes.get(data.resourceNodeId);
      if (node) {
        this.events.emit(EVENTS.SIMULATION_RESOURCE_NODE_RESPONSE, {
          requestId: data.requestId,
          resourceNodeId: data.resourceNodeId,
          data: node.state,
        });
      }
    });
  }

	loadNodes(generatedNodes: GeneratedResourceNode[]): void {
		for (const nodeData of generatedNodes) {
			const node = new ResourceNode(
				nodeData.id,
				nodeData.x,
				nodeData.y,
				nodeData.type,
			);
			this.resourceNodes.set(node.id, node);

			// Register with PlaceRegistry for spatial queries
			this.placeRegistry.register(node);
		}
	}

  tick(): void {
    // Resource nodes are static for now
  }

  getAll(): readonly ResourceNode[] {
    return [...this.resourceNodes.values()];
  }
}
