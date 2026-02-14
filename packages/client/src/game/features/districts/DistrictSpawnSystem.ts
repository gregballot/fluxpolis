import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { DistrictComponent } from './components/DistrictComponent';
import { DISTRICT_COMPONENT } from './components/DistrictComponent';

// District rendering constants
const DISTRICT_ALPHA = 0.8;

export class DistrictSpawnSystem implements ISystem {
  private entities = new Map<string, GameEntity>();

  constructor(private entitiesManager: EntitiesManager) { }

  init(): void {
    // Create new district entities
    EventBus.on(EVENTS.SIMULATION_DISTRICTS_NEW, (data) => {
      // Create entity directly (no factory)
      const entity = this.entitiesManager.createEntity();

      // Deep clone simulation state and add rendering properties
      // Note: color, geometry, area, density come from simulation state
      entity.addComponent<DistrictComponent>(DISTRICT_COMPONENT, {
        ...structuredClone(data.district),
        alpha: DISTRICT_ALPHA,
      });

      this.entities.set(data.district.id, entity);
    });

    // Update existing district entities
    EventBus.on(EVENTS.SIMULATION_DISTRICTS_UPDATE, (data) => {
      const entity = this.entities.get(data.district.id);
      if (!entity) return;

      const component = entity.getComponent<DistrictComponent>(DISTRICT_COMPONENT);
      if (!component) return;

      // Preserve rendering-only properties
      const { alpha } = component;

      // Deep clone simulation state to prevent shared references
      // This includes updated geometry, area, density, color from growth
      Object.assign(component, structuredClone(data.district));

      // Restore rendering-only properties
      component.alpha = alpha;
    });
  }
}
