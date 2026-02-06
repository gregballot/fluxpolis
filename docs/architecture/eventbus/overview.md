# EventBus Layer

The EventBus layer (`@fluxpolis/eventbus`) is the communication backbone of Fluxpolis. It provides a type-safe, centralized event system that enables decoupled communication between the client and simulation layers.

## Purpose

The EventBus layer serves as the **contract between architectural layers**:
- Client layer emits UI and input events
- Simulation layer emits game state changes
- Both layers listen to each other's events without direct dependencies

## Package Contents

```
@fluxpolis/eventbus/
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

## Usage

See [Type-Safe Events](./type-safety.md) for detailed usage and examples.

## Architecture Benefits

**Decoupling** - Layers communicate via events, not direct calls
**Testability** - Mock EventBus for isolated unit tests
**Flexibility** - Swap implementations without changing event contracts
**Scalability** - Add new features without modifying existing code
