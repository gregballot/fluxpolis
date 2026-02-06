# Client Architecture Overview

**Status:** Current Implementation
**Last Updated:** February 2026

## High-Level Philosophy

The client architecture uses an **ECS-inspired pattern** integrated with Phaser 3 and Vue 3. The design emphasizes:

- **Separation of Concerns**: Game logic, rendering, and UI are decoupled via EventBus
- **Feature-Based Organization**: Domain-specific code lives in `features/` to prevent core layer sprawl
- **Pragmatic ECS**: Components are data containers, systems process entities, but we don't enforce pure data-oriented design
- **Event-Driven Communication**: Layers communicate through EventBus, not direct method calls

## Directory Structure

```
packages/client/src/
├── game/
│   ├── EventBus.ts              # Phaser EventEmitter (pub/sub communication)
│   ├── init.ts                  # Phaser game configuration
│   │
│   ├── core/                    # Generic, reusable game infrastructure
│   │   ├── entities/
│   │   │   ├── GameEntity.ts           # Component storage container
│   │   │   └── EntitiesManager.ts      # Entity creation/query system
│   │   ├── components/                 # Generic components (e.g., Clickable, Transform)
│   │   ├── services/                   # Cross-cutting concerns
│   │   │   └── InputService.ts         # Handles input, emits events
│   │   └── systems/                    # Global systems
│   │       ├── ISystem.ts              # System interface
│   │       ├── SystemsManager.ts       # System lifecycle management
│   │       └── CameraSystem.ts         # Camera control
│   │
│   ├── features/                # Domain-specific game features
│   │   ├── map/
│   │   │   ├── components/
│   │   │   │   ├── MapGrid.ts          # Domain component
│   │   │   │   └── MapGridFactory.ts   # Entity creation helper
│   │   │   └── MapGridRenderSystem.ts  # Domain system
│   │   ├── build-mode/
│   │   │   └── BuildModeSystem.ts      # Transient placement mode
│   │   ├── districts/
│   │   │   ├── components/
│   │   │   │   ├── DistrictState.ts    # Domain component
│   │   │   │   └── DistrictFactory.ts  # Entity creation helper
│   │   │   ├── DistrictSpawnSystem.ts  # Simulation bridge (event → entity)
│   │   │   └── DistrictRenderSystem.ts # Pure ECS query renderer
│   │   └── ...
│   │       ├── components/
│   │       │   ├── ...
│   │       ├── ...
│   │
│   └── scenes/
│       └── GameScene.ts         # Orchestrator (creates entities, systems, services)
│
└── ui/                          # Vue 3 UI layer (separate from game canvas)
    ├── UI.vue                   # Root UI component
    ├── CameraInfo.vue           # Example EventBus listener
    └── controls/
        └── ControlsMenu.vue     # Placeholder
```

## Layer Responsibilities

### Core Layer (`core/`)

**Purpose:** Generic, reusable game infrastructure that doesn't depend on specific game features.

**Contents:**

- **Entities**: GameEntity (component storage), EntitiesManager (query system)
- **Components**: Generic components usable across features (e.g., Clickable, Transform)
- **Services**: Cross-cutting concerns like input handling
- **Systems**: Global systems like camera control

**Rule:** If it's specific to a game feature (map, buildings, units), it doesn't belong here.

### Features Layer (`features/`)

**Purpose:** Domain-specific game features organized by feature area.

**Organization Pattern:**

```
features/
└── {feature-name}/
    ├── components/      # Domain-specific components
    ├── systems/         # Domain-specific systems
    └── {other files}    # Helpers, factories, utilities
```

**Example:** The map feature has MapGrid component and MapGridRenderSystem.

**Why Features Layer Exists:**

- Prevents `core/components/` and `core/systems/` from becoming dumping grounds
- Makes it clear which code is generic vs domain-specific
- Supports feature-based development (work on map feature without touching core)

### UI Layer (`ui/`)

**Purpose:** Vue 3 interface components separate from the game canvas.

**Communication:**

- UI components listen to EventBus events (e.g., `game:camera:moved`)
- UI components emit events to game layer (e.g., `ui:button:clicked`)

**Example:** CameraInfo.vue listens to camera events and displays current zoom/position.

