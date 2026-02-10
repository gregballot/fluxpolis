import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { ResourceNodeComponent } from './components/ResourceNodeComponent';
import { RESOURCE_NODE_COMPONENT } from './components/ResourceNodeComponent';
import { RESOURCE_NODE_COLORS, RESOURCE_NODE_ALPHA } from './ResourceNodeRenderConfig';

export class ResourceNodeSpawnSystem implements ISystem {
  private entities = new Map<string, GameEntity>();

  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    // Create resource nodes when map loads
    EventBus.on(EVENTS.GAME_MAP_LOADED, (data) => {
      if (data.resourceNodes) {
        for (const nodeData of data.resourceNodes) {
          // Create entity directly (no factory)
          const entity = this.entitiesManager.createEntity();

          // Deep clone simulation state and add rendering properties
          entity.addComponent<ResourceNodeComponent>(RESOURCE_NODE_COMPONENT, {
            ...structuredClone(nodeData),
            color: RESOURCE_NODE_COLORS[nodeData.type],
            alpha: RESOURCE_NODE_ALPHA,
          });

          this.entities.set(nodeData.id, entity);
        }
      }
    });

    // Update resource nodes when simulation changes
    EventBus.on(EVENTS.SIMULATION_RESOURCE_NODE_UPDATE, (data) => {
      const entity = this.entities.get(data.resourceNode.id);
      if (!entity) return;

      const component = entity.getComponent<ResourceNodeComponent>(RESOURCE_NODE_COMPONENT);
      if (!component) return;

      // Preserve rendering properties (not in simulation state)
      const { color, alpha } = component;

      // Deep clone simulation state to prevent shared references
      Object.assign(component, structuredClone(data.resourceNode));

      // Restore rendering properties
      component.color = color;
      component.alpha = alpha;
    });
  }
}
