# Systems and Components

**Status:** Current Implementation
**Last Updated:** February 2026

## Overview

This document covers system architecture and interfaces. For implementation patterns and examples, see [System Patterns](system-patterns.md).

**Topics:**

- **ISystem Interface**: System lifecycle contract
- **SystemsManager**: System registration and orchestration
- **Core vs Features**: Where to place systems and components

## ISystem Interface

**Location:** `packages/client/src/game/core/systems/ISystem.ts`

```typescript
export interface ISystem {
  init(): void; // Required: one-time setup
  update?(delta: number): void; // Optional: per-frame logic
  render?(): void; // Optional: rendering
}
```

**Lifecycle:**

1. **Constructor**: Receive dependencies (EntitiesManager, Scene, EventBus, etc.)
2. **init()**: Called once by SystemsManager after all systems are registered
3. **update(delta)**: Called every frame by Phaser's update loop
4. **render()**: Optional method exists in interface but is not currently invoked by GameScene (SystemsManager.render() is never called)

## SystemsManager

**Location:** `packages/client/src/game/core/systems/SystemsManager.ts`

**Purpose:** Manages system lifecycle and invokes system methods.

```typescript
export class SystemsManager {
  addSystems(...systems: ISystem[]): void;
  init(): void; // Calls init() on all systems
  update(delta: number): void; // Calls update(delta) on all systems
  render(): void; // Exists but not called by GameScene
}
```

**Usage in GameScene:**

```typescript
export class GameScene extends Phaser.Scene {
  create(): void {
    this.systemManager = new SystemsManager();

    // Add all systems
    this.systemManager.addSystems(
      new MapRenderSystem(this.entitiesManager, this),
      new CameraSystem(this.cameras.main),
    );

    // Initialize all systems
    this.systemManager.init();
  }

  update(_time: number, delta: number): void {
    // Delegate to all systems
    this.systemManager.update(delta);
  }
}
```

**System Execution Order:**

- Systems execute in registration order
- If order matters, register systems in the correct sequence
- Currently no priority system (to add if needed)

## Decision Matrix: Core vs Features

| Question                                | Answer | Location                   |
| --------------------------------------- | ------ | -------------------------- |
| Is it reusable across different games?  | Yes    | `core/systems/`            |
| Is it reusable across different games?  | No     | `features/{feature-name}/` |
| Does it handle engine concerns?         | Yes    | `core/systems/`            |

**Examples:**

- **Core**: CameraSystem, InputService (generic, game-agnostic)
- **Features**: DistrictRenderSystem, BuildModeSystem (Fluxpolis-specific)

## System Communication

**Guideline:** Use EventBus for cross-system communication. Avoid direct system-to-system references.

See [System Patterns - System Communication](system-patterns.md#system-communication) for examples.

## Next Steps

- **Implementation Patterns**: See [System Patterns](system-patterns.md) for ECS Query, Event-Driven, and Simulation-Driven patterns
- **Component Guidelines**: See [System Patterns - Component Guidelines](system-patterns.md#component-guidelines) for best practices
- **ECS Fundamentals**: See [ECS Pattern](ecs-pattern.md) for entity/component basics
- **Services Layer**: Use services for global singleton concerns that don't operate on entities
