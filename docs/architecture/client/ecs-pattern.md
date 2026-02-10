# Entity-Component-System (ECS) Pattern

**Status:** Current Implementation
**Last Updated:** February 2026

## Overview

The client uses a pragmatic ECS pattern where:

- **Entities** are containers for components (no logic)
- **Components** are data structures (no behavior)
- **Systems** process entities with specific components (all logic)

This is **ECS-inspired**, not pure ECS. We prioritize simplicity and TypeScript idioms over strict data-oriented design.

## Core Classes

### GameEntity

**Location:** `packages/client/src/game/core/entities/GameEntity.ts`

**Purpose:** A generic container that stores components by name.

```typescript
export class GameEntity {
  id: string;
  private components: Map<string, any> = new Map();

  addComponent<T>(name: string, component: T): void;
  getComponent<T>(name: string): T | undefined;
  hasComponent(name: string): boolean;
  removeComponent(name: string): void;
}
```

**Key Points:**

- Entities have no game logic - they're just component storage
- Components are stored by string name (e.g., 'MapGrid', 'Transform')
- Type safety via generics when getting/adding components

**Example:**

```typescript
const entity = new GameEntity("entity-1");
entity.addComponent("MapGrid", {
  width: 3000,
  height: 3000,
  gridSize: 100,
});

const mapGrid = entity.getComponent<MapGrid>("MapGrid");
```

### EntitiesManager

**Location:** `packages/client/src/game/core/entities/EntitiesManager.ts`

**Purpose:** Creates entities and provides query API for systems.

```typescript
export class EntitiesManager {
  createEntity(): GameEntity;
  destroyEntity(id: string): void;
  getEntity(id: string): GameEntity | undefined;
  query(...componentNames: string[]): GameEntity[];
  getAllEntities(): GameEntity[];
}
```

**Key Feature: Query API**

Systems use `query()` to find entities with specific components:

```typescript
// Find all entities that have BOTH 'MapGrid' AND 'Renderable' components
const entities = entitiesManager.query("MapGrid", "Renderable");
```

**Example:**

```typescript
class MapRenderSystem implements ISystem {
  render(): void {
    // Query for entities with MapGrid component
    const [mapEntity] = this.entitiesManager.query("MapGrid");

    if (mapEntity) {
      const mapGrid = mapEntity.getComponent<MapGrid>("MapGrid");
      // Render the map grid...
    }
  }
}
```

## Component Pattern

**Components are plain data structures** (interfaces or types, not classes):

```typescript
// Good: Component as interface
export interface MapGrid {
  width: number;
  height: number;
  gridSize: number;
  gridColor: number;
  gridAlpha: number;
}

// Avoid: Component as class with methods
export class MapGrid {
  constructor(public width: number) {}
  calculateArea(): number {
    return this.width * this.height;
  }
}
```

**Why interfaces/types?**

- Simpler serialization (important for save/load)
- Clear separation: data in components, logic in systems
- Easier to reason about data flow

**Exception:** Components can have pure helper methods (no side effects, no state mutations), but prefer moving logic to systems.

## System Pattern

Systems implement the `ISystem` interface. See [Systems & Components](systems-and-components.md#isystem-interface) for the interface definition and lifecycle details.

**Example System:**

```typescript
export class MapRenderSystem implements ISystem {
  constructor(
    private entitiesManager: EntitiesManager,
    private scene: Scene,
  ) {
    this.graphics = scene.add.graphics();
  }

  init(): void {
    // Render once on initialization
    this.render();
  }

  render(): void {
    // Query for entities with MapGrid component
    const [mapEntity] = this.entitiesManager.query("MapGrid");
    if (!mapEntity) return;

    const mapGrid = mapEntity.getComponent<MapGrid>("MapGrid");
    if (!mapGrid) return;

    // Render logic using component data
    this.graphics.clear();
    this.graphics.lineStyle(1, mapGrid.gridColor, mapGrid.gridAlpha);

    // Draw grid...
  }
}
```

## Factory Pattern

**Factories create entities with proper component setup:**

```typescript
export class MapFactory {
  static createMapGrid(
    entitiesManager: EntitiesManager,
    config: MapGrid = MapDefaultConfig,
  ): GameEntity {
    const mapEntity = entitiesManager.createEntity();
    mapEntity.addComponent("MapGrid", {
      width: config.width,
      height: config.height,
      gridSize: config.gridSize,
      gridColor: config.gridColor,
      gridAlpha: config.gridAlpha,
    });
    return mapEntity;
  }
}
```

**Why factories?**

- Encapsulate entity creation logic
- Provide default configurations
- Return fully initialized entities

**Usage:**

```typescript
// In GameScene.create()
MapFactory.createMapGrid(this.entitiesManager);
```

## Complete ECS Flow Example

**Scenario:** Render a map grid

### 1. Define Component (Data)

```typescript
// features/map/components/MapGrid.ts
export interface MapGrid {
  width: number;
  height: number;
  gridSize: number;
  gridColor: number;
  gridAlpha: number;
}
```

### 2. Create Factory (Entity Creation)

```typescript
// features/map/components/MapGridFactory.ts
export class MapFactory {
  static createMapGrid(entitiesManager: EntitiesManager): GameEntity {
    const entity = entitiesManager.createEntity();
    entity.addComponent("MapGrid", {
      width: 3000,
      height: 3000,
      gridSize: 100,
      gridColor: 0x696969,
      gridAlpha: 0.5,
    });
    return entity;
  }
}
```

### 3. Create System (Logic)

```typescript
// features/map/MapGridRenderSystem.ts
export class MapRenderSystem implements ISystem {
  constructor(
    private entitiesManager: EntitiesManager,
    private scene: Scene,
  ) {}

  init(): void {
    this.render();
  }

  render(): void {
    const [mapEntity] = this.entitiesManager.query("MapGrid");
    if (!mapEntity) return;

    const mapGrid = mapEntity.getComponent<MapGrid>("MapGrid");
    // Render using mapGrid data...
  }
}
```

### 4. Wire Up in GameScene (Orchestration)

```typescript
// scenes/GameScene.ts
export class GameScene extends Phaser.Scene {
  create(): void {
    this.entitiesManager = new EntitiesManager();
    this.systemManager = new SystemsManager();

    // Create entity
    MapFactory.createMapGrid(this.entitiesManager);

    // Register system
    this.systemManager.addSystems(
      new MapRenderSystem(this.entitiesManager, this),
    );
    this.systemManager.init();
  }

  update(_time: number, delta: number): void {
    this.systemManager.update(delta);
  }
}
```

## Next Steps

- **Implement Systems**: See `systems-and-components.md` for system lifecycle details
- **Services**: Use services for concerns that aren't entity-based (input, audio, networking)
- **Event-Driven**: Use EventBus for cross-system communication and decoupling
