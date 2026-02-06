import { EventBus } from '@fluxpolis/client/EventBus';
import { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import { InputService } from '@fluxpolis/client/game/core/services/InputService';
import { CameraSystem } from '@fluxpolis/client/game/core/systems/CameraSystem';
import { SimulationSystem } from '@fluxpolis/client/game/core/systems/SimulationSystem';
import { SystemsManager } from '@fluxpolis/client/game/core/systems/SystemsManager';
import { BuildModeSystem } from '@fluxpolis/client/game/features/build-mode/BuildModeSystem';
import { DistrictRenderSystem } from '@fluxpolis/client/game/features/districts/DistrictRenderSystem';
import { DistrictSpawnSystem } from '@fluxpolis/client/game/features/districts/DistrictSpawnSystem';
import { MapFactory } from '@fluxpolis/client/game/features/map/components/MapGridFactory';
import { MapRenderSystem } from '@fluxpolis/client/game/features/map/MapGridRenderSystem';
import { EVENTS } from '@fluxpolis/eventbus';
import Phaser from 'phaser';

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
      new BuildModeSystem(this.entitiesManager, this),
      new DistrictSpawnSystem(this.entitiesManager),
      new DistrictRenderSystem(this.entitiesManager, this),
    );
    this.systemManager.init();

    EventBus.emit(EVENTS.CURRENT_SCENE_READY, this);
  }

  override update(_time: number, delta: number): void {
    this.systemManager.update(delta);
  }
}
