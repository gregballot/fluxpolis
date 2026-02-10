# Coding Guidelines

**Status:** Current Conventions
**Last Updated:** February 2026

## Development Principles

- **Pragmatism Over Purity**: Ship working prototype, document trade-offs
- **Future-Proof Architecture**: Design supports multiplayer/3D renderer without implementing them
- **Walking Skeleton**: Build minimum viable features end-to-end before adding complexity
- **No Unnecessary Abstraction**: Only create abstractions when there's proven need

## Import Conventions

**Always use absolute imports via `@fluxpolis/*` aliases. Same-level imports (`./`) are allowed.**

```typescript
// ✅ Good
import { EventBus } from '@fluxpolis/client/EventBus';
import { MyComponent } from './MyComponent';

// ❌ Bad
import { EventBus } from '../../../EventBus';
```

Enforced by Biome linter (`npm run lint`).

## Linting

```bash
npm run lint           # Check for issues
npm run lint:fix       # Auto-fix issues
npm run format         # Format code
```

**Using `any`:** Only when TypeScript cannot express the type. Always add a comment explaining why.

```typescript
private components: Map<string, any> = new Map(); // Generic component storage
```

See `biome.json` for full configuration.

## TypeScript Conventions

### Interface vs Type

- **`interface`** for object shapes and contracts
- **`type`** for unions, utility types, and primitives

```typescript
interface CityData { id: string; population: number; }
type ResourceType = "food" | "materials" | "energy";
```

**Default to `interface` for objects.** Use `type` when you need unions, mapped types, or conditional types.

### Type Ownership

**CRITICAL: Never duplicate type definitions across packages.** Shared types live in `@fluxpolis/types`.

```typescript
// ❌ WRONG - duplicating DistrictState in events AND simulation

// ✅ CORRECT
// packages/types/src/DistrictState.ts
export interface DistrictState { id: string; x: number; y: number; age: number; }

// All other packages import from @fluxpolis/types
import type { DistrictState } from '@fluxpolis/types';
```

**Rules:**
1. Types used by 2+ packages → `@fluxpolis/types`
2. Internal types used by 1 package → keep local
3. Never copy-paste type definitions

### Classes vs Interfaces

**Has behavior (methods, state mutations)?** Use a class.
**Just data?** Use interface/type.

```typescript
// Class with behavior
export class City {
  consumeResource(type: string, amount: number): boolean { /* ... */ }
}

// Plain data
interface MapGridConfig { width: number; height: number; tileSize: number; }
```

## Integer-Only Numbers

**All numeric values in the project are stored and calculated as integers. Never use or store floating-point numbers.**

```typescript
// ✅ Good - integers only
interface DistrictState {
  x: number;                  // Integer meters
  y: number;                  // Integer meters
  radius: number;             // Integer meters
  population: number;         // Integer count
  foodSupply: number;         // Integer units
}

const distance = Math.round(Math.hypot(dx, dy));     // Round distance
const production = Math.floor(throughput * ratio);    // Floor production
const surplus = Math.ceil(demand * 0.1);              // Ceil when rounding up

// ❌ Bad - floating-point numbers
const x = 1500.5;                        // Don't store decimals
const distance = Math.hypot(dx, dy);     // Missing Math.round()
const production = throughput * 0.85;    // Missing Math.floor()
```

**Rationale:**
- **Cleaner display** - No need for `toFixed()`, `ceil()`, or `round()` in UI
- **Performance** - Integer arithmetic is faster and more predictable
- **Consistency** - All calculations use same precision across the codebase
- **Simplicity** - Easier to reason about game state without decimal precision

**Rounding rules:**
- **Distances/measurements**: Use `Math.round()` for symmetric rounding
- **Production/gains**: Use `Math.floor()` to round down (conservative)
- **Costs/buffers**: Use `Math.ceil()` to round up when needed
- **Ratios**: Calculate with division, then immediately floor/round the result

```typescript
// Distance calculations
distanceTo(other: Place): number {
  const dx = this.x - other.x;
  const dy = this.y - other.y;
  return Math.round(Math.hypot(dx, dy));
}

// Production calculations (floor to be conservative)
calculateProduction(): number {
  const ratio = this.workerSupply / this.workerDemand;
  return Math.floor(this.throughput * ratio);
}

// Buffer calculations (ceil to ensure minimum)
const surplus = Math.max(1, Math.ceil(demand * 0.1));
```

## Coordinate Types

Use `WorldCoordinate` and `RenderCoordinate` from `@fluxpolis/types` for type signatures:

```typescript
import { worldCoord, type WorldCoordinate } from '@fluxpolis/types';

function placeDistrict(position: WorldCoordinate): void {
  // position is in meters (world space)
}

const pos = worldCoord(5000, 7500); // Self-documents coordinate space
placeDistrict(pos);
```

**When to use coordinate types:**
- Type signatures (parameters, return types)
- Reusable abstractions (PlaceState extends WorldCoordinate)
- Self-documenting intent (`worldCoord(x, y)` signals coordinate space)

**When to use inline `{ x: number; y: number }`:**
- Event payloads (transient data from Phaser)
- Internal implementation (temporary variables)
- Mixed coordinate contexts (handling both world/render)

**Structural types:** Both types are structural interfaces (not branded). TypeScript won't prevent mixing world/render coordinates at compile time. Mitigation: layer separation + clear naming conventions.

See [Coordinate System](architecture/coordinate-system.md) for utilities and conversion.

## Architecture Principles

### Barrel Exports

`index.ts` defines the **public API only**. Internal contracts stay private.

