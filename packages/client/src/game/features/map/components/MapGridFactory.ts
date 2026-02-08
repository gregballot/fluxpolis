import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { GameEntity } from '@fluxpolis/client/game/core/entities/GameEntity';

import type { MapGrid } from './MapGrid';

const MapDefaultConfig: MapGrid = {
  width: 150000,   // 150 km (world space)
  height: 150000,  // 150 km (world space)
  gridSize: 5000,  // 5 km grid cells (world space)
  gridColor: 0x696969,
  gridAlpha: 0.5,
};

export class MapFactory {
  static createMapGrid(
    entitiesManager: EntitiesManager,
    config: MapGrid = MapDefaultConfig,
  ): GameEntity {
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
