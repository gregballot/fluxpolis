# Technical Guidelines Document

> **⚠️ ARCHIVED DOCUMENT**
>
> This is historical planning from early development (January 2026).
> For current architecture, see [Architecture Overview](architecture/client/overview.md).
>
> **Known Outdated Sections:**
> - **Section 3:** Now 3 layers (Client, Simulation, EventBus), not 5
> - **Section 5:** Types package now exists at `@fluxpolis/types`
> - **Sections 4-6:** Implementation evolved differently from original plan
>
> This document is preserved for historical context only.

**Project:** Fluxpolis
**Version:** 1.0
**Date:** January 31, 2026
**Status:** Historical Planning Document

---

## 1. Introduction

### Purpose

This document establishes the technical architecture and development principles for the city-building automation game prototype. It serves as a reference for architectural decisions, technology choices, and code organization patterns.

### Scope

These guidelines cover the V1 prototype phase, focusing on validating the core gameplay loop. The architecture is designed to be future-proof without over-engineering—we prioritize shipping a playable prototype while maintaining clean separation of concerns that will support future expansion.

### Living Document

This is a living document that will evolve as we learn from implementation. Decisions marked as "deferred" will be resolved during development and documented in future revisions.

---

## 2. Tech Stack

### Language

**TypeScript (Strict Mode)**

All application code uses TypeScript with strict mode enabled.

### Platform

**Browser-First, Electron-Compatible**

**V1 Deployment:** Web browser (no installation required)  
**Future Path:** Desktop app via Electron wrapper (same codebase)

### Rendering

**Phaser 3 (Canvas 2D)**

Phaser 3 handles rendering, input, camera management, and the game loop.

**Migration Path:** Renderer layer is abstracted to support future migration to Three.js for 3D rendering. The projection layer outputs renderer-agnostic primitives, allowing the renderer to be swapped without affecting simulation or game logic.

### Build Tools

**Vite** - Build tool and development server

### Repository Structure

**Monorepo** - Multiple packages managed by npm workspaces

### Backend (Optional for V1)

**Node.js**

**V1 Approach:** No backend server; simulation runs in the browser  
**Future:** Authoritative server-side simulation for multiplayer

---

## 3. Architectural Layers

### Overview

The architecture uses an event-driven design with five distinct layers. Communication between layers happens exclusively through events, ensuring loose coupling and clean separation of concerns.

### Layer Definitions

#### UI Layer

**Responsibility:** HTML/CSS interface controls outside the game canvas

**Handles:**
- Buttons, menus, control panels
- Metrics display (population, resources, etc.)
- Modal dialogs and notifications

**Emits Events:**
- `ui:buildButtonClicked`
- `ui:settingChanged`

**State:** Stateless display layer for game state. UI layer can maintain its own internal UI state (menu open/closed, etc.) without emitting events.

---

#### Renderer Layer (Phaser)

**Responsibility:** Render the game world and handle canvas interactions

**Handles:**
- Drawing game objects (cities, factories, routes)
- Camera management (zoom, pan)
- Canvas click detection and interaction
- Visual effects and animations

**Emits Events:**
- `ui:objectClicked` - User clicked on a game object
- `ui:canvasClicked` - User clicked on empty space
- `ui:dragStarted` - User started dragging

**Receives:**
- View model from Projection Layer (what to render)

**Important:** The renderer handles spatial input (clicks on canvas) and translates them into semantic events. It knows "user clicked the circle representing city-123" but doesn't know what that means for gameplay.

**State:** Maintains sprite/visual representations but no game state. All game state lives in the Simulation layer.

---

#### Projection Layer

**Responsibility:** Translate simulation state into renderer-agnostic view data

**Handles:**
- Converting simulation entities to drawable primitives
- Coordinate transformations (game space → screen space)
- Visual representation logic (happiness → color, population → size)

**Input:** Simulation state (City objects, Factory objects, etc.)  
**Output:** View model (drawable primitives for renderer)

**Example Transformation:**
```typescript
// Input: City object from simulation
{ id: 'city-123', position: {x: 100, y: 100}, population: 5000, happiness: 0.8 }

// Output: Drawable primitive for renderer
{ type: 'circle', x: 100, y: 100, radius: 50, color: 0x00ff88, id: 'city-123' }
```

**State:** Stateless transformation layer

---

#### Simulation Layer

**Responsibility:** Game logic and authoritative state

**Handles:**
- All game state (cities, factories, routes, resources)
- Game rules and mechanics
- Production, consumption, transport logic
- Game tick/update loop

**Owns:**
- Domain model (City, Factory, Route classes)
- All business logic
- State mutations

**Emits Events:**
- `simulation:cityCreated`
- `simulation:stateUpdated`
- `simulation:resourceDepleted`

