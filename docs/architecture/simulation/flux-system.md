# Flux System

The Flux system manages flow connections between places (districts and resource nodes). It uses a handler-based architecture to support multiple flow types (food, workers, etc.) with minimal coupling.

## Overview

**Flux** represents a unidirectional flow connection between two places. The system:
- Uses **handler pattern** for type-specific fill/delivery logic
- Maintains **complete separation** between simulation and client layers via events
- Supports **bidirectional flows** using separate flux entities for each direction
- Enables **extensibility** through declarative configuration

**Key Flow Types:**
```typescript
FlowType = 'food' | 'workers'

// Food: ResourceNode → District (feeds population)
// Workers: District → ResourceNode (enables production)
// Workers: District → District (local jobs via self-flux)
```

## FluxState vs FluxComponent

### Simulation: FluxState

Domain model in `@fluxpolis/types`:

```typescript
interface FluxState {
  id: string;
  sourceId: string;
  destinationId: string;
  flowType: FlowType;
  capacity: number;
  content: number;
  distance: number;  // Cached distance (meters)
}
```

### Client: FluxComponent

ECS component in `@fluxpolis/client`:

```typescript
interface FluxComponent extends Omit<FluxState, 'distance'> {
  sourceX: number;     // Denormalized for rendering
  sourceY: number;
  destX: number;
  destY: number;
  // Inherits: id, sourceId, destinationId, flowType, capacity, content
  // Omits: distance (not needed for rendering)
}
```

**Why two types:** `FluxSpawnSystem` transforms simulation `FluxState` → client `FluxComponent`. TypeScript enforces alignment when simulation fields change.

## Simulation Layer

### FluxManager

Orchestrates flux lifecycle:
1. **Creation**: Listens to place placement events, auto-creates fluxes to nearby places
2. **Tick**: Fills fluxes from sources, delivers content to destinations
3. **Handler Dispatch**: Delegates type-specific logic to registered handlers

```typescript
// FluxManager.ts
class FluxManager implements IManager {
  private handlerRegistry: FluxHandlerRegistry;

  constructor(events: TypedEventBus, placeRegistry: PlaceRegistry) {
    this.handlerRegistry = new FluxHandlerRegistry();
    this.registerHandlers();

    this.events.on(EVENTS.SIMULATION_DISTRICTS_NEW, (data) => {
      this.createFluxesForNewPlace(data.district.id);
    });
  }

  private registerHandlers(): void {
    this.handlerRegistry.register('food', new FoodFluxHandler(this.events));
    this.handlerRegistry.register('workers', new WorkerFluxHandler(this.events));
  }

  tick(): void {
    // Phase 1: Fill fluxes from sources
    for (const flux of this.fluxes.values()) {
      if (!flux.hasCapacity()) continue;
      const filled = this.fillFlux(flux);
      if (filled > 0) this.events.emit(EVENTS.SIMULATION_FLUX_UPDATE, { flux: flux.state });
    }

    // Phase 2: Deliver content to destinations
    for (const flux of this.fluxes.values()) {
      if (!flux.hasContent()) continue;
      const delivered = this.deliverFlux(flux);
      if (delivered > 0) this.events.emit(EVENTS.SIMULATION_FLUX_UPDATE, { flux: flux.state });
    }
  }
}
```

### Handler Pattern

**Interface:**

```typescript
// handlers/IFluxHandler.ts
interface IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number;
  deliver(flux: Flux, destination: Place<PlaceState>): number;
}
```

**Registry (O(1) dispatch):**

```typescript
// handlers/FluxHandlerRegistry.ts
class FluxHandlerRegistry {
  private handlers = new Map<FlowType, IFluxHandler>();

  register(flowType: FlowType, handler: IFluxHandler): void {
    this.handlers.set(flowType, handler);
  }

  get(flowType: FlowType): IFluxHandler | undefined {
    return this.handlers.get(flowType);
  }
}
```

**Example Handler:**

