# Fluxpolis

A browser-based economic simulation game where players manage supply chains, optimize production networks, and balance market dynamics.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The dev server will start at `http://localhost:5173` (default Vite port).

## Project Structure

This is a monorepo using npm workspaces with two packages:

- **`@fluxpolis/simulation`** - Pure TypeScript simulation engine (environment-agnostic)
- **`@fluxpolis/client`** - Browser client with Phaser renderer and UI

See [CLAUDE.md](./CLAUDE.md) for development guidelines and architecture details.

## Documentation

- [Game Design Document](./docs/gdd.md) - Complete game concept and mechanics
- [Technical Guidelines](./docs/tech-guidelines.md) - Architecture and implementation details
- [CLAUDE.md](./CLAUDE.md) - Development guidelines for AI assistance

## Tech Stack

- TypeScript (strict mode)
- Phaser 3 (Canvas 2D rendering)
- Vite (build tool)
- npm workspaces (monorepo)

## License

MIT