**Constraints:**
- Pure TypeScript (no DOM APIs, no Node-specific APIs)
- Can run in browser or Node.js environment
- No dependencies on rendering or UI code

**State:** This is the ONLY layer that owns game state. UI and Renderer are purely display layers.

---

#### Event Bus

**Responsibility:** Decentralized event communication between layers

**Provides:**
- Event subscription (`on`)
- Event emission (`emit`)
- Generic event contract that all events must follow

**Event Contract:**
```typescript
interface GameEvent {
  type: string;
  timestamp?: number;
}
```

**Decentralized Event Ownership:**

Each layer defines the events it emits. There is no central event registry. This maintains separation of concerns and allows layers to evolve independently.

Example:
```typescript
// packages/simulation/src/events.ts
export interface CityCreatedEvent extends GameEvent {
  type: 'simulation:cityCreated';
  cityId: string;
}

// packages/client/src/renderer/events.ts
export interface ObjectClickedEvent extends GameEvent {
  type: 'ui:objectClicked';
  objectType: string;
  objectId: string;
}
```

---

### Communication Pattern

**Event-Driven Only**

Layers communicate exclusively through events. No direct method calls between layers.

**Example Flow:**

1. User clicks on canvas
2. Renderer (Phaser) detects click on sprite representing city-123
3. Renderer emits: `{ type: 'ui:objectClicked', objectType: 'city', objectId: 'city-123' }`
4. Simulation listens to event, updates selected city state
5. Simulation emits: `{ type: 'simulation:stateUpdated' }`
6. Projection Layer listens, regenerates view model
7. Projection Layer updates Renderer with new view model
8. Renderer draws updated visual state

---

### Dependency Flow

```
simulation (standalone, no dependencies)
    ↑
client (imports simulation types and classes)
```

**Import Rules:**
- Simulation imports nothing (pure, standalone)
- Client imports from Simulation
- Simulation never imports from Client
- Event Bus is shared infrastructure (both can use it)

---

## 4. Code Organization

### Monorepo Structure

```
/project-root
├── package.json (workspace root)
├── packages/
│   ├── simulation/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── entities/      # City, Factory, Route classes
│   │   │   ├── systems/       # Production, Transport systems
│   │   │   ├── events.ts      # Simulation event definitions
│   │   │   ├── types.ts       # Shared types (Position, ResourceType)
│   │   │   ├── simulation.ts  # Main Simulation class
│   │   │   └── index.ts       # Public API exports
│   │   └── tsconfig.json
│   │
│   ├── client/
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── renderer/      # Phaser scenes and rendering
│   │   │   ├── ui/            # Vue/React components (TBD)
│   │   │   ├── projection/    # Projection layer
│   │   │   ├── event-bus/     # Event bus implementation
│   │   │   └── main.ts        # Application entry point
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   └── server/ (future)
│       └── (deferred until multiplayer)
│
├── tsconfig.base.json (shared TypeScript config)
└── README.md
```

### Type Ownership

**Simulation Owns Domain Types**

The Simulation layer owns all domain types (City, Factory, Route, etc.). Other layers import these types directly—no DTOs, no data mapping.

**Example:**
```typescript
// packages/simulation/src/entities/city.ts
export class City {
  id: string;
  position: Position;
  population: number;
  happiness: number;
  
  constructor(id: string, position: Position) {
    this.id = id;
    this.position = position;
    this.population = 0;
    this.happiness = 0.5;
  }
  
  // Business logic methods
  grow(rate: number): void { }
  consumeResource(type: ResourceType, amount: number): void { }
}

// packages/client/src/projection/projection-layer.ts
import { City } from '@game/simulation';

// Client directly uses Simulation types
function projectCity(city: City) {
  return {
    type: 'circle',
    x: city.position.x,
    y: city.position.y,
    radius: Math.sqrt(city.population) * 0.1,
    color: happinessToColor(city.happiness)
  };
}
```

### Module Exports

Each package exposes its public API through a barrel export (`index.ts`).

**Example:**
```typescript
// packages/simulation/src/index.ts
export { City } from './entities/city';
export { Factory } from './entities/factory';
export { Route } from './entities/route';
export { Simulation } from './simulation';
export type { Position, ResourceType, ResourceInventory } from './types';
export type { SimulationEvent, CityCreatedEvent } from './events';
```

**Principle:** Be explicit about what's public vs internal.

### No Bridge Package (Initially)

We do not create a separate `shared-types` package initially. The Simulation package serves as the shared domain model. A bridge package can be introduced later if specific cross-cutting concerns emerge.

---

## 5. Development Principles

### Type System Conventions

**Interface vs Type**

Use `interface` for object shapes and contracts:
```typescript
interface CityData {
  id: string;
  population: number;
}
```

