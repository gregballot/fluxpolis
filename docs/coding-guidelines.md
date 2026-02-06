# Coding Guidelines

**Status:** Current Conventions
**Last Updated:** February 2026

## Development Principles

- **Pragmatism Over Purity**: Ship working prototype, document trade-offs
- **Future-Proof Architecture**: Design supports multiplayer/3D renderer without implementing them
- **Walking Skeleton**: Build minimum viable features end-to-end before adding complexity
- **No Unnecessary Abstraction**: Only create abstractions when there's proven need

## Import Conventions

**Always use absolute imports via `@fluxpolis/*` aliases:**

```typescript
// ✅ Good: Absolute imports
import { EventBus } from '@fluxpolis/client/EventBus';
import { EVENTS } from '@fluxpolis/eventbus';
import { Simulation } from '@fluxpolis/simulation';

// ❌ Bad: Parent directory imports
import { EventBus } from '../../../EventBus';
import { EVENTS } from '../../events/EventMap';

// ✅ Allowed: Same-level or downward imports
import { MyComponent } from './MyComponent';
import { helper } from './utils/helper';
```

**Why:**
- Refactor-safe: Moving files doesn't break imports
- Cleaner: No `../../../` maze
- IDE-friendly: Better autocomplete and navigation
- Enforced: Biome linter will catch violations (`npm run lint`)

**Same-level imports (`./`) are allowed** for closely related files in the same directory.

## Code Quality and Linting

**Biome is used for linting and formatting:**

```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
npm run format         # Format code
```

**Linter configuration (`biome.json`):**

- **Enforced rules:**
  - `noRestrictedImports`: Blocks parent directory imports (`../`) - must use absolute imports
  - Uses Node.js import protocol (`node:fs` instead of `fs`) for built-in modules

- **Warnings (intentional patterns allowed):**
  - `noExplicitAny`: Allow `any` for dynamic types (component storage, Phaser callbacks, etc.)
  - `noNonNullAssertion`: Allow `!` assertions when safety is guaranteed
  - `noStaticOnlyClass`: Allow factory classes with static methods

- **Vue-specific overrides:**
  - `noUnusedImports`: Disabled for `.vue` files (imports used in templates)
  - `noUnusedVariables`: Disabled for `.vue` files

**When to use `any`:**

Only use `any` when TypeScript cannot express the type (e.g., dynamic component storage, third-party library callbacks). Always add a comment explaining why.

```typescript
// Good: Explained use of any
private components: Map<string, any> = new Map(); // Generic component storage

// Bad: Lazy typing
const data: any = fetchData(); // Should be typed properly
```

## TypeScript Conventions

### Interface vs Type

**Use `interface` for object shapes and contracts:**

```typescript
interface CityData {
  id: string;
  population: number;
}

interface GameEvent {
  type: string;
  timestamp?: number;
}
```

**Use `type` for unions, utility types, and primitives:**

```typescript
type ResourceType = "food" | "materials" | "energy";
type Nullable<T> = T | null;
type Position = { x: number; y: number };
```

**Guideline:** Default to `interface` for object shapes. Use `type` when you need features interfaces don't support (unions, mapped types, conditional types).

### Classes vs Interfaces

**Domain entities should be classes with behavior:**

```typescript
// Good: Class with behavior
export class City {
  private resources: Map<string, number> = new Map();

  consumeResource(type: string, amount: number): boolean {
    const current = this.resources.get(type) || 0;
    if (current >= amount) {
      this.resources.set(type, current - amount);
      return true;
    }
    return false;
  }
}
```

**Plain data should use interfaces or types:**

```typescript
// Good: Just data
interface MapGridConfig {
  width: number;
  height: number;
  tileSize: number;
}
```

**Rule:** If it has behavior (methods that mutate state or perform logic), use a class. If it's just data, use interface/type.

## Import/Export Patterns

### Barrel Exports

Barrel exports (`index.ts`) define the **external** public API only. Internal contracts (interfaces used only within the package) stay out of the barrel — they are implementation details, not surface area.

