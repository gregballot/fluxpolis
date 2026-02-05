# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a game project that is being developed using Phaser 3 and Vue 3. The game is a city-building style game where the player can build and manage a cyberpunk cities. The game is being developed using a monorepo structure with npm workspaces.

## Quick Reference

**Commands:**

- `npm run dev` - Start Vite dev server (client package)
- `npm run build` - Build simulation then client

**Tech Stack:**

- **Language**: TypeScript (strict mode)
- **Platform**: Browser-first, Electron-compatible
- **Build Tool**: Vite
- **Repository Structure**: Monorepo with npm workspaces
- **UI Framework**: Vue 3 (integrated with Phaser via official template)
- **Rendering**: Phaser 3 (Canvas 2D) integrated with Vue 3

## Documentation Index

### Current Architecture

**Start here for understanding the actual implementation:**

- **`docs/architecture/client/overview.md`** - Big picture: directory structure, layer responsibilities, core vs features organization
- **`docs/architecture/client/ecs-pattern.md`** - Entity-Component-System fundamentals
- **`docs/architecture/client/systems-and-components.md`** - Systems and Components: core vs features, ISystem interface
- **`docs/architecture/client/vue-phaser-integration.md`** - How Vue and Phaser coexist and communicate

### Coding Guidelines

- **`docs/coding-guidelines.md`** - Coding conventions, TypeScript patterns, naming conventions

## Architecture Evolution Process

When the current architecture is challenged or significantly changed:

1. **Document the Decision**: Create an Architecture Decision Record (ADR) in `docs/architecture/decisions.md`
   - Include: Context, Decision, Consequences, Status
2. **Update Documentation**: Modify relevant architecture docs to reflect the new approach
3. **Preserve History**: Don't delete old docs - add disclaimers and move to historical context if needed

**Critical:** Architecture changes must be documented. Code and docs must stay synchronized.

## Documentation guidelines

Docs need to be very concise and to the point. No fluff. When documenting technical details, use code snippets to illustrate the point.
Prefer linking to other documents instead of repeating information.
