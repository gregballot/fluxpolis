import { Logger } from './Logger';
import { EVENTS } from '@fluxpolis/events';
import type { IManager, TypedEventBus } from './types';

import { DistrictManager } from './districts/DistrictManager';

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
