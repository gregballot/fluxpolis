import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';

export class SystemsManager {
  private systems: ISystem[] = [];

  addSystems(...systems: ISystem[]): void {
    this.systems.push(...systems);
  }

  init(): void {
    this.systems.forEach((system) => {
      if (system.init) {
        system.init();
      }
    });
  }

  update(delta: number): void {
    this.systems.forEach((system) => {
      if (system.update) {
        system.update(delta);
      }
    });
  }

  render(): void {
    this.systems.forEach((system) => {
      if (system.render) {
        system.render();
      }
    });
  }
}
