# Fluxpolis Documentation

Welcome to the Fluxpolis documentation. This site contains all technical documentation for the project.

## Quick Links

- **[Coding Guidelines](coding-guidelines.md)** - Coding conventions and patterns
- **[Architecture Overview](architecture/client/overview.md)** - Start here for understanding the codebase

## Architecture Documentation

Fluxpolis is organized into three architectural layers:

**Client Layer** - Rendering and UI

- **[Overview](architecture/client/overview.md)** - Directory structure and layer responsibilities
- **[ECS Pattern](architecture/client/ecs-pattern.md)** - Entity-Component-System fundamentals
- **[Systems & Components](architecture/client/systems-and-components.md)** - How systems and components work
- **[Vue + Phaser Integration](architecture/client/vue-phaser-integration.md)** - How the UI and game engine work together

**Simulation Layer** - Pure game logic

- **[Overview](architecture/simulation/overview.md)** - Tick-based simulation and domain managers

**EventBus Layer** - Communication backbone

- **[Overview](architecture/events/overview.md)** - Events usage and pattern
- **[Type-Safe Events](architecture/events/type-safety.md)** - Usage guide and examples

## Getting Started

Use the sidebar to navigate through the documentation. The search box at the top helps you find specific topics quickly.

## Legacy

- **[Game Design Document](gdd.md)** - Origin game design and tech vision (already outdated)
