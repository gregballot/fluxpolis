import type { DistrictState } from '@fluxpolis/types';
import { Place } from '../places/Place';

export class District extends Place<DistrictState> {
	constructor(id: string, x: number, y: number) {
		super({
			id,
			x,
			y,
			age: 0,
			placeType: 'district',
		});
	}

	get age() {
		return this.state.age;
	}

	set age(value: number) {
		this.state.age = value;
	}
}
