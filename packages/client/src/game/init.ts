import { GameScene } from './scenes/GameScene';
import { AUTO, Game as PhaserGame, Scale, type Types } from 'phaser';
import { Simulation } from '@fluxpolis/simulation';
import { EventBus } from '../EventBus';

const config: Types.Core.GameConfig = {
    type: AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    parent: 'game-container',
    backgroundColor: '#1a1a2e',
    scale: {
        mode: Scale.RESIZE,
        autoCenter: Scale.CENTER_BOTH
    },
    scene: [
        GameScene
    ]
};

const StartGame = (parent: string) => {
    new Simulation(EventBus);
    return new PhaserGame({ ...config, parent });
}

export default StartGame;