# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fluxpolis is a cyberpunk city-building game built in a monorepo structure. The architecture is separated into four distinct packages:

- **Types Layer** (`@fluxpolis/types`): Shared type definitions used across all packages (no dependencies, types only)
- **Events Layer** (`@fluxpolis/events`): Type-safe event system shared across all layers, defines event contracts via EventMap
- **Client Layer** (`@fluxpolis/client`): Handles rendering and UI using an ECS-inspired pattern with Phaser 3 and Vue 3
- **Simulation Layer** (`@fluxpolis/simulation`): Pure game logic with zero rendering dependencies, using a manager pattern with tick-based updates

Communication between layers is **event-driven via EventBus** - there is zero direct coupling. This separation ensures the simulation can run independently and the client focuses purely on presentation.

See `docs/architecture/` for detailed implementation patterns.

## Methodology

If asked to work on an issue, first use `gh cli` to get the issue details.

**Documentation-First:**

- Review relevant project docs before planning based on the task type:
  - Working on client features? Start with `docs/architecture/client/overview.md`
  - Working on simulation logic? Start with `docs/architecture/simulation/overview.md`
  - Need TypeScript patterns? Check `docs/coding-guidelines.md`
- Look for existing implementation examples in the project if more context is needed
- Search for similar patterns before proposing new approaches

**Check Architectural Tradeoffs:**

- **IMPORTANT**: Review `docs/tradeoffs.md` before making architectural decisions that deviate from simple patterns
- Tradeoffs must make strong, measurable sense - avoid premature complexity
- When proposing new tradeoffs, explain the problem, alternatives considered, and clear reasoning
- Document significant tradeoffs in `docs/tradeoffs.md` for future reference

**Ask Questions:**

- When uncertain, ask to clarify intent and help make sound technical choices
- Suggest approaches to debate when multiple valid solutions exist

**Keep Docs Synchronized:**

- Update relevant docs when introducing new architectural patterns or changes
- Update docs when creating reusable components that others should know about
- Keep code examples in docs consistent with actual implementation

## Quick Reference

**Commands:**

- `npm run dev` - Start Vite dev server (client package)
- `npm run build` - Build events, simulation, then client
- `npm run type-check` - Type check all packages (events, simulation, client)

**Tech Stack:**

- **Language**: TypeScript (strict mode)
- **Platform**: Browser-first, Electron-compatible
- **Build Tool**: Vite
- **Repository Structure**: Monorepo with npm workspaces
- **UI Framework**: Vue 3 (integrated with Phaser via official template)
- **Rendering**: Phaser 3 (Canvas 2D) integrated with Vue 3

## Documentation Index

**Architecture:**

- **Client Layer** (`docs/architecture/client/`) - ECS pattern, Phaser + Vue integration, systems and components, directory structure
- **Simulation Layer** (`docs/architecture/simulation/`) - Pure game logic, manager pattern, event-driven updates, tick-based simulation
- **`docs/tradeoffs.md`** - Architectural tradeoffs and design decisions (review before deviating from simple patterns)

**Coding:**

- **`docs/coding-guidelines.md`** - TypeScript conventions, naming patterns, architectural principles

See `docs/_sidebar.md` for complete navigation and all available documentation.

## Documentation Synchronization

When making architectural changes:

- Update relevant docs in `docs/architecture/` to reflect new patterns
- Keep code examples in docs consistent with actual implementation
- Document significant decisions for future context
- **IMPORTANT:** Update `docs/features.md` when adding new features

**Critical:** Architecture changes must be documented. Code and docs must stay synchronized.

## Documentation guidelines

Docs need to be very concise and to the point. No fluff. When documenting technical details, use code snippets to illustrate the point.
Prefer linking to other documents instead of repeating information.
