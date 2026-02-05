import { EventBus } from '../../../EventBus';
import { EntitiesManager } from '../../core/entities/EntitiesManager';
import type { ISystem } from '../../core/systems/ISystem';
import { DistrictFactory } from './components/DistrictFactory';

interface DistrictNewPayload {
  district: { id: string; x: number; y: number };
}

export class DistrictSpawnSystem implements ISystem {
  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    EventBus.on('simulation:districts:new', (data: DistrictNewPayload) => {
      DistrictFactory.createDistrict(this.entitiesManager, data.district);
    });
  }
}
