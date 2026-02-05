export interface IEventBus {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
}

export interface IManager {
  tick(): void;
}
