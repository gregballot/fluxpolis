# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Documentation

- **Game Design**: See `docs/gdd.md` for complete game concept and design
- **Technical Architecture**: See `docs/tech-guidelines.md` for detailed technical specifications

## Project Structure

```
fluxpolis/
├── packages/
│   ├── simulation/          # @fluxpolis/simulation
│   │   └── src/
│   │       ├── Simulation.ts
│   │       └── index.ts
│   └── client/              # @fluxpolis/client
│       ├── index.html
│       ├── vite.config.ts
│       └── src/
│           ├── main.ts           # Entry point - initializes all layers
│           ├── event-bus/        # EventBus.ts
│           ├── renderer/         # GameScene.ts (Phaser)
│           └── ui/               # ControlPanel.ts (HTML/CSS)
├── docs/
└── package.json             # Monorepo root with npm workspaces
```

**Commands**:
- `npm run dev` - Start Vite dev server (client package)
- `npm run build` - Build simulation then client

## Technical Guidelines for Development

### Tech Stack Requirements
- **Language**: TypeScript (strict mode)
- **Platform**: Browser-first, Electron-compatible
- **Build Tool**: Vite
- **Repository Structure**: Monorepo with npm workspaces
- **Rendering**: Phaser 3 (Canvas 2D) with future migration path to Three.js

### Architectural Constraints

#### Event-Driven Layer System
The client package implements four layers with event-driven communication:

1. **UI Layer** (`ui/`): HTML/CSS controls outside game canvas
2. **Renderer Layer** (`renderer/`): Phaser GameScene for canvas rendering
3. **Simulation Layer** (`@fluxpolis/simulation`): Pure TypeScript game logic
4. **Event Bus** (`event-bus/`): Event communication between layers

**Projection Layer** (not yet implemented): Will translate simulation state to renderer-agnostic primitives

#### Critical Rules
- **Simulation Package**: Pure TypeScript, no DOM/Node APIs, can run in any environment
- **Type Ownership**: Simulation layer owns all domain types (City, Factory, etc.)
- **No State in Renderer**: All game state lives in Simulation layer
- **Event-Only Communication**: No direct method calls between layers

### Code Conventions

#### TypeScript Standards
- Use `interface` for object shapes and contracts
- Use `type` for unions, utility types, and primitives
- Strict mode enabled throughout

#### Domain Design
- Domain entities (City, Factory, Route) are classes with behavior, not just data
- Avoid unnecessary abstractions - don't create interfaces for single implementations
- Favor composition over inheritance

#### Event System
- Each layer defines its own events (no central registry)
- All events extend base `GameEvent` interface with type and optional timestamp
- Event naming pattern: `{layer}:{action}` (e.g., `simulation:cityCreated`)

### Development Approach
- **Pragmatism Over Purity**: Ship working prototype, document trade-offs
- **Future-Proof Architecture**: Design supports multiplayer/3D renderer without implementing them
- **Walking Skeleton**: Build minimum viable features end-to-end before adding complexity