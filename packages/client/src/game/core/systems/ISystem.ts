export interface ISystem {
  init(): void;
  render?(): void;
  update?(delta: number): void;
}
