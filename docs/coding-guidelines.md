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

## File Naming

PascalCase for classes, camelCase for utilities:

```
GameEntity.ts        (class)
EntitiesManager.ts   (class)
init.ts              (utility)
```

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
