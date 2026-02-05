import { EventBus } from '../../../EventBus';
import { EntitiesManager } from '../../core/entities/EntitiesManager';
import { GameEntity } from '../../core/entities/GameEntity';
import type { ISystem } from '../../core/systems/ISystem';
import { DistrictFactory } from './components/DistrictFactory';
import type { DistrictState } from './components/DistrictState';

interface DistrictNewPayload {
  district: { id: string; x: number; y: number };
}

interface DistrictUpdatePayload {
  district: { id: string; age: number };
}

export class DistrictSpawnSystem implements ISystem {
  private entities = new Map<string, GameEntity>();

  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    EventBus.on('simulation:districts:new', (data: DistrictNewPayload) => {
      const entity = DistrictFactory.createDistrict(this.entitiesManager, data.district);
      this.entities.set(data.district.id, entity);
    });

    EventBus.on('simulation:districts:update', (data: DistrictUpdatePayload) => {
      const entity = this.entities.get(data.district.id);
      if (!entity) return;
      const state = entity.getComponent<DistrictState>('DistrictState')!;
      state.age = data.district.age;
    });
  }
}