Use `type` for unions, utility types, and primitives:
```typescript
type ResourceType = 'food' | 'materials' | 'energy';
type Nullable<T> = T | null;
type Position = { x: number; y: number };
```

**Guideline:** Default to `interface` for object shapes. Use `type` when you need features interfaces don't support (unions, mapped types, etc.).

### Domain Types Are Classes with Behavior

Domain entities (City, Factory, Route) are classes, not just data bags. They encapsulate both state and behavior.

**Example:**
```typescript
// Good: Class with behavior
export class City {
  private resources: ResourceInventory = {};
  
  consumeResource(type: ResourceType, amount: number): boolean {
    if (this.resources[type] >= amount) {
      this.resources[type] -= amount;
      return true;
    }
    return false;
  }
}

// Avoid: Just data (unless it truly is just data)
export interface CityData {
  resources: ResourceInventory;
}
```

### No Unnecessary Abstraction

**Don't create interfaces for single implementations.**

There is one Simulation class. Don't create an `ISimulation` interface unless you actually need multiple implementations.

**Example:**
```typescript
// Unnecessary
interface ISimulation {
  getCities(): City[];
}

class Simulation implements ISimulation {
  getCities(): City[] { }
}

// Better - just use the class
export class Simulation {
  getCities(): City[] { }
}
```

**Principle:** Add abstraction when you have proven need, not speculation.

### Event System Principles

**Decentralized Event Ownership**

Each layer defines the events it emits. No central event registry.

**Events Extend Base Contract**

All events extend the `GameEvent` interface:
```typescript
interface GameEvent {
  type: string;
  timestamp?: number;
}

interface CityCreatedEvent extends GameEvent {
  type: 'simulation:cityCreated';
  cityId: string;
}
```

**Event Naming** (Deferred)

Event naming conventions will be established during implementation. Initial pattern suggestion: `{layer}:{action}` (e.g., `simulation:cityCreated`, `ui:objectClicked`).

### Renderer Migration Strategy

**The renderer layer can be completely replaced without affecting other layers.**

**V1:** Phaser 3 (Canvas 2D)  
**Future:** Three.js (3D rendering) or other rendering technology

The Projection Layer outputs renderer-agnostic primitives, isolating rendering technology from game logic and simulation.

**Key Principle:** Never store game state in Phaser objects. Always keep state in Simulation layer.

```typescript
// Wrong: State in Phaser sprite
const citySprite = this.add.circle(x, y, radius);
citySprite.setData('population', 1000);  // Don't do this

// Right: State in Simulation, sprite just visualizes it
class Simulation {
  cities = new Map<string, City>();
}

// Renderer just draws what Simulation tells it
function renderCity(city: City) {
  const sprite = this.add.circle(city.position.x, city.position.y, 50);
}
```

### Architecture Goals

**Separation of Concerns**

Each layer has one clear responsibility. Layers don't reach into each other's internals.

**Future-Proof Without Over-Engineering**

We design for known future needs (server-side simulation, renderer swap) but don't implement them until needed. Architecture supports evolution without requiring it upfront.

**Pragmatism Over Purity**

When architectural purity conflicts with shipping quickly, we choose pragmatism. Document the trade-off and move forward.

---

## 6. Deferred Decisions

The following decisions will be made during implementation and documented in future revisions:

### Event System Details
- Event naming conventions (exact format)
- Event payload standards
- Event granularity (generic vs specific events)

### Data Flow Patterns
- Pull vs push model for state synchronization
- Simulation update frequency (fixed timestep vs variable)
- Projection layer refresh strategy

### State Management
- Whether to use a state management library (Redux, MobX, etc.)
- UI state synchronization patterns

### Development Workflow
- Hot reload behavior (should simulation state survive?)
- Logging and debugging strategies
- Development vs production build differences

### Testing Strategy
- Testing framework selection (Vitest, Jest, etc.)
- What to test (simulation only vs full stack)
- Test structure and organization

### Error Handling
- Event bus failure modes
- How simulation errors surface to UI
- Renderer error recovery

### Performance Optimization
- When to optimize (establish thresholds first)
- Profiling tools and strategy
- Known bottlenecks to watch for

### UI Framework
- Vue vs React decision
- Component structure
- State management approach

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 31, 2026 | Initial technical guidelines document. Establishes tech stack, architectural layers, code organization, and development principles for V1 prototype. |

---

## Notes

This document represents our initial architectural vision. As we build the prototype, we'll learn what works and what doesn't. Expect this document to evolve—that's healthy. The goal is to ship a playable prototype with clean architecture, not to design the perfect system upfront.

When making implementation decisions, favor simplicity and speed to validation. Document trade-offs as we go. Future versions of this document will incorporate lessons learned during development.