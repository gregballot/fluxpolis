# Fluxpolis

[![CI](https://github.com/gregballot/fluxpolis/actions/workflows/ci.yml/badge.svg)](https://github.com/gregballot/fluxpolis/actions/workflows/ci.yml)

A browser-based economic simulation game where players manage supply chains, optimize production networks, and balance market dynamics.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run documentation server
npm run docs
```

## Project Structure

This is a monorepo using npm workspaces with two packages:

- **`@fluxpolis/simulation`** - Pure TypeScript simulation engine (environment-agnostic)
- **`@fluxpolis/client`** - Browser client with Phaser renderer and UI
- **`@fluxpolis/eventbus`** - Event bus for communication between packages

See [CLAUDE.md](./CLAUDE.md) for development guidelines and architecture details.

## Documentation

- [Tech Doc](./docs) - Coding style, Design patterns, Architecture
- [CLAUDE.md](./CLAUDE.md) - Development guidelines for AI assistance

## Tech Stack

- TypeScript (strict mode)
- Phaser 3 (Canvas 2D rendering)
- Vite (build tool)
- npm workspaces (monorepo)

## License

Proprietary
