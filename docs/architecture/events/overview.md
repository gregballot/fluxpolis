# EventBus Layer

The EventBus layer (`@fluxpolis/events`) is the communication backbone of Fluxpolis. It provides a type-safe, centralized event system that enables decoupled communication between the client and simulation layers.

## Purpose

The EventBus layer serves as the **contract between architectural layers**:
- Client layer emits UI and input events
- Simulation layer emits game state changes
- Both layers listen to each other's events without direct dependencies

## Package Contents

```
@fluxpolis/events/
  ├── EventMap.ts         # Central event registry with payload types
  ├── TypedEventBus.ts    # Type-safe interface for all layers
  └── index.ts            # Public API
```

## Event Naming Convention

Events follow the pattern: `{layer}:{feature}:{action}`

**Examples:**
- `game:input:dragStart` - Client input event
- `simulation:districts:new` - Simulation state change
- `ui:menu:build-district` - UI interaction

## Event Flow

```
┌─────────────────┐
│  Client Layer   │
│                 │
│  Input System   │───► game:input:drag
│  Camera System  │◄─── game:camera:positionChanged
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   EventBus      │ ← Type-safe central registry
│   @fluxpolis/   │
│   eventbus      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Simulation      │
│                 │
│ DistrictMgr     │───► simulation:districts:new
│                 │◄─── game:simulation-tick
└─────────────────┘
```

## Key Features

**Type Safety** - Compile-time validation of event names and payloads
**Zero Dependencies** - Pure TypeScript, no runtime dependencies
**Shared Contract** - Both layers agree on event structure
**Refactor-Safe** - Rename events in one place, updates everywhere

## Request-Response Query Pattern

The EventBus supports a request-response pattern for querying game state from the simulation layer. This enables the UI to fetch entity data on-demand without creating coupling.

**Flow:**
```
User clicks entity
  → UI emits: ui:query:district { districtId }
  → DistrictManager receives query
  → DistrictManager looks up district by ID
  → DistrictManager emits: simulation:district:response { districtId, data }
  → UI receives response and displays data
```

**Example - District Queries:**

```typescript
// UI Component (EntityInfo.vue)
const handleDistrictClicked = (data: { districtId: string }) => {
  EventBus.emit(EVENTS.UI_QUERY_DISTRICT, { districtId: data.districtId });
};

const handleDistrictResponse = (data: { districtId: string; data: DistrictState }) => {
  entityData.value = data.data;
};

EventBus.on(EVENTS.GAME_DISTRICTS_CLICKED, handleDistrictClicked);
EventBus.on(EVENTS.SIMULATION_DISTRICT_RESPONSE, handleDistrictResponse);
```

```typescript
// Simulation Manager (DistrictManager.ts)
this.events.on(EVENTS.UI_QUERY_DISTRICT, (data) => {
  const district = this.districts.get(data.districtId);
  if (district) {
    this.events.emit(EVENTS.SIMULATION_DISTRICT_RESPONSE, {
      districtId: data.districtId,
      data: district.state,
    });
  }
});
```

**Benefits:**
- **Type-specific:** Each entity type has its own query/response pair
- **Targeted:** Only the relevant manager listens to its query event
- **Type-safe:** Request and response payloads are strongly typed
- **Extensible:** Easy to add queries for buildings, units, etc.

## Race Conditions

Phaser's EventEmitter processes handlers synchronously. When multiple systems listen to the same event and handlers emit nested events, state can mutate mid-execution. This creates handler execution order dependencies that may cause unintended side effects.

**Example:** When placing a district, both BuildModeSystem and DistrictInteractionSystem listen to `game:input:left-click-on-map`. BuildModeSystem's handler emits `game:build-mode:district-placed` and switches mode back to normal. If DistrictInteractionSystem's handler runs after, it sees normal mode and processes the click, creating unintended behavior based purely on handler registration order.

**Future patterns for mitigation:**
- Deferred event queue to process events at frame boundaries.
- Priority parameter for events

## Usage

See [Type-Safe Events](./type-safety.md) for detailed usage and examples.

## Architecture Benefits

**Decoupling** - Layers communicate via events, not direct calls
**Testability** - Mock EventBus for isolated unit tests
**Flexibility** - Swap implementations without changing event contracts
**Scalability** - Add new features without modifying existing code
