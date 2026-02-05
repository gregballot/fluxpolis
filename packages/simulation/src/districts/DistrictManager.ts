import { District } from '../District';
import type { IEventBus, IManager } from '../types';

export class DistrictManager implements IManager {
  private districts = new Map<string, District>();
  private nextId = 1;

  constructor(private events: IEventBus) {
    this.events.on('game:build-mode:district-placed', (...args: unknown[]) => {
      const data = args[0] as { x: number; y: number };
      const district = this.create(data.x, data.y);
      this.events.emit('simulation:districts:new', { district });
      console.log('[Simulation] District placed', district);
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
      this.events.emit('simulation:districts:update', { district });
    }
  }

  getAll(): readonly District[] {
    return [...this.districts.values()];
  }
}
