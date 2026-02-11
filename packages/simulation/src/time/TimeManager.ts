import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';
import type { IManager } from '../types';

export interface SimulationTime {
	year: number;
	day: number; // 0-364 (365 days per year)
	hour: number; // 0-23
	totalHours: number; // Total hours elapsed since start
}

const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;

export class TimeManager implements IManager {
	private time: SimulationTime = {
		year: 1,
		day: 0,
		hour: 0,
		totalHours: 0,
	};

	constructor(private events: TypedEventBus) {
		// Emit initial time state
		this.emitTimeUpdate();
	}

	tick(): void {
		// Increment by 1 hour per tick
		this.time.totalHours++;
		this.time.hour++;

		// Handle day rollover
		if (this.time.hour >= HOURS_PER_DAY) {
			this.time.hour = 0;
			this.time.day++;
		}

		// Handle year rollover
		if (this.time.day >= DAYS_PER_YEAR) {
			this.time.day = 0;
			this.time.year++;
		}

		this.emitTimeUpdate();
	}

	private emitTimeUpdate(): void {
		this.events.emit(EVENTS.SIMULATION_TIME_UPDATE, { ...this.time });
	}

	getTime(): SimulationTime {
		return { ...this.time };
	}
}
