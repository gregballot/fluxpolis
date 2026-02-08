import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';
import type { ResourceType } from '@fluxpolis/types';

const RESOURCE_COLORS: Record<ResourceType, number> = {
  food: 0xffaa00, // Orange/yellow
};

export class ResourceNodeFactory {
  static createResourceNode(
    entitiesManager: EntitiesManager,
    data: { id: string; x: number; y: number; type: ResourceType },
  ): GameEntity {
    const entity = entitiesManager.createEntity();
    entity.addComponent('ResourceNodeState', {
      id: data.id,
      x: data.x,
      y: data.y,
      type: data.type,
      radius: 20,
      color: RESOURCE_COLORS[data.type],
      alpha: 0.9,
    });
    return entity;
  }
}
