import { Scene } from 'phaser';
import { EventBus } from '../../../EventBus';

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

        EventBus.emit('game:input:dragStart', {
          x: pointer.x,
          y: pointer.y
        });
      } else if (pointer.leftButtonDown()) {
        const worldPoint = this.scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
        EventBus.emit('game:input:click-on-free-zone', { x: worldPoint.x, y: worldPoint.y });
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const deltaX = pointer.x - this.dragStartX;
        const deltaY = pointer.y - this.dragStartY;

        EventBus.emit('game:input:drag', { 
          deltaX, 
          deltaY,
          x: pointer.x,
          y: pointer.y
        });

        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.scene.input.on('pointerup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        EventBus.emit('game:input:dragEnd');
      }
    });

    this.scene.input.on('wheel', (
      pointer: Phaser.Input.Pointer,
      _gameObjects: any[],
      _deltaX: number,
      deltaY: number
    ) => {
      EventBus.emit('game:input:wheel', { 
        deltaY,
        x: pointer.x,
        y: pointer.y
      });
    });

    this.scene.input.keyboard?.on('keydown-SPACE', () => {
      EventBus.emit('game:input:space');
    });
  }
}