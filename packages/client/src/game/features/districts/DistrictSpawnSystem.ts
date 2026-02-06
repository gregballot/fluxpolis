import { EventBus } from '@fluxpolis/client/EventBus';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { DistrictFactory } from '@fluxpolis/client/game/features/districts/components/DistrictFactory';
import type { DistrictState } from '@fluxpolis/client/game/features/districts/components/DistrictState';
import { EVENTS } from '@fluxpolis/eventbus';

export class DistrictSpawnSystem implements ISystem {
  private entities = new Map<string, GameEntity>();

  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    EventBus.on(EVENTS.SIMULATION_DISTRICTS_NEW, (data) => {
      const entity = DistrictFactory.createDistrict(
        this.entitiesManager,
        data.district,
      );
      this.entities.set(data.district.id, entity);
    });

    EventBus.on(EVENTS.SIMULATION_DISTRICTS_UPDATE, (data) => {
      const entity = this.entities.get(data.district.id);
      if (!entity) return;
      const state = entity.getComponent<DistrictState>('DistrictState')!;
      state.age = data.district.age;
    });
  }
}