### Scenes Layer (`scenes/`)

**Purpose:** Phaser scenes that orchestrate game initialization and update loop.

**GameScene Responsibilities:**

1. Create EntitiesManager
2. Create SystemsManager
3. Initialize services (InputService)
4. Create initial game entities (via factories)
5. Register systems with SystemsManager
6. Delegate update loop to SystemsManager

**Pattern:** GameScene is thin orchestration layer. Game logic lives in systems and services.

## Key Architectural Patterns

### Entity-Component-System (ECS)

**Spans:** `core/entities/` + `core/components/` + `features/*/components/` + `core/systems/` + `features/*/systems/`

**Flow:**

1. **Entities** store components (GameEntity)
2. **EntitiesManager** creates entities and queries by component
3. **Systems** query for entities with specific components and process them
4. **SystemsManager** manages system lifecycle (init, update, render)

See: [ECS Pattern](/architecture/client/ecs-pattern.md)

### Services vs Systems

**Services:** Cross-cutting concerns that don't fit the ECS pattern (e.g., InputService handles input, emits events)

**Systems:** Process entities with specific components (e.g., MapRenderSystem queries for MapGrid components and renders them)

### Event-Driven Communication

The client communicates with other layers via an EventBus which is instantiated in the client, but its contracts and types are defined in the `@fluxpolis/events` package . The EventBus provides type-safe, decoupled communication between systems, UI, and simulation.

**Quick Example:**

```typescript
import { EventBus } from "@fluxpolis/client/EventBus";
import { EVENTS } from "@fluxpolis/events";

// Systems emit events
EventBus.emit(EVENTS.GAME_INPUT_DRAG, { deltaX, deltaY, x, y });

// Other systems listen
EventBus.on(EVENTS.GAME_INPUT_DRAG, (data) => {
  // TypeScript knows the exact payload shape
});
```

See **[EventBus Architecture](../eventbus/overview.md)** for:

- Event naming conventions
- Type-safe event patterns
- Adding new events
- Debugging tools

### Vue + Phaser Integration

**Separate Layers:**

- Phaser renders to canvas (game world)
- Vue renders to DOM (UI controls, menus, HUD)

**Communication:** EventBus bridges the two frameworks

See: [Vue + Phaser Integration](/architecture/client/vue-phaser-integration.md)

## Where to Put New Code

### "I'm adding a new component..."

**Question:** Is it generic (usable across features) or domain-specific?

- **Generic** (e.g., Clickable, Transform): `core/components/`
- **Domain-specific** (e.g., MapGrid, Building): `features/{feature-name}/components/`

### "I'm adding a new system..."

**Question:** Is it global (camera, physics) or feature-specific (map rendering, building management)?

- **Global**: `core/systems/`
- **Feature-specific**: `features/{feature-name}/`

### "I'm adding cross-cutting logic..."

**Question:** Does it fit the ECS pattern (processes entities) or not?

- **Fits ECS**: Create a system
- **Doesn't fit ECS**: Create a service in `core/services/`

Examples of services: InputService, SaveService, AudioService

### "I'm adding UI..."

**Question:** Is it in the game canvas or DOM UI?

- **Game canvas** (sprites, graphics): Add system to render entities
- **DOM UI** (buttons, menus): Add Vue component in `ui/`

## Common Questions

**Q: Why not use a pure ECS library?**
A: Pragmatism. We use ECS principles where they add value (entity queries, system updates) but don't enforce strict data-oriented design. This keeps the codebase accessible.

**Q: Can systems call other systems directly?**
A: Use EventBus for cross-system communication. Direct calls create tight coupling.

## Next Steps

- **Understand ECS**: Read [ecs-pattern.md](/architecture/client/ecs-pattern.md) for entity/component/system fundamentals
- **Implement Systems**: Read [systems-and-components.md](/architecture/client/systems-and-components.md) for ISystem interface and patterns
- **Add Services**: Use services for cross-cutting concerns that don't fit the ECS pattern (input, audio, etc.)
- **Event Communication**: Use EventBus for patterns like input handling and cross-layer decoupling
- **UI Integration**: Read [vue-phaser-integration.md](/architecture/client/vue-phaser-integration.md) for Vue + Phaser coexistence
