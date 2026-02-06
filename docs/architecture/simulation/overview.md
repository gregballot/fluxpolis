# Simulation Layer

The simulation package (`@fluxpolis/simulation`) owns all game-state logic. It has zero dependency on Phaser or the DOM.

## Package layout

```
packages/simulation/src/
├── index.ts                  — barrel export (Simulation only)
├── types.ts                  — IManager interface, TypedEventBus re-exported from @fluxpolis/events
├── Simulation.ts             — orchestrator: IManager registry + tick loop
└── districts/
    ├── District.ts           — District domain object
    └── DistrictManager.ts    — implements IManager, subscribes to events, owns district state
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

See **[EventBus Architecture](../eventbus/overview.md)** for details on event naming, type safety, and adding new events.

## Simulation (orchestrator)

Receives the event bus as an injected dependency and passes it to domain managers via a private `managers: IManager[]` array. Each manager is registered in the constructor through the private `addManager` method. `tick()` iterates the array and calls `tick()` on every registered manager. Contains no event subscriptions or domain logic itself.

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
