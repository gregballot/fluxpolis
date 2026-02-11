# Simulation Layer

The simulation package (`@fluxpolis/simulation`) owns all game-state logic. It has zero dependency on Phaser or the DOM.

## Package layout

```
packages/simulation/src/
├── index.ts                  — barrel export (Simulation only)
├── types.ts                  — IManager interface, TypedEventBus re-exported from @fluxpolis/events
├── Simulation.ts             — orchestrator: IManager registry + tick loop + world initialization
├── map/
│   ├── MapConfig.ts          — map dimensions config
│   └── MapGenerator.ts       — procedural generation of resource nodes
├── places/
│   ├── Place.ts              — abstract base class for spatial entities
│   ├── PlaceRegistry.ts      — central spatial query registry
│   └── PlaceConfig.ts        — influence zone configuration
├── districts/
│   ├── District.ts           — District domain object (extends Place)
│   └── DistrictManager.ts    — implements IManager, subscribes to events, owns district state
└── resources/
    ├── ResourceNode.ts       — ResourceNode domain object (extends Place)
    └── ResourceNodeManager.ts — implements IManager, handles resource node queries
```

## EventBus — the only coupling point

The simulation layer communicates through `TypedEventBus` from `@fluxpolis/events`:

```typescript
import type { TypedEventBus } from '@fluxpolis/events';
import { EVENTS } from '@fluxpolis/events';

// Managers receive the event bus via constructor
class DistrictManager {
  constructor(private events: TypedEventBus) {
    // Fully typed - payload shape inferred automatically!
    this.events.on(EVENTS.GAME_BUILD_MODE_DISTRICT_PLACED, (data) => {
      console.log(data.x, data.y); // TypeScript knows the types
    });
  }
}
```

The client passes its `EventBus` singleton to `new Simulation(EventBus)` - no adapter needed.

See **[EventBus Architecture](../events/overview.md)** for details on event naming, type safety, and adding new events.

## Simulation (orchestrator)

Receives the event bus as an injected dependency and passes it to domain managers via a private `managers: IManager[]` array. Each manager is registered in the constructor through the private `addManager` method. `tick()` iterates the array and calls `tick()` on every registered manager. Contains no event subscriptions or domain logic itself.

## Map ownership and generation

Map config lives in the simulation layer (`MapConfig.ts`). `MapGenerator` generates entities (e.g., resource nodes) at world initialization. After generation, the simulation emits `game:map:loaded` with all static entities. Client systems listen to this event and spawn corresponding visual entities.

## Places and Spatial Queries

**Place** is the abstract base class for spatial entities that can be connected by Fluxes (resource/worker transfer links). Districts and ResourceNodes both extend `Place<TState>`.

**PlaceState includes radius:** All places have an intrinsic `radius` property defined in `@fluxpolis/types`. This is game state (affects collision, placement rules, influence) and is mirrored by the client for rendering.

**Spatial Measurements:** The simulation operates in world space using meters:
- District radius: 1500 meters (1.5 km)
- Resource node radius: 1000 meters (1 km)
- Map size: 150,000 × 150,000 meters (150 km × 150 km)
- Default influence radius: 25,000 meters (25 km)

All positions, distances, and radii use meters. The simulation has no knowledge of pixels. See [Coordinate System](../coordinate-system.md) for details on world-to-render conversion.

**Radius configuration** lives in `@fluxpolis/types/PlaceTypeConfig.ts`:

```typescript
export const PLACE_RADIUS: Record<PlaceType, number> = {
  'district': 1500,        // 1.5 km
  'resource-node': 1000,   // 1 km
} as const;
```

**Single source of truth:** Simulation entities (District, ResourceNode) read from `PLACE_RADIUS` in their constructors. Client systems import from types package, never hardcode values.

**PlaceRegistry** provides spatial queries and collision detection:

```typescript
// Collision detection uses proper circle-circle math
const hasCollision = this.placeRegistry.checkCollisionStrict(
  x, y,
  PLACE_RADIUS['district'] // Pass the entity's radius being placed
);
// Returns true if distance < radius1 + radius2

// Nearby place queries
const nearby = this.placeRegistry.getNearbyPlaces(district, DEFAULT_INFLUENCE_RADIUS);
// Returns both Districts and ResourceNodes within radius
```

**Why PlaceRegistry?** Managers are domain-isolated (DistrictManager only knows districts). Spatial queries need to search ALL place types. PlaceRegistry maintains single responsibility: managers handle domain logic, registry handles spatial indexing.

**Foundation for Flux system:** When a district is placed, `getNearbyPlaces()` identifies connection candidates. FluxManager auto-creates bidirectional fluxes between nearby districts and resource nodes.

## Flux System

**Flux** represents a flow connection between two places. The system uses a handler-based architecture to support multiple flow types (food, workers, etc.) with minimal coupling.

**Key Architecture:**
- **Handler pattern**: Type-specific fill/delivery logic via `IFluxHandler` (see [Flux Handlers](flux-handlers.md))
- **Registry dispatch**: O(1) handler lookup
- **Three-layer config**: Simulation, client, and creation rules (see [Flux Configuration](flux-configuration.md))
- **Event-driven**: Complete separation between simulation and client layers

**Example flow types:**
```typescript
FlowType = 'food' | 'workers'
// Food: ResourceNode → District
// Workers: District → ResourceNode (and District → District for local jobs)
```

See **[Flux System](./flux-system.md)** for architecture overview and tick lifecycle.

## Time System

