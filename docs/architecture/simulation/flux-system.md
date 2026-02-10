# Flux System

The Flux system manages flow connections between places (districts and resource nodes). It uses a handler-based architecture to support multiple flow types (food, workers, etc.) with minimal coupling.

## Overview

**Flux** represents a unidirectional flow connection between two places. The system:
- Uses **handler pattern** for type-specific fill/delivery logic (see [Flux Handlers](flux-handlers.md))
- Maintains **complete separation** between simulation and client layers via events
- Supports **bidirectional flows** using separate flux entities for each direction
- Enables **extensibility** through declarative configuration (see [Flux Configuration](flux-configuration.md))

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

See **[Flux Handlers](flux-handlers.md)** for handler pattern details and implementation guide.

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

See **[Flux Configuration](flux-configuration.md)** for:
- Three-layer config system (simulation, client, creation rules)
- Adding new flow types (6-step tutorial)
- Complete configuration examples

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