```typescript
// packages/simulation/src/index.ts
export { Simulation } from "./Simulation";
// IManager, IEventBus, District — internal, not exported here
```

**Rule:** If nothing outside the package imports it, it does not belong in the barrel.

### Import Order

Organize imports by category:

```typescript
// 1. External libraries
import Phaser from "phaser";

// 2. Internal cross-package imports
import { EventBus } from "../EventBus";

// 3. Core layer imports
import { EntitiesManager } from "../core/entities/EntitiesManager";
import { SystemsManager } from "../core/systems/SystemsManager";

// 4. Feature imports
import { MapFactory } from "../features/map/components/MapGridFactory";
import { MapRenderSystem } from "../features/map/MapGridRenderSystem";
```

## Architecture Principles

### No Unnecessary Abstraction

**Don't create interfaces for single implementations:**

```typescript
// Unnecessary
interface ISimulation {
  getCities(): City[];
}

class Simulation implements ISimulation {
  getCities(): City[] {}
}

// Better - just use the class
export class Simulation {
  getCities(): City[] {}
}
```

**Principle:** Add abstraction when you have proven need (multiple implementations, testing), not speculation.

### No State in Renderer

**Never store game state in Phaser objects:**

```typescript
// Wrong: State in Phaser sprite
const entity = entitiesManager.createEntity();
entity.addComponent("mapGrid", {
  width: 10,
  height: 10,
  tileSize: 32,
  population: 1000, // don't do this
});

// Right: State in simulation and passed through presentation layer
const city = simulationState.getCity(id); // Not what we actually do but you get the idea
```

**Rule:** Phaser is only for presentation. State lives in simulation.

### Event-Driven Communication

**Layers communicate via EventBus, not direct calls:**

```typescript
// Wrong: Direct coupling
class UIComponent {
  constructor(private camera: Phaser.Camera) {}

  resetCamera(): void {
    this.camera.setPosition(0, 0); // Tight coupling
  }
}

// Right: Event-driven
class UIComponent {
  resetCamera(): void {
    EventBus.emit("ui:camera:reset"); // Loose coupling
  }
}

class CameraSystem {
  init(): void {
    EventBus.on("ui:camera:reset", () => {
      this.camera.reset();
    });
  }
}
```

**Benefit:** Layers can evolve independently without breaking each other.

### Type-Safe Events

Use the `@fluxpolis/eventbus` package for inter-layer communication. Import event constants from EventMap for compile-time type safety:

```typescript
import { EventBus } from "@fluxpolis/client/EventBus";
import { EVENTS } from "@fluxpolis/eventbus";

// TypeScript validates payload shape automatically
EventBus.emit(EVENTS.GAME_INPUT_DRAG, { deltaX: 10, deltaY: 20, x: 100, y: 200 });

// Payload type inferred in listeners
EventBus.on(EVENTS.GAME_INPUT_DRAG, (data) => {
  console.log(data.deltaX); // ✓ Fully typed
});
```

See [EventBus Architecture](architecture/eventbus/overview.md) for complete documentation on:
- Event naming conventions
- Adding new events
- Type safety features
- Usage patterns

## File Naming

**Convention:** Use PascalCase for files containing classes, camelCase for utilities:

```
GameEntity.ts        (contains GameEntity class)
EntitiesManager.ts   (contains EntitiesManager class)
MapGrid.ts           (contains MapGrid interface)
EventBus.ts          (contains EventBus constant)
init.ts              (utility/config file)
```

## Comments and Documentation

**Avoid obvious comments:**

```typescript
// Bad
// Create entity
const entity = entitiesManager.createEntity();

// Good (only comment when logic isn't self-evident)
// Query entities that have both MapGrid and Renderable components
const entities = entitiesManager.query("mapGrid", "renderable");
```

**Document architectural decisions in markdown files, not code comments.**

## TypeScript Strict Mode

**All packages use strict mode:**

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  }
}
```

**Handle null/undefined explicitly:**

```typescript
// Use optional chaining and nullish coalescing
const component = entity.getComponent<MapGrid>("mapGrid");
if (component) {
  // Process component
}

// Or with guards
const value = someValue ?? defaultValue;
```