**TimeManager** tracks simulation time progression.

**Time Structure:**
```typescript
interface SimulationTime {
  year: number;       // Years elapsed since start (Year 0)
  day: number;        // 0-364 (365 days per year)
  hour: number;       // 0-23 (24 hours per day)
  totalHours: number; // Total hours elapsed since start
}
```

**Tick Progression:** Each simulation tick advances time by 1 hour. Time automatically rolls over days and years using standard calendar rules (24 hours/day, 365 days/year).

**Event Broadcasting:** TimeManager emits `simulation:time:update` on every tick with the current time state. The UI listens to this event to display the current simulation date/time.

**Control Flow:**
1. SimulationSystem emits `game:simulation-tick` (controlled by play/pause and speed settings)
2. TimeManager increments time and emits `simulation:time:update`
3. UI components receive time updates and display formatted time

See **[Client Systems](../client/systems-and-components.md)** for SimulationSystem implementation details.

## Districts and Population

**District** represents a settlement with population and economic activity.

**Population Structure:**
```typescript
interface PopulationSegment {
  capacity: number;  // Maximum population this segment can hold
  current: number;   // Current population in this segment
}

interface Population {
  total: PopulationSegment;    // All residents
  workers: PopulationSegment;  // Working population (70% of total)
  inactive: PopulationSegment; // Non-working population (30% of total)
}
```

**Jobs Tracking:** Districts track worker employment using Commodity supply/demand:
```typescript
jobs: {
  workers: Commodity;  // supply: employed workers, demand: job openings
}
```

**Needs Tracking:** Districts consume commodities using supply/demand tracking:
```typescript
needs: Record<ResourceType, Commodity>;  // e.g., food consumption
```

## Resource Nodes and Workers

**ResourceNode** produces resources and requires workers to operate.

**Worker Needs:** Resource nodes declare worker requirements using Commodity:
```typescript
workerNeeds: Commodity;  // supply: assigned workers, demand: workers needed
```

Workers flow from districts through worker fluxes. Resource production depends on worker supply meeting demand (future implementation).

## Adding a new domain

1. Create a folder under `src/` (e.g. `src/economy/`).
2. Implement the manager class with `implements IManager` — the only required method is `tick(): void`.
3. Register it in `Simulation`'s constructor: `this.addManager(new EconomyManager(events))`.

Nothing else changes. No new exports, no new typed fields on `Simulation`.

## Domain managers

Each domain lives in its own folder and owns a manager class. The manager receives `IEventBus` via constructor injection and is responsible for three things: subscribing to relevant game events, mutating its own state, and emitting simulation events back out. `tick()` is where per-interval logic will live as domains grow.

`DistrictManager` is the first example: it subscribes to `game:build-mode:district-placed`, creates a `District`, and emits `simulation:districts:new`.

## Tick driver — SimulationSystem (client-side)

`SimulationSystem` implements `ISystem` and lives in `core/systems/`. It accumulates frame deltas and emits `game:simulation-tick` every {TICK_INTERVAL}ms.

The event flow is as follows:

```
Every frame (via SystemsManager)
  → [Game Layer] SimulationSystem.update(delta)
    → accumulator >= TICK_INTERVAL:
      EventBus.emit('game:simulation-tick')
      → [Simulation Layer] Simulation consumes event:
        → Simulation.tick()
          → DistrictManager.tick()
            → for each district: district.age++
            → emit simulation:districts:update  { district: { id, age } }
      → [Game Layer] DistrictSpawnSystem consumes event:
        → looks up entity by id (O(1) map)
        → mutates DistrictState.age
```

See [Systems & Components](../client/systems-and-components.md) for the `ISystem` contract.

## Event flow example

```
User left-clicks (build mode active)
  → [Game Layer] BuildModeSystem emits: game:build-mode:district-placed  { x, y }
  → [Simulation Layer] DistrictManager consumes event:
    → DistrictManager creates district and the logic alongside it
    → DistrictManager emits:  simulation:districts:new  { district }
  → [Game Layer] DistrictSpawnSystem consumes event:
    → DistrictFactory.createDistrict() adds entity with DistrictState component
  → [Game Layer] DistrictRenderSystem.update() (next frame):
    → queries all DistrictState entities
    → draws a filled circle for each
```

## Event scaling strategy

**Current approach:** one event per entity per tick. Correct for high-level entities (districts, buildings) that number in the tens or low hundreds. The tick spike from N events at 500 ms intervals is imperceptible at this scale.

**The taxonomy — discrete vs continuous:**

- _Discrete_ (rare, meaningful): `districts:new`, `districts:destroyed`, `building:leveledUp`. Keep as individual events. These are the right fit for triggering UI notifications or sounds.
- _Continuous_ (every tick, many entities): position updates, resource counters, age on citizen-scale entities. Switch to batch when entity count makes per-entity events visible as frame stutters.

**The batch pattern (when to apply):** instead of emitting per-entity, collect changes into an array in `tick()` and emit one event: `simulation:tick:completed { changes: [...] }`. The client listener iterates the array. Mechanical change on both sides — no architectural shift. Apply when entities hit low thousands and tick-boundary stutters become visible.

**Polling as an alternative:** would require retaining the Simulation reference in `init.ts` (currently dropped) and exposing a query API on managers. More invasive. Only consider if batch proves insufficient.

**Signal to act:** if a tick boundary causes a frame skip (16.6 ms budget exceeded), profile. If event emission + handling dominates, switch the affected entity type to batch.
