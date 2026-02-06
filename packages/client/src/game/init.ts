import { EventBus } from '@fluxpolis/client/EventBus';
import { GameScene } from '@fluxpolis/client/game/scenes/GameScene';
import { Simulation } from '@fluxpolis/simulation';
import { AUTO, Game as PhaserGame, Scale, type Types } from 'phaser';

const config: Types.Core.GameConfig = {
  type: AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: {
    mode: Scale.RESIZE,
    autoCenter: Scale.CENTER_BOTH,
  },
  scene: [GameScene],
};

const StartGame = (parent: string) => {
  new Simulation(EventBus);
  return new PhaserGame({ ...config, parent });
};

export default StartGame;
