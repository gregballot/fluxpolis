import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { ResourceNodeFactory } from './components/ResourceNodeFactory';

export class ResourceNodeSpawnSystem implements ISystem {
  private entities = new Map<string, GameEntity>();

  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    // Listen for map loaded event from simulation
    EventBus.on(EVENTS.GAME_MAP_LOADED, (data) => {
      for (const nodeData of data.resourceNodes) {
        const entity = ResourceNodeFactory.createResourceNode(
          this.entitiesManager,
          nodeData,
        );
        this.entities.set(nodeData.id, entity);
      }
    });
  }
}
