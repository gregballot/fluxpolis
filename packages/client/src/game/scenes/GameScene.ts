import Phaser from 'phaser';
import { EventBus } from '../EventBus';

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Set background color
    this.cameras.main.setBackgroundColor('#1a1a2e');

    // Add a simple text to prove scene is working
    this.add.text(
      this.cameras.main.centerX,
      this.cameras.main.centerY,
      'Phaser Initialized',
      { fontSize: '24px', color: '#ffffff' }
    ).setOrigin(0.5);

    // Emit scene-ready event for Vue component
    EventBus.emit('current-scene-ready', this);
  }
}