```typescript
// handlers/FoodFluxHandler.ts
class FoodFluxHandler implements IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>): number {
    if (source.placeType !== 'resource-node') return 0;
    const node = source as ResourceNode;

    // Fill from available supply
    const available = node.foodProduction.supply;
    const needed = flux.remainingCapacity();
    const amount = Math.min(available, needed);

    if (amount > 0) {
      flux.fill(amount);
      node.foodProduction.supply -= amount;
    }
    return amount;
  }

  deliver(flux: Flux, destination: Place<PlaceState>): number {
    if (destination.placeType !== 'district') return 0;
    const district = destination as District;

    // Deliver to unmet demand
    const needed = district.needs.food.demand - district.needs.food.supply;
    const amount = Math.min(flux.content, needed);

    if (amount > 0) {
      flux.drain(amount);
      district.needs.food.supply += amount;
    }
    return amount;
  }
}
```

### Creation Rules

Declarative rules determine which fluxes are created when a place is spawned:

```typescript
// FluxCreationRules.ts
interface FluxCreationRule {
  sourcePlaceType: PlaceType;
  destinationPlaceType: PlaceType;
  flowType: FlowType;
  selfFlux?: boolean;  // True for fluxes from a place to itself
}

const FLUX_CREATION_RULES: FluxCreationRule[] = [
  // Food flows from resource nodes to districts
  { sourcePlaceType: 'resource-node', destinationPlaceType: 'district', flowType: 'food' },

  // Workers flow from districts to resource nodes
  { sourcePlaceType: 'district', destinationPlaceType: 'resource-node', flowType: 'workers' },

  // Workers flow within districts (local jobs)
  { sourcePlaceType: 'district', destinationPlaceType: 'district', flowType: 'workers', selfFlux: true },
];
```

### Tick Lifecycle

```
Every TICK_INTERVAL (500ms):
  1. FluxManager.tick() called
  2. Phase 1: Fill
     → For each flux with capacity:
       → Get handler for flux.flowType
       → handler.fill(flux, source, placeRegistry)
       → Emit simulation:flux:update if filled
  3. Phase 2: Deliver
     → For each flux with content:
       → Get handler for flux.flowType
       → handler.deliver(flux, destination)
       → Emit simulation:flux:update if delivered
```

## Game/Client Layer

### FluxSpawnSystem

Transforms simulation `FluxState` → client `FluxComponent`:

```typescript
// FluxSpawnSystem.ts
class FluxSpawnSystem implements ISystem {
  init(): void {
    EventBus.on(EVENTS.SIMULATION_FLUX_NEW, (data) => {
      const entity = this.createFlux(data.flux);
      if (!entity) {
        // Queue for retry - race condition with district/resource node spawn
        this.pendingFluxes.set(data.flux.id, data.flux);
      }
    });

    EventBus.on(EVENTS.SIMULATION_FLUX_UPDATE, (data) => {
      const entity = this.entities.get(data.flux.id);
      if (!entity) return;

      const component = entity.getComponent<FluxComponent>(FLUX_COMPONENT);
      if (!component) return;

      // Update content (capacity and positions don't change)
      component.content = data.flux.content;
    });
  }

  private createFlux(flux: FluxState): GameEntity | null {
    // Look up source and destination positions
    const sourcePos = this.findPlacePosition(flux.sourceId);
    const destPos = this.findPlacePosition(flux.destinationId);

    if (!sourcePos || !destPos) return null;  // Retry later

    // Create entity with FluxComponent (extends FluxState + positions)
    const entity = this.entitiesManager.createEntity();
    entity.addComponent<FluxComponent>(FLUX_COMPONENT, {
      id: flux.id,
      sourceId: flux.sourceId,
      destinationId: flux.destinationId,
      sourceX: sourcePos.x,
      sourceY: sourcePos.y,
      destX: destPos.x,
      destY: destPos.y,
      flowType: flux.flowType,
      capacity: flux.capacity,
      content: flux.content,
    });

    return entity;
  }
}
```

### FluxRenderSystem

Renders flux lines using Phaser graphics:

```typescript
// FluxRenderSystem.ts
class FluxRenderSystem implements ISystem {
  update(): void {
    this.graphics.clear();

    const entities = this.entitiesManager.query(FLUX_COMPONENT);
    for (const entity of entities) {
      const flux = entity.getComponent<FluxComponent>(FLUX_COMPONENT);
      if (!flux) continue;

      // Convert world coordinates to render coordinates
      const renderSourceX = worldToRender(flux.sourceX);
      const renderSourceY = worldToRender(flux.sourceY);
      const renderDestX = worldToRender(flux.destX);
      const renderDestY = worldToRender(flux.destY);

      // Set line style based on flow type
      const displayConfig = getFluxTypeDisplayConfig(flux.flowType);
      this.graphics.lineStyle(2, displayConfig.renderColor, 0.6);

      // Draw line
      this.graphics.lineBetween(renderSourceX, renderSourceY, renderDestX, renderDestY);
    }
  }
}
```

