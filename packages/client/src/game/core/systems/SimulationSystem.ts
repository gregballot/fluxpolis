import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';

import type { ISystem } from './ISystem';

const BASE_TICK_INTERVAL = 500; // ms at 1x speed

export class SimulationSystem implements ISystem {
  private accumulator = 0;
  private isPaused = false;
  private speedMultiplier = 1; // 0.5x, 1x, 2x, 5x

  init(): void {
    // Listen to UI control events
    EventBus.on(EVENTS.UI_CONTROLS_PLAY, () => {
      this.isPaused = false;
    });

    EventBus.on(EVENTS.UI_CONTROLS_PAUSE, () => {
      this.isPaused = true;
    });

    EventBus.on(EVENTS.UI_CONTROLS_SPEED, (data) => {
      this.speedMultiplier = data.speed;
    });
  }

  update(delta: number): void {
    if (this.isPaused) {
      return;
    }

    this.accumulator += delta;
    const currentTickInterval = BASE_TICK_INTERVAL / this.speedMultiplier;

    if (this.accumulator >= currentTickInterval) {
      this.accumulator -= currentTickInterval;
      EventBus.emit(EVENTS.GAME_SIMULATION_TICK);
    }
  }
}
