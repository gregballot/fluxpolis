# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Documentation

- **Game Design**: See `docs/gdd.md` for complete game concept and design
- **Technical Architecture**: See `docs/tech-guidelines.md` for detailed technical specifications

## Project Structure

To fill out later

**Commands**:

- `npm run dev` - Start Vite dev server (client package)
- `npm run build` - Build simulation then client

## Technical Guidelines for Development

### Tech Stack Requirements

- **Language**: TypeScript (strict mode)
- **Platform**: Browser-first, Electron-compatible
- **Build Tool**: Vite
- **Repository Structure**: Monorepo with npm workspaces
- **UI Framework**: Vue 3 (integrated with Phaser via official template)
- **Rendering**: Phaser 3 (Canvas 2D) integrated with Vue 3

### Architectural Guidelines

Fill out later (reference other md files with architecture guidelines)

### Development Approach

- **Pragmatism Over Purity**: Ship working prototype, document trade-offs
- **Future-Proof Architecture**: Design supports multiplayer/3D renderer without implementing them
- **Walking Skeleton**: Build minimum viable features end-to-end before adding complexity
