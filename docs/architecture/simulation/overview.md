# Simulation Layer

The simulation package (`@fluxpolis/simulation`) owns all game-state logic. It has zero dependency on Phaser or the DOM.

## Package layout

```
packages/simulation/src/
├── index.ts                  — barrel export (Simulation only)
├── types.ts                  — IEventBus, IManager interfaces
├── District.ts               — District domain object
├── Simulation.ts             — orchestrator: IManager registry + tick loop
└── districts/
    └── DistrictManager.ts    — implements IManager, subscribes to events, owns district state
```

## IEventBus — the only coupling point

```typescript
export interface IEventBus {
  on(event: string, listener: (...args: unknown[]) => void): unknown;
  emit(event: string, ...args: unknown[]): unknown;
}
```

Phaser's `EventEmitter` satisfies this structurally. The client passes its singleton `EventBus` into `new Simulation(EventBus)`. No bridge, no adapter, no name translation.

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
        → ...
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
