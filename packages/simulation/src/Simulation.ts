import type { IEventBus, IManager } from './types';
import { DistrictManager } from './districts/DistrictManager';
import { Logger } from './Logger';

export class Simulation {
  private managers: IManager[] = [];

  constructor(events: IEventBus) {
    this.addManager(new DistrictManager(events));
    events.on('game:simulation-tick', () => this.tick());
    Logger.info('Simulation started');
  }

  private addManager(manager: IManager): void {
    this.managers.push(manager);
  }

  tick(): void {
    this.managers.forEach(manager => manager.tick());
  }
}
