# Type-Safe Events

EventBus provides automatic type validation using a central EventMap. TypeScript infers payload types from event names - no manual annotations needed.

## Basic Usage

```typescript
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';

// Emit events - TypeScript validates payload shape
EventBus.emit(EVENTS.GAME_INPUT_DRAG, {
  deltaX: 10,
  deltaY: 20,
  x: 100,
  y: 200,
}); // ✓ Correct

EventBus.emit(EVENTS.GAME_INPUT_DRAG, { x: 10 });
// ✗ TypeScript error - missing deltaX, deltaY, y

// Listen to events - payload type inferred automatically
EventBus.on(EVENTS.GAME_INPUT_DRAG, (data) => {
  console.log(data.deltaX); // ✓ Fully typed, autocomplete works
  // data is inferred as:
  // { deltaX: number; deltaY: number; x: number; y: number }
});

// Events with no payload
EventBus.emit(EVENTS.GAME_INPUT_SPACE); // ✓ No payload
EventBus.emit(EVENTS.GAME_INPUT_SPACE, {});
// ✗ TypeScript error - undefined event doesn't accept payload
```

## Adding New Events

### Step 1: Define in EventMap

Add your event to `/packages/events/src/EventMap.ts`:

```typescript
export interface EventMap {
  // Existing events...

  // Your new event
  'game:my-feature:action': { myData: string; count: number };

  // Event with no payload
  'ui:dialog:closed': undefined;
}
```

### Step 2: Add Event Constant

Follow the naming convention `{LAYER}_{FEATURE}_{ACTION}`:

```typescript
export const EVENTS = {
  // Existing constants...

  GAME_MY_FEATURE_ACTION: 'game:my-feature:action',
  UI_DIALOG_CLOSED: 'ui:dialog:closed',
} as const;
```

### Step 3: Use Anywhere

TypeScript handles type validation automatically:

```typescript
import { EVENTS } from '@fluxpolis/events';

// In client or simulation code:
EventBus.emit(EVENTS.GAME_MY_FEATURE_ACTION, {
  myData: 'value',
  count: 42
}); // ✓ Type-safe

EventBus.on(EVENTS.GAME_MY_FEATURE_ACTION, (data) => {
  console.log(data.myData.toUpperCase()); // ✓ TypeScript knows it's a string
  console.log(data.count * 2); // ✓ TypeScript knows it's a number
});
```

## Usage Across Layers

Both client and simulation layers use `TypedEventBus` for full type safety:

**Client Layer:**
```typescript
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/events';

// In systems/services
EventBus.emit(EVENTS.GAME_INPUT_DRAG_START, { x: 10, y: 20 });
```

**Simulation Layer:**
```typescript
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';

class DistrictManager {
  constructor(private events: TypedEventBus) {
    // Fully typed - no manual casting needed!
    this.events.on(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, (data) => {
      console.log(data.x, data.y); // TypeScript knows the shape
    });
  }
}
```

Both layers share the same EventBus instance and benefit from compile-time type safety.

## Benefits

**Zero Boilerplate** - No type annotations needed at call sites
**Full Autocomplete** - IDEs suggest event names and payload shapes
**Compile-Time Safety** - Typos and wrong payloads caught before runtime
**Single Source of Truth** - EventMap is the definitive event registry
**Refactor-Safe** - Renaming events or changing payloads updates all usages
**Self-Documenting** - EventMap serves as API documentation

## Debugging

The EventBus includes built-in logging (dev mode only):

```javascript
// In browser console:
logEvents = false  // Disable event logging
logEvents = true   // Enable event logging
```

High-frequency events are filtered from logs by default:
- `game:simulation-tick`
- `game:input:drag`
- `game:input:wheel`
- `game:camera:positionChanged`
- `simulation:districts:update`