### ECS Integration

```
District Placement Event
  → [Simulation] FluxManager creates flux
  → Emits: simulation:flux:new (FluxState)

  → [Game/Client] FluxSpawnSystem listens
    → Looks up place positions
    → Creates ECS entity with FluxComponent (extends FluxState + positions)

  → [Client] FluxRenderSystem renders (queries FluxComponent)
```

## Configuration

### Three-Layer Config System

| Config | Layer | Purpose | Example Fields |
|--------|-------|---------|----------------|
| `FluxTypeConfig` | Simulation | Game logic | `capacity: 100` |
| `FluxTypeDisplayConfig` | Client | Presentation | `renderColor: 0xffaa00, displayName: 'Food'` |
| `FluxCreationRules` | Simulation | Place-type pairs | `{ sourcePlaceType, destinationPlaceType, flowType }` |

**Why separate configs:**
- **Clean separation**: Simulation has zero rendering dependencies
- **TypeScript enforcement**: `Record<FlowType, ...>` ensures complete coverage
- **Independent changes**: Update colors without touching game logic

### FluxTypeConfig (Simulation)

```typescript
// simulation/flux/FluxTypeConfig.ts
interface FluxTypeConfig {
  flowType: FlowType;
  capacity: number;
}

const FLUX_TYPE_CONFIGS: Record<FlowType, FluxTypeConfig> = {
  food: { flowType: 'food', capacity: 100 },
  workers: { flowType: 'workers', capacity: 50 },
};
```

### FluxTypeDisplayConfig (Client)

```typescript
// client/game/features/fluxes/FluxTypeDisplayConfig.ts
interface FluxTypeDisplayConfig {
  flowType: FlowType;
  renderColor: number;
  displayName: string;
}

const FLUX_TYPE_DISPLAY_CONFIGS: Record<FlowType, FluxTypeDisplayConfig> = {
  food: { flowType: 'food', renderColor: 0xffaa00, displayName: 'Food' },
  workers: { flowType: 'workers', renderColor: 0xff6666, displayName: 'Workers' },
};
```

### FluxCreationRules (Simulation)

```typescript
// simulation/flux/FluxCreationRules.ts
interface FluxCreationRule {
  sourcePlaceType: PlaceType;
  destinationPlaceType: PlaceType;
  flowType: FlowType;
  selfFlux?: boolean;
}

const FLUX_CREATION_RULES: FluxCreationRule[] = [
  { sourcePlaceType: 'resource-node', destinationPlaceType: 'district', flowType: 'food' },
  { sourcePlaceType: 'district', destinationPlaceType: 'resource-node', flowType: 'workers' },
  { sourcePlaceType: 'district', destinationPlaceType: 'district', flowType: 'workers', selfFlux: true },
];
```

## Adding a New Flow Type

**6-step process:**

### 1. Update FlowType

```typescript
// @fluxpolis/types/FluxState.ts
export type FlowType = 'food' | 'workers' | 'water';  // Add 'water'
```

### 2. Add FluxTypeConfig Entry

```typescript
// simulation/flux/FluxTypeConfig.ts
const FLUX_TYPE_CONFIGS: Record<FlowType, FluxTypeConfig> = {
  food: { flowType: 'food', capacity: 100 },
  workers: { flowType: 'workers', capacity: 50 },
  water: { flowType: 'water', capacity: 150 },  // NEW
};
```

### 3. Add FluxTypeDisplayConfig Entry

```typescript
// client/game/features/fluxes/FluxTypeDisplayConfig.ts
const FLUX_TYPE_DISPLAY_CONFIGS: Record<FlowType, FluxTypeDisplayConfig> = {
  food: { flowType: 'food', renderColor: 0xffaa00, displayName: 'Food' },
  workers: { flowType: 'workers', renderColor: 0xff6666, displayName: 'Workers' },
  water: { flowType: 'water', renderColor: 0x00aaff, displayName: 'Water' },  // NEW
};
```

