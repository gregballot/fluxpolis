import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import { renderToWorld } from '@fluxpolis/types';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { ResourceNodeState } from './components/ResourceNodeState';

export class ResourceNodeInteractionSystem implements ISystem {
  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    EventBus.on(EVENTS.GAME_INPUT_LEFT_CLICK_ON_MAP, (data) => {
      // Convert render coordinates to world coordinates
      const worldX = renderToWorld(data.x);
      const worldY = renderToWorld(data.y);

      const clickedNode = this.findResourceNodeAtPoint(worldX, worldY);
      if (clickedNode) {
        EventBus.emit(EVENTS.GAME_RESOURCE_NODES_CLICKED, {
          resourceNodeId: clickedNode.id,
          x: worldX,
          y: worldY,
        });
      }
    });
  }

  private findResourceNodeAtPoint(
    x: number,
    y: number,
  ): ResourceNodeState | null {
    const nodes = this.entitiesManager.query('ResourceNodeState');

    for (const entity of nodes) {
      const node = entity.getComponent<ResourceNodeState>('ResourceNodeState');
      if (!node) continue;

      const distance = Math.round(Math.hypot(node.x - x, node.y - y));

      if (distance < node.radius * 1.5) {
        return node;
      }
    }

    return null;
  }
}
