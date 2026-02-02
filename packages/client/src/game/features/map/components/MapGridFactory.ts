import { EntitiesManager } from '../../../core/entities/EntitiesManager';
import { GameEntity } from '../../../core/entities/GameEntity';
import type { MapGrid } from './MapGrid';

const MapDefaultConfig: MapGrid = {
  width: 3000,
  height: 3000,
  gridSize: 100,
  gridColor: 0x696969,
  gridAlpha: 0.5,
};

export class MapFactory {
  static createMapGrid(entitiesManager: EntitiesManager, config: MapGrid = MapDefaultConfig): GameEntity {
    const mapEntity = entitiesManager.createEntity();
    mapEntity.addComponent('MapGrid', {
      width: config.width,
      height: config.height,
      gridSize: config.gridSize,
      gridColor: config.gridColor,
      gridAlpha: config.gridAlpha,
    });
    return mapEntity;
  }
}
