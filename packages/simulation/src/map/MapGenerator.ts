import type { ResourceType } from '@fluxpolis/types';
import type { MapConfig } from './MapConfig';
import { Logger } from '../Logger';

const DEFAULT_RESOURCE_NODE_COUNT = 15;

export interface GeneratedResourceNode {
  id: string;
  x: number;
  y: number;
  type: ResourceType;
}

export class MapGenerator {
  private nextResourceNodeId = 1;

  generateResourceNodes(
    mapConfig: MapConfig,
    count: number = DEFAULT_RESOURCE_NODE_COUNT,
  ): GeneratedResourceNode[] {
    const nodes: GeneratedResourceNode[] = [];
    const minDistance = 10000; // 10 km spacing
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      let attempts = 0;
      const maxAttempts = 100;

      do {
        x = Math.round(Math.random() * mapConfig.width);
        y = Math.round(Math.random() * mapConfig.height);
        attempts++;
      } while (
        attempts < maxAttempts &&
        positions.some(
          (pos) => Math.round(Math.hypot(pos.x - x, pos.y - y)) < minDistance,
        )
      );

      positions.push({ x, y });
      nodes.push({
        id: `resource-node-${this.nextResourceNodeId++}`,
        x,
        y,
        type: 'food',
      });
    }

    Logger.info(`Generated ${nodes.length} resource nodes`);
    return nodes;
  }
}
