import type { DistrictState } from '@fluxpolis/types';
import { PLACE_RADIUS } from '@fluxpolis/types';
import { Place } from '../places/Place';
import { DEFAULT_DISTRICT_NEEDS } from '../flux/FluxConfig';

export class District extends Place<DistrictState> {
	constructor(id: string, x: number, y: number) {
		super({
			id,
			x,
			y,
			age: 0,
			placeType: 'district',
			radius: PLACE_RADIUS['district'],
			needs: DEFAULT_DISTRICT_NEEDS,
		});
	}

	get age() {
		return this.state.age;
	}

	set age(value: number) {
		this.state.age = value;
	}
}
