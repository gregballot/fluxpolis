# System Patterns

Implementation patterns for client systems. See [Systems & Components](systems-and-components.md) for interfaces and architecture.

## Pattern 1: ECS Query System

**Use Case:** System processes entities with specific components.

**Example: MapRenderSystem**

```typescript
export class MapRenderSystem implements ISystem {
  constructor(
    private entitiesManager: EntitiesManager,
    private scene: Scene,
  ) {}

  init(): void {
    this.render();
  }

  render(): void {
    // Query for entities with MapGrid component
    const [mapEntity] = this.entitiesManager.query("MapGrid");
    if (!mapEntity) return;

    const mapGrid = mapEntity.getComponent<MapGrid>("MapGrid");
    if (!mapGrid) return;

    // Render using component data
    this.graphics.clear();
    this.graphics.lineStyle(1, mapGrid.gridColor, mapGrid.gridAlpha);
    // ... draw grid
  }
}
```

**Key Points:**

- Query EntitiesManager for entities with required components
- Extract component data
- Process/render based on component state
- No business logic in component - all logic in system

## Pattern 2: Event-Driven System

**Use Case:** System responds to events rather than polling entities.

For EventBus fundamentals, see [EventBus Overview](../events/overview.md).

**Example: CameraSystem**

```typescript
export class CameraSystem implements ISystem {
  constructor(private camera: Phaser.Cameras.Scene2D.Camera) {}

  init(): void {
    this.setupInputListeners();
  }

  private setupInputListeners(): void {
    // Listen to input events
    EventBus.on("game:input:drag", (data) => {
      this.camera.scrollX -= data.deltaX / this.camera.zoom;
      this.camera.scrollY -= data.deltaY / this.camera.zoom;
    });

    EventBus.on("game:input:wheel", (data) => {
      const zoomFactor = data.deltaY > 0 ? 0.9 : 1.1;
      this.camera.setZoom(this.camera.zoom * zoomFactor);
    });
  }

  update(_delta: number): void {
    // Emit camera state for UI
    const state = {
      x: this.camera.scrollX,
      y: this.camera.scrollY,
      zoom: this.camera.zoom,
    };
    EventBus.emit("game:camera:positionChanged", state);
  }
}
```

**Key Points:**

- Listen to EventBus in init()
- Respond to events (don't poll)
- Optionally emit events for other layers
- Deduplication: Only emit events when state actually changes

## Pattern 3: Simulation-Driven Entities

**Use Case:** Entities whose lifecycle is driven by simulation events. Requires two systems: a **SpawnSystem** that bridges simulation events into ECS entities, and a **RenderSystem** that is a pure query renderer. This keeps the simulation bridge and the rendering concern orthogonal — state sync logic added later lives in the SpawnSystem without touching the renderer.

**Example: Districts**

```typescript
// DistrictSpawnSystem — owns the event listener and entity creation.
// Future home of state sync (update components from simulation state).
export class DistrictSpawnSystem implements ISystem {
  constructor(private entitiesManager: EntitiesManager) {}

  init(): void {
    EventBus.on('simulation:districts:new', (data: { district: { id, x, y } }) => {
      DistrictFactory.createDistrict(this.entitiesManager, data.district);
    });
  }

  update(): void {
    // Future: sync component state from simulation updates
  }
}

// DistrictRenderSystem — pure ECS query renderer. No event listeners, no sim knowledge.
export class DistrictRenderSystem implements ISystem {
  constructor(private entitiesManager: EntitiesManager, scene: Scene) {
    this.graphics = scene.add.graphics();
  }

  update(): void {
    this.graphics.clear();
    for (const entity of this.entitiesManager.query('DistrictState')) {
      const d = entity.getComponent<DistrictState>('DistrictState')!;
      this.graphics.fillStyle(d.color, d.alpha);
      this.graphics.fillCircle(d.x, d.y, d.radius);
    }
  }
}
```

**Key Points:**

- SpawnSystem is the simulation bridge: listens for events, creates entities via a factory
- RenderSystem queries entities by component and draws — it does not care how the data arrived
- **Registration order matters:** SpawnSystem must be registered before RenderSystem so entities exist before the first render pass
- When simulation state changes later, only SpawnSystem updates component data; RenderSystem picks it up on the next frame with zero changes

## Component Guidelines

**Components should be:**

1. **Data-only**: No methods that mutate state or have side effects
2. **Serializable**: Plain objects/interfaces (important for save/load)
3. **Flat when possible**: Avoid deep nesting (easier to work with)
4. **Typed**: Use TypeScript interfaces or types, not classes

**Good Component:**

```typescript
export interface BuildingComponent {
  type: "factory" | "warehouse" | "house";
  productionRate: number;
  storageCapacity: number;
  currentStorage: number;
}
```

**Avoid:**

```typescript
export class BuildingComponent {
  constructor(public type: string) {}

  produce(): void {
    // Logic belongs in system, not component
    this.currentStorage += this.productionRate;
  }
}
```

**Naming Convention:** Components should use the `*Component` suffix (e.g., `DistrictComponent`, `FluxComponent`). See [Coding Guidelines](../../coding-guidelines.md) for details.

## System Communication

**Guideline:** Use EventBus for cross-system communication. Avoid direct system-to-system references.

**Example:**

```typescript
// System B depends on System A's output
class SystemA implements ISystem {
  update(): void {
    // Process entities
    EventBus.emit("systemA:processed", { data });
  }
}

class SystemB implements ISystem {
  init(): void {
    EventBus.on("systemA:processed", (data) => {
      // Use System A's output
    });
  }
}
```

**Important:** Register systems in correct order if execution order matters.

## System Lifecycle Details

### init() - One-Time Setup

**Called:** Once, after all systems are registered

**Use for:**

- Event listener setup
- Initial state configuration
- One-time rendering (static backgrounds, UI)

**Example:**

```typescript
init(): void {
  // Set up event listeners
  EventBus.on('game:input:drag', this.handleDrag);

  // Configure Phaser objects
  this.camera.setBackgroundColor('#1a1a2e');

  // Initial render
  this.render();
}
```

### update(delta) - Per-Frame Logic

**Called:** Every frame by Phaser's game loop

**Parameters:**

- `delta`: Time elapsed since last frame (milliseconds)

**Use for:**

- Entity processing based on component state
- State updates that depend on time
- Emitting state change events

**Example:**

```typescript
update(delta: number): void {
  // Query entities
  const entities = this.entitiesManager.query('Movement', 'Transform');

  entities.forEach(entity => {
    const movement = entity.getComponent<Movement>('Movement');
    const transform = entity.getComponent<Transform>('Transform');

    // Update position based on velocity and delta time
    transform.x += movement.velocityX * (delta / 1000);
    transform.y += movement.velocityY * (delta / 1000);
  });
}
```

**Performance Note:** `update()` runs every frame (~60 times/second). Keep logic efficient.

## Next Steps

- **Architecture**: See [Systems & Components](systems-and-components.md) for ISystem interface and SystemsManager
- **Services Layer**: Use services for global singleton concerns that don't operate on entities
- **Event Communication**: See [EventBus Overview](../events/overview.md) for type-safe event patterns
- **ECS Fundamentals**: See [ECS Pattern](ecs-pattern.md) for entity/component basics
