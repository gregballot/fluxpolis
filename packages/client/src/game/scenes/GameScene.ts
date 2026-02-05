import Phaser from 'phaser';

import { EventBus } from '../../EventBus';

import { EntitiesManager } from '../core/entities/EntitiesManager';
import { SystemsManager } from '../core/systems/SystemsManager';
import { InputService } from '../core/services/InputService';

import { MapFactory } from '../features/map/components/MapGridFactory';

import { MapRenderSystem } from '../features/map/MapGridRenderSystem';
import { CameraSystem } from '../core/systems/CameraSystem';
import { BuildModeSystem } from '../features/build-mode/BuildModeSystem';
import { SimulationSystem } from '../core/systems/SimulationSystem';

export class GameScene extends Phaser.Scene {
  private entitiesManager!: EntitiesManager;
  private systemManager!: SystemsManager;
  private inputService!: InputService;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.entitiesManager = new EntitiesManager();
    this.systemManager = new SystemsManager();

    this.inputService = new InputService(this);
    this.inputService.init();

    MapFactory.createMapGrid(this.entitiesManager);

    this.systemManager.addSystems(
      // core
      new SimulationSystem(),
      new CameraSystem(this.cameras.main),

      // features
      new MapRenderSystem(this.entitiesManager, this),
      new BuildModeSystem(this),
    );
    this.systemManager.init();

    EventBus.emit('current-scene-ready', this);
  }

  override update(_time: number, delta: number): void {
    this.systemManager.update(delta);
  }
}
