import type {
	DistrictState,
	FluxState,
	ResourceNodeState,
} from '@fluxpolis/types';

/**
 * Helper to define event payload types.
 * Use `payload<T>()` for events with data, `payload<void>()` for events without data.
 */
const payload = <T = Record<string, unknown>>() => ({} as T);

/**
 * Central registry of all events and their payload types.
 * Single source of truth - define each event once here.
 *
 * When adding a new event:
 * 1. Add an entry with the event name as key (using convention: layer:feature:action)
 * 2. Use payload<Type>() to specify the payload type
 * 3. The EVENTS constant is auto-generated from these keys
 */
const eventMap = {
  // Input events
  'game:input:dragStart': payload<{ x: number; y: number }>(),
  'game:input:drag': payload<{
    deltaX: number;
    deltaY: number;
    x: number;
    y: number;
  }>(),
  'game:input:dragEnd': payload<void>(),
  'game:input:left-click-on-map': payload<{ x: number; y: number }>(),
  'game:input:wheel': payload<{ deltaY: number; x: number; y: number }>(),
  'game:input:space': payload<void>(),

  // Camera events
  'game:camera:positionChanged': payload<{
    x: number;
    y: number;
    zoom: number;
    scrollX: number;
    scrollY: number;
  }>(),

  // Build mode events
  'game:build-mode:district-placement-requested': payload<{ x: number; y: number }>(),

  // Map events
  'game:map:loaded': payload<{ resourceNodes: ResourceNodeState[] }>(),

  // District events
  'game:districts:clicked': payload<{
    districtId: string;
    x: number;
    y: number;
  }>(),

  // Resource node events
  'game:resource-nodes:clicked': payload<{
    resourceNodeId: string;
    x: number;
    y: number;
  }>(),
  'simulation:resource-node:update': payload<{ resourceNode: ResourceNodeState }>(),

  // Flux events
  'simulation:flux:new': payload<{ flux: FluxState }>(),
  'simulation:flux:update': payload<{ flux: FluxState }>(),

  // UI query events
  'ui:menu:build-district': payload<void>(),
  'ui:query:district': payload<{ requestId: string; districtId: string }>(),
  'ui:query:resource-node': payload<{
    requestId: string;
    resourceNodeId: string;
  }>(),

  // Simulation response events
  'simulation:district:response': payload<{
    requestId: string;
    districtId: string;
    data: DistrictState;
  }>(),
  'simulation:resource-node:response': payload<{
    requestId: string;
    resourceNodeId: string;
    data: ResourceNodeState;
  }>(),

  // Simulation events
  'game:simulation-tick': payload<void>(),
  'simulation:districts:new': payload<{ district: DistrictState }>(),
  'simulation:districts:update': payload<{ district: DistrictState }>(),
  'simulation:placement:rejected': payload<{
    x: number;
    y: number;
    reason: string;
  }>(),

  // Scene events (using unknown to avoid Phaser dependency)
  'current-scene-ready': payload<unknown>(),
} as const;

/**
 * EventMap type - derived from the event definitions above.
 * TypeScript will automatically enforce payload types based on event names.
 */
export type EventMap = {
  [K in keyof typeof eventMap]: (typeof eventMap)[K];
};

/**
 * Convert event name to constant name.
 * 'game:input:dragStart' -> 'GAME_INPUT_DRAG_START'
 */
type EventNameToConstant<T extends string> = Uppercase<
  CamelToSnake<Replace<Replace<T, ':', '_'>, '-', '_'>>
>;

// Replace all occurrences of From with To
type Replace<
  S extends string,
  From extends string,
  To extends string,
> = S extends `${infer Start}${From}${infer End}`
  ? `${Start}${To}${Replace<End, From, To>}`
  : S;

// Convert camelCase to snake_case
type CamelToSnake<S extends string> = S extends `${infer First}${infer Rest}`
  ? Rest extends Uncapitalize<Rest>
  ? `${First}${CamelToSnake<Rest>}`
  : `${First}_${CamelToSnake<Rest>}`
  : S;

/**
 * Auto-generated type for EVENTS constant.
 * Maps constant names (GAME_INPUT_DRAG) to event names ('game:input:drag').
 */
type EventConstants = {
  [K in keyof typeof eventMap as EventNameToConstant<K>]: K;
};

/**
 * Helper to create event constants object from event names.
 * Converts 'game:input:dragStart' -> { GAME_INPUT_DRAG_START: 'game:input:dragStart' }
 */
function createEventConstants<T extends Record<string, unknown>>(
  events: T,
): EventConstants {
  const constants: Record<string, string> = {};

  for (const eventName of Object.keys(events)) {
    // Convert camelCase to snake_case, then handle : and -
    const constantName = eventName
      .replace(/([A-Z])/g, '_$1') // camelCase -> snake_case
      .replace(/:/g, '_') // : -> _
      .replace(/-/g, '_') // - -> _
      .toUpperCase();
    constants[constantName] = eventName;
  }

  return constants as EventConstants;
}

/**
 * Type-safe event name constants.
 * Auto-generated from eventMap - single source of truth.
 *
 * Usage: EVENTS.GAME_INPUT_DRAG instead of 'game:input:drag'
 */
export const EVENTS = createEventConstants(eventMap);