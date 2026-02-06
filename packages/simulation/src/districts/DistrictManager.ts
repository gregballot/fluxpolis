import { EVENTS } from '@fluxpolis/eventbus';
import { District } from '@fluxpolis/simulation/districts/District';
import { Logger } from '@fluxpolis/simulation/Logger';
import type { IManager, TypedEventBus } from '@fluxpolis/simulation/types';

export class DistrictManager implements IManager {
  private districts = new Map<string, District>();
  private nextId = 1;

  constructor(private events: TypedEventBus) {
    // TypeScript now infers the payload type automatically!
    this.events.on(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, (data) => {
      const district = this.create(data.x, data.y);
      this.events.emit(EVENTS.SIMULATION_DISTRICTS_NEW, { district });
      Logger.info('District placed', district);
    });
  }

  private create(x: number, y: number): District {
    const district = new District(`district-${this.nextId++}`, x, y);
    this.districts.set(district.id, district);
    return district;
  }

  tick(): void {
    for (const district of this.districts.values()) {
      district.age++;
      this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district });
    }
  }

  getAll(): readonly District[] {
    return [...this.districts.values()];
  }
}
