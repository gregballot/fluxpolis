# Features

## Map & World

- Map generation with randomly placed resource nodes
- Grid-based world coordinates (meters)
- Resource nodes (food type)

## Simulation

- Time progression (year, day, hour)
- Tick-based simulation updates
- Spatial queries with influence radius
- Collision detection for building placement

## Districts

- Place districts on the map
- Automatic flux creation to nearby places
- Food consumption and worker generation
- Spatial influence radius

## Resource Flows (Flux)

- Food flows from resource nodes to districts
- Worker flows from districts to resource nodes
- Distance-based flow mechanics
- Capacity-limited flows
- Gradual fill and delivery per tick

## Rendering

- Hexagonal map grid display
- Resource node visualization with type-specific colors
- District visualization (hexagonal tiles)
- Flux visualization (animated lines between places)

## Interaction

- Click on districts to view info panel
- Click on resource nodes to view info panel
- Build mode for placing districts
- Camera pan and zoom controls

## UI

- Entity info panels showing live simulation state
- Simulation time display (formatted year/month/day/hour)
- Simulation controls (pause/play, speed adjustment)
- Debug panel for development
- Camera position display
