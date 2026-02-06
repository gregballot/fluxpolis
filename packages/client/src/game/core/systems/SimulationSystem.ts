import { EventBus } from '@fluxpolis/client/EventBus';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import { EVENTS } from '@fluxpolis/eventbus';

const TICK_INTERVAL = 500; // ms

export class SimulationSystem implements ISystem {
  private accumulator = 0;

  init(): void {}

  update(delta: number): void {
    this.accumulator += delta;
    if (this.accumulator >= TICK_INTERVAL) {
      this.accumulator = 0;
      EventBus.emit(EVENTS.GAME_SIMULATION_TICK);
    }
  }
}
