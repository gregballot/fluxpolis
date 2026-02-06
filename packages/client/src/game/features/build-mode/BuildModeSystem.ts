import { EventBus } from '@fluxpolis/client/EventBus';
import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { DistrictState } from '@fluxpolis/client/game/features/districts/components/DistrictState';
import { EVENTS } from '@fluxpolis/eventbus';
import type { Scene } from 'phaser';

const DISTRICT_RADIUS = 25;
const COLOR_VALID = 0x00ff00;
const COLOR_INVALID = 0xff0000;

export class BuildModeSystem implements ISystem {
  private scene: Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private isActive: boolean = false;

  constructor(
    private entitiesManager: EntitiesManager,
    scene: Scene,
  ) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
  }

  init(): void {
    EventBus.on(EVENTS.UI_MENU_BUILD_DISTRICT, () => {
      this.isActive = true;
    });

    EventBus.on(EVENTS.GAME_INPUT_LEFT_CLICK_ON_MAP, (data) => {
      if (!this.isActive) return;

      const hasCollision = this.checkCollision(data.x, data.y);
      if (hasCollision) return;

      EventBus.emit(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, {
        x: data.x,
        y: data.y,
      });
      this.graphics.clear();
      this.isActive = false;
    });
  }

  update(_delta: number): void {
    if (!this.isActive) return;

    const pointer = this.scene.input.activePointer;
    if (!pointer) return;

    const worldPoint = this.scene.cameras.main.getWorldPoint(
      pointer.x,
      pointer.y,
    );

    const isValidPlacement = !this.checkCollision(worldPoint.x, worldPoint.y);
    const color = isValidPlacement ? COLOR_VALID : COLOR_INVALID;

    this.graphics.clear();
    this.graphics.fillStyle(color, 0.4);
    this.graphics.fillCircle(worldPoint.x, worldPoint.y, DISTRICT_RADIUS);
  }

  private checkCollision(x: number, y: number): boolean {
    const districts = this.entitiesManager.query('DistrictState');

    for (const entity of districts) {
      const district = entity.getComponent<DistrictState>('DistrictState')!;
      const dx = district.x - x;
      const dy = district.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < DISTRICT_RADIUS + district.radius) {
        return true;
      }
    }

    return false;
  }
}
