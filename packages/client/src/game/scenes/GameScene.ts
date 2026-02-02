import Phaser from 'phaser';

import { EventBus } from '../EventBus';

import { EntitiesManager } from '../core/entities/EntitiesManager';
import { SystemsManager } from '../core/systems/SystemsManager';
import { InputService } from '../core/services/InputService';

import { MapFactory } from '../features/map/components/MapGridFactory';

import { MapRenderSystem } from '../features/map/MapGridRenderSystem';
import { CameraSystem } from '../core/systems/CameraSystem';

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
      new MapRenderSystem(this.entitiesManager, this),
      new CameraSystem(this.cameras.main),
    );
    this.systemManager.init();

    EventBus.emit('current-scene-ready', this);
  }

  override update(_time: number, delta: number): void {
    this.systemManager.update(delta);
  }
}
