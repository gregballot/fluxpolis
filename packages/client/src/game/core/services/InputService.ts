import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/eventbus';
import type { Scene } from 'phaser';

export class InputService {
  private scene: Scene;
  private isDragging: boolean = false;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  init(): void {
    this.scene.input.mouse?.disableContextMenu();
    this.setupEvents();
  }

  private setupEvents(): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;

        EventBus.emit(EVENTS.GAME_INPUT_DRAG_START, {
          x: pointer.x,
          y: pointer.y,
        });
      } else if (pointer.leftButtonDown()) {
        const worldPoint = this.scene.cameras.main.getWorldPoint(
          pointer.x,
          pointer.y,
        );
        EventBus.emit(EVENTS.GAME_INPUT_LEFT_CLICK_ON_MAP, {
          x: worldPoint.x,
          y: worldPoint.y,
        });
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;

        EventBus.emit(EVENTS.GAME_INPUT_DRAG, {
          deltaX,
          deltaY,
          x: pointer.x,
          y: pointer.y,
        });

        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        EventBus.emit(EVENTS.GAME_INPUT_DRAG_END);
      }
    });

    this.scene.input.on(
      'wheel',
      (
        pointer: Phaser.Input.Pointer,
        _gameObjects: any[],
        _deltaX: number,
        deltaY: number,
      ) => {
        EventBus.emit(EVENTS.GAME_INPUT_WHEEL, {
          deltaY,
          x: pointer.x,
          y: pointer.y,
        });
      },
    );

    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      EventBus.emit(EVENTS.GAME_INPUT_SPACE);
    });
  }
}
