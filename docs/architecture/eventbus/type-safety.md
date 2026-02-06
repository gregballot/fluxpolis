# Type-Safe Events

EventBus provides automatic type validation using a central EventMap. TypeScript infers payload types from event names - no manual annotations needed.

## Basic Usage

```typescript
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/eventbus';

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

Add your event to `/packages/eventbus/src/EventMap.ts`:

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
import { EVENTS } from '@fluxpolis/eventbus';

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

## Event Listener Methods

**`on(event, listener, context?)`** - Subscribe to event

```typescript
EventBus.on(EVENTS.GAME_CAMERA_POSITION_CHANGED, (data) => {
  console.log(`Camera: ${data.x}, ${data.y}, zoom: ${data.zoom}`);
});
```

**`once(event, listener, context?)`** - Listen once, then unsubscribe

```typescript
EventBus.once(EVENTS.CURRENT_SCENE_READY, (scene) => {
  console.log('Scene loaded:', scene);
});
```

**`off(event, listener?, context?)`** - Unsubscribe

```typescript
const handler = (data) => console.log(data);
EventBus.on(EVENTS.GAME_INPUT_DRAG, handler);
// Later:
EventBus.off(EVENTS.GAME_INPUT_DRAG, handler);
```

**`removeAllListeners(event?)`** - Remove all listeners for event

```typescript
EventBus.removeAllListeners(EVENTS.GAME_INPUT_DRAG);
```

## Usage Across Layers

Both client and simulation layers use `TypedEventBus` for full type safety:

**Client Layer:**
```typescript
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/eventbus';

// In systems/services
EventBus.emit(EVENTS.GAME_INPUT_DRAG_START, { x: 10, y: 20 });
```

**Simulation Layer:**
```typescript
import type { TypedEventBus } from '@fluxpolis/eventbus';
import { EVENTS } from '@fluxpolis/eventbus';

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

## Common Patterns

### Conditional Event Emission

```typescript
if (shouldNotify) {
  EventBus.emit(EVENTS.SIMULATION_DISTRICTS_NEW, {
    district: { id: '123', x: 100, y: 200 }
  });
}
```

### Event Forwarding

```typescript
EventBus.on(EVENTS.UI_MENU_BUILD_DISTRICT, () => {
  // Handle UI event, then emit game event
  EventBus.emit(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, { x, y });
});
```

### Cleanup in Vue Components

```typescript
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/eventbus';

const handler = (data) => {
  // Handle event
};

onMounted(() => {
  EventBus.on(EVENTS.GAME_CAMERA_POSITION_CHANGED, handler);
});

onUnmounted(() => {
  EventBus.off(EVENTS.GAME_CAMERA_POSITION_CHANGED, handler);
});
</script>
```

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