### 4. Add FluxCreationRule Entries

```typescript
// simulation/flux/FluxCreationRules.ts
const FLUX_CREATION_RULES: FluxCreationRule[] = [
  // ... existing rules
  { sourcePlaceType: 'resource-node', destinationPlaceType: 'district', flowType: 'water' },  // NEW
];
```

### 5. Implement IFluxHandler

```typescript
// simulation/flux/handlers/WaterFluxHandler.ts
import type { IFluxHandler } from './IFluxHandler';

export class WaterFluxHandler implements IFluxHandler {
  fill(flux: Flux, source: Place<PlaceState>, placeRegistry: PlaceRegistry): number {
    if (source.placeType !== 'resource-node') return 0;
    const node = source as ResourceNode;

    // Fill logic for water
    const available = node.waterProduction.supply;
    const needed = flux.remainingCapacity();
    const amount = Math.min(available, needed);

    if (amount > 0) {
      flux.fill(amount);
      node.waterProduction.supply -= amount;
    }
    return amount;
  }

  deliver(flux: Flux, destination: Place<PlaceState>): number {
    if (destination.placeType !== 'district') return 0;
    const district = destination as District;

    // Deliver logic for water
    const needed = district.needs.water.demand - district.needs.water.supply;
    const amount = Math.min(flux.content, needed);

    if (amount > 0) {
      flux.drain(amount);
      district.needs.water.supply += amount;
    }
    return amount;
  }
}
```

### 6. Register in FluxManager

```typescript
// simulation/flux/FluxManager.ts
private registerHandlers(): void {
  this.handlerRegistry.register('food', new FoodFluxHandler(this.events));
  this.handlerRegistry.register('workers', new WorkerFluxHandler(this.events));
  this.handlerRegistry.register('water', new WaterFluxHandler(this.events));  // NEW
}
```

**TypeScript enforces completeness:** If you add a `FlowType` but forget a config entry, type-check will fail.

## Architectural Tradeoffs

### Handler Pattern

**Benefits:**
- **O(1) dispatch**: Map-based handler lookup
- **Localized changes**: New flow type touches 6 files instead of 10+ `if/else` branches
- **Open/Closed Principle**: Add handlers without modifying FluxManager

**Cost:**
- Slight indirection (handler registry lookup)

### FluxComponent extends FluxState

**Benefits:**
- **Enforces alignment**: Client type extends simulation type
- **Prevents drift**: When simulation fields change, client must update
- **Clear naming**: `FluxComponent` is obviously an ECS component

**Cost:**
- Requires `Omit<FluxState, 'distance'>` utility type

### Unidirectional Fluxes

**Benefits:**
- **Simpler state**: Each flux has single direction
- **Independent capacities**: Food and worker flows have different capacities
- **Future-proof**: Extends naturally to new commodity types

**Cost:**
- More flux entities (2 per connection instead of 1 bidirectional)

### Three-Layer Config

**Benefits:**
- **Clean separation**: Simulation has zero rendering dependencies
- **TypeScript enforcement**: `Record<FlowType, ...>` ensures complete coverage
- **Independent changes**: Update colors without touching game logic

**Cost:**
- Three files instead of one monolithic config

## File Reference

**Simulation Layer:**
- `FluxManager.ts` - Orchestration, creation, tick lifecycle
- `Flux.ts` - Domain model wrapper around FluxState
- `FluxTypeConfig.ts` - Capacity configuration
- `FluxCreationRules.ts` - Declarative place-type pair rules
- `handlers/IFluxHandler.ts` - Handler interface
- `handlers/FluxHandlerRegistry.ts` - O(1) handler dispatch
- `handlers/FoodFluxHandler.ts` - Food fill/delivery logic
- `handlers/WorkerFluxHandler.ts` - Worker fill/delivery logic

**Game/Client Layer:**
- `FluxSpawnSystem.ts` - Transforms FluxState → FluxComponent
- `FluxRenderSystem.ts` - Phaser graphics rendering
- `components/FluxComponent.ts` - Client ECS component (extends FluxState)
- `FluxTypeDisplayConfig.ts` - Colors, display names

**Shared Types:**
- `@fluxpolis/types/FluxState.ts` - Simulation FluxState, FlowType enum
