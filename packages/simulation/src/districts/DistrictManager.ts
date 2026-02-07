import type { IManager } from '../types';
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import { Logger } from '../Logger';

import { District } from './District';

export class DistrictManager implements IManager {
  private districts = new Map<string, District>();
  private nextId = 1;

  constructor(private events: TypedEventBus) {
    // TypeScript now infers the payload type automatically!
    this.events.on(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, (data) => {
      const district = this.create(data.x, data.y);
      this.events.emit(EVENTS.SIMULATION_DISTRICTS_NEW, { district: district.state });
      Logger.info('District placed', district);
    });

    // Handle UI queries for district data
    this.events.on(EVENTS.UI_QUERY_DISTRICT, (data) => {
      const district = this.districts.get(data.districtId);
      if (district) {
        this.events.emit(EVENTS.SIMULATION_DISTRICT_RESPONSE, {
          districtId: data.districtId,
          data: district.state,
        });
      }
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
      this.events.emit(EVENTS.SIMULATION_DISTRICTS_UPDATE, { district: district.state });
    }
  }

  getAll(): readonly District[] {
    return [...this.districts.values()];
  }
}
