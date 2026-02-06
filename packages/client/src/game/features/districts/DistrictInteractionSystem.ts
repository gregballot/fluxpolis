import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';

import type { EntitiesManager } from '@fluxpolis/client/game/core/entities/EntitiesManager';
import type { ISystem } from '@fluxpolis/client/game/core/systems/ISystem';
import type { DistrictState } from './components/DistrictState';

export class DistrictInteractionSystem implements ISystem {
  private buildModeActive: boolean = false;

  constructor(
    private entitiesManager: EntitiesManager,
  ) {}

  init(): void {
    // Track build mode state
    EventBus.on(EVENTS.UI_MENU_BUILD_DISTRICT, () => {
      this.buildModeActive = true;
    });

    EventBus.on(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, () => {
      this.buildModeActive = false;
    });

    // Handle clicks (only when not in build mode)
    EventBus.on(EVENTS.GAME_INPUT_LEFT_CLICK_ON_MAP, (data) => {
      if (this.buildModeActive) return;

      const clickedDistrict = this.findDistrictAtPoint(data.x, data.y);
      if (clickedDistrict) {
        EventBus.emit(EVENTS.GAME_DISTRICTS_CLICKED, {
          districtId: clickedDistrict.id,
          x: data.x,
          y: data.y,
        });
      }
    });
  }

  private findDistrictAtPoint(x: number, y: number): DistrictState | null {
    const districts = this.entitiesManager.query('DistrictState');

    for (const entity of districts) {
      const district = entity.getComponent<DistrictState>('DistrictState');
      if (!district) continue;

      const dx = district.x - x;
      const dy = district.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < district.radius) {
        return district;
      }
    }

    return null;
  }
}
