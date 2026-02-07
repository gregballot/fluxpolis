import type { DistrictState } from '@fluxpolis/types';

export class District {
  readonly state: DistrictState;

  constructor(id: string, x: number, y: number) {
    this.state = {
      id,
      x,
      y,
      age: 0,
    };
  }

  // Convenience getters
  get id() {
    return this.state.id;
  }
  get x() {
    return this.state.x;
  }
  get y() {
    return this.state.y;
  }
  get age() {
    return this.state.age;
  }
  set age(value: number) {
    this.state.age = value;
  }
}