```typescript
// packages/simulation/src/index.ts
export { Simulation } from "./Simulation";
// IManager, District — internal, not exported
```

### No Unnecessary Abstraction

Don't create interfaces for single implementations. Add abstraction when you have proven need (multiple implementations, testing), not speculation.

### State Management

- **Phaser is presentation only** - never store game state in Phaser objects
- **State lives in simulation** - passed to renderer for display

### Event-Driven Communication

Layers communicate via EventBus, not direct calls. Use `@fluxpolis/events` for type-safe events:

```typescript
import { EventBus } from "@fluxpolis/client/EventBus";
import { EVENTS } from "@fluxpolis/events";

EventBus.emit(EVENTS.GAME_INPUT_DRAG, { deltaX: 10, deltaY: 20, x: 100, y: 200 });
EventBus.on(EVENTS.GAME_INPUT_DRAG, (data) => console.log(data.deltaX)); // ✓ Fully typed
```

See [EventBus Architecture](architecture/events/overview.md) for details.

### Query/Response Pattern

Queries use request IDs to prevent race conditions:

```typescript
// UI queries simulation
const requestId = crypto.randomUUID();
EventBus.emit(EVENTS.UI_QUERY_DISTRICT, { requestId, districtId });

// Simulation responds
EventBus.on(EVENTS.SIMULATION_DISTRICT_RESPONSE, (data) => {
  if (data.requestId === requestId) {
    // Handle response - guaranteed to match our request
  }
});
```

**Event naming convention:** `layer:domain:event`
- UI queries: `ui:query:{entity}` (e.g., `ui:query:district`)
- Simulation responses: `simulation:{entity}:response` (e.g., `simulation:district:response`)

## File Naming

PascalCase for classes, camelCase for utilities:

```
GameEntity.ts        (class)
EntitiesManager.ts   (class)
init.ts              (utility)
```

### ECS Component Naming

**Client ECS components MUST use the `*Component` suffix**, not `*State`.

```typescript
// ✅ CORRECT - Client ECS components
export interface DistrictComponent { /* ... */ }
export const DISTRICT_COMPONENT = 'DistrictComponent';

export interface FluxComponent extends Omit<FluxState, 'distance'> { /* ... */ }
export const FLUX_COMPONENT = 'FluxComponent';

// ❌ WRONG - Don't use *State for client components
export interface DistrictState { /* ... */ }  // Conflicts with simulation type
```

**Rationale:**
- **Avoids naming conflicts**: Simulation types in `@fluxpolis/types` use `*State` (DistrictState, FluxState, ResourceNodeState)
- **Clear distinction**: `*Component` is obviously an ECS component, `*State` is simulation domain model
- **Prevents confusion**: No need for import aliases like `as SimulationFluxState`

**Pattern:**
```typescript
// Simulation domain model (in @fluxpolis/types)
export interface FluxState {
  id: string;
  sourceId: string;
  destinationId: string;
  flowType: FlowType;
  capacity: number;
  content: number;
  distance: number;
}

// Client ECS component (in @fluxpolis/client)
export interface FluxComponent extends Omit<FluxState, 'distance'> {
  sourceX: number;  // Denormalized for rendering
  sourceY: number;
  destX: number;
  destY: number;
}
```

See [Flux System Documentation](architecture/simulation/flux-system.md#fluxstate-vs-fluxcomponent) for detailed example.

### ECS Component Extension Pattern

**Client ECS components MUST extend their simulation state types when a simulation equivalent exists:**

```typescript
// ✅ CORRECT - Component extends simulation state + adds rendering properties
import type { DistrictState } from '@fluxpolis/types';

export interface DistrictComponent extends DistrictState {
  // Add rendering-specific properties not in simulation
  color: number;
  alpha: number;
}

// ✅ CORRECT - Component with no simulation equivalent
export interface MapGridComponent {
  width: number;
  height: number;
  gridColor: number;
  gridAlpha: number;
}
```

**Rationale:**
- **TypeScript enforces alignment**: Simulation field changes cause compile errors in client
- **Prevents drift**: Client and simulation types stay synchronized
- **Enables visual feedback**: Simulation state available for rendering (population density, worker status, production rates)
- **Deep copy required**: Always use `structuredClone()` when updating from simulation events to prevent shared references

**Pattern for all entity components:**
1. Extend simulation state type
2. Add rendering-only fields (colors, alphas, scales, etc.)
3. **Use `structuredClone()` when updating** to prevent mutation leaks
4. Preserve rendering fields when updating from simulation events

**Critical:**
```typescript
// ❌ WRONG - Shallow copy causes mutation leaks
Object.assign(component, data.district);

// ✅ CORRECT - Deep clone prevents shared references
Object.assign(component, structuredClone(data.district));
```

See `FluxComponent`, `DistrictComponent`, and `ResourceNodeComponent` for examples.

## Comments

Only comment when logic isn't self-evident. Document architectural decisions in markdown, not code.

## TypeScript Configuration

### Strict Mode

All packages use strict mode. Handle null/undefined explicitly with optional chaining (`?.`) and nullish coalescing (`??`).

### Composite Projects

All packages use `composite: true` for incremental builds and project references. This enables:
- Fast incremental rebuilds (only changed packages rebuild)
- Better IDE performance
- Proper dependency tracking

**Project reference graph:**
```
types → events → simulation → client
```

Each package references its dependencies in `tsconfig.json`:
```json
{
  "compilerOptions": { "composite": true },
  "references": [{ "path": "../types" }]
}
```
