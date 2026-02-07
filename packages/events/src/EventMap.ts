import type { DistrictState } from '@fluxpolis/types';

/**
 * Central registry of all events and their payload types.
 * When adding a new event:
 * 1. Add the event name as a key (using the naming convention: layer:feature:action)
 * 2. Set the payload type as the value (use undefined for events with no payload)
 *
 * TypeScript will automatically enforce payload types based on event names.
 */
export interface EventMap {
  // Input events
  'game:input:dragStart': { x: number; y: number };
  'game:input:drag': { deltaX: number; deltaY: number; x: number; y: number };
  'game:input:dragEnd': undefined;
  'game:input:left-click-on-map': { x: number; y: number };
  'game:input:wheel': { deltaY: number; x: number; y: number };
  'game:input:space': undefined;

  // Camera events
  'game:camera:positionChanged': {
    x: number;
    y: number;
    zoom: number;
    scrollX: number;
    scrollY: number;
  };

  // Build mode events
  'game:build-mode:district-placed': { x: number; y: number };

  // District events
  'game:districts:clicked': { districtId: string; x: number; y: number };

  // UI events
  'ui:menu:build-district': undefined;
  'ui:query:district': { districtId: string };

  // Query response events
  'simulation:district:response': {
    districtId: string;
    data: DistrictState;
  };

  // Simulation events
  'game:simulation-tick': undefined;
  'simulation:districts:new': {
    district: { id: string; x: number; y: number };
  };
  'simulation:districts:update': { district: DistrictState };

  // Scene events (using unknown to avoid Phaser dependency in this package)
  'current-scene-ready': unknown;
}

/**
 * Event name constants following the naming convention.
 * Format: {LAYER}_{FEATURE}_{ACTION}
 * Examples: GAME_INPUT_DRAG_START, SIMULATION_DISTRICTS_NEW
 */
export const EVENTS = {
  GAME_INPUT_DRAG_START: 'game:input:dragStart',
  GAME_INPUT_DRAG: 'game:input:drag',
  GAME_INPUT_DRAG_END: 'game:input:dragEnd',
  GAME_INPUT_LEFT_CLICK_ON_MAP: 'game:input:left-click-on-map',
  GAME_INPUT_WHEEL: 'game:input:wheel',
  GAME_INPUT_SPACE: 'game:input:space',
  GAME_CAMERA_POSITION_CHANGED: 'game:camera:positionChanged',
  GAME_BUILD_MODE_DISTRICT_PLACED: 'game:build-mode:district-placed',
  GAME_DISTRICTS_CLICKED: 'game:districts:clicked',
  UI_MENU_BUILD_DISTRICT: 'ui:menu:build-district',
  UI_QUERY_DISTRICT: 'ui:query:district',
  GAME_SIMULATION_TICK: 'game:simulation-tick',
  SIMULATION_DISTRICT_RESPONSE: 'simulation:district:response',
  SIMULATION_DISTRICTS_NEW: 'simulation:districts:new',
  SIMULATION_DISTRICTS_UPDATE: 'simulation:districts:update',
  CURRENT_SCENE_READY: 'current-scene-ready',
} as const;
