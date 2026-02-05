export class District {
  readonly id: string;
  x: number;
  y: number;
  age: number = 0;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
  }
}
