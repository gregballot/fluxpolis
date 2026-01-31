import Phaser from 'phaser';
import { Simulation } from '@fluxpolis/simulation';
import { EventBus } from './event-bus/EventBus';
import { GameScene } from './renderer/GameScene';
import { ControlPanel } from './ui/ControlPanel';

// Initialize Event Bus
export const eventBus = new EventBus();

// Initialize Simulation Layer
export const simulation = new Simulation();

// Initialize UI Layer
export const controlPanel = new ControlPanel('control-panel');

// Initialize Renderer Layer (Phaser)
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth - 300, // Account for control panel
  height: window.innerHeight,
  scene: [GameScene],
  backgroundColor: '#1a1a2e',
};

export const game = new Phaser.Game(config);

// Log successful initialization
console.log('All layers initialized');
