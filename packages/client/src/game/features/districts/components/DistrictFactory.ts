import { EntitiesManager } from '../../../core/entities/EntitiesManager';
import { GameEntity } from '../../../core/entities/GameEntity';

export class DistrictFactory {
  static createDistrict(entitiesManager: EntitiesManager, data: { id: string; x: number; y: number }): GameEntity {
    const entity = entitiesManager.createEntity();
    entity.addComponent('DistrictState', {
      id: data.id,
      x: data.x,
      y: data.y,
      radius: 25,
      color: 0x00ffff,
      alpha: 0.8,
    });
    return entity;
  }
}
