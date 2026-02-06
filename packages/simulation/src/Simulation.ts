import { EVENTS } from '@fluxpolis/eventbus';
import { DistrictManager } from '@fluxpolis/simulation/districts/DistrictManager';
import { Logger } from '@fluxpolis/simulation/Logger';
import type { IManager, TypedEventBus } from '@fluxpolis/simulation/types';

export class Simulation {
  private managers: IManager[] = [];

  constructor(events: TypedEventBus) {
    this.addManager(new DistrictManager(events));
    events.on(EVENTS.GAME_SIMULATION_TICK, () => this.tick());
    Logger.info('Simulation started');
  }

  private addManager(manager: IManager): void {
    this.managers.push(manager);
  }

  tick(): void {
    for (const manager of this.managers) {
      manager.tick();
    }
  }
}
