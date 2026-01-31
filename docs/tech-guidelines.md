# GAME DESIGN DOCUMENT

**Working Title:** Fluxpolis

*Version 1.0 - Initial Concept*

**Document Date:** January 31, 2026

**Status:** Early Concept / Pre-Production

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Game Overview](#2-game-overview)
3. [Core Gameplay](#3-core-gameplay)
4. [Progression Systems](#4-progression-systems)
5. [Simulation & Systems](#5-simulation--systems)
6. [Technical Architecture](#6-technical-architecture)
7. [Future Vision (Post-V1)](#7-future-vision-post-v1)
8. [Development Roadmap](#8-development-roadmap)
9. [Open Questions & Design Decisions](#9-open-questions--design-decisions)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 High-Level Concept

A contemplative city-building and automation game that combines the creative satisfaction of building with the puzzle-solving challenge of optimization. Players design interconnected cities and production networks, then watch their creations come to life through organic simulation.

### 1.2 One-Sentence Pitch

Build interconnected societies from settlements to nations, where meaningful choices create unique civilizations that automate and thrive before your eyes.

### 1.3 Target Platform

Browser-based game (Web) with potential for MMO expansion in later versions.

### 1.4 Core Design Pillars

- **Creative Phase → Puzzle Phase:** Build organically, then optimize functionally
- **Contemplative Satisfaction:** Watch well-designed systems running smoothly
- **Hierarchical Growth:** Small settlements expand into interconnected regional networks
- **Meaningful Trade-offs:** No single "correct" path, every choice has texture
- **Data-Driven Decisions:** Rich metrics inform organic problem-solving

---

## 2. Game Overview

### 2.1 Genre & Inspiration

**Primary Genre:** City-Building / Economy Management / Automation

**Key Inspirations:**

- **Transport Fever:** Complex interconnected transport networks, high-speed core connections with suburban branches
- **Cities Skylines:** "Painting on a canvas" creativity while maintaining functional systems
- **Satisfactory:** Modular factory design, hierarchical transport (belts/trucks/trains/drones), enclosed purpose-built facilities
- **Two Point Museum:** Aesthetic coherence, watching guests flow through designed spaces

### 2.2 Setting & Theme

**Visual Direction:** Modern/near-future with abstract minimalist aesthetic

The game employs a cyberpunk-inspired visual language focusing on:

- Simple geometric shapes and forms
- Atmospheric lighting and mood
- Dark, moody palette with glowing accent colors
- Abstract representation over detailed textures

This approach allows for visual beauty while working within technical constraints of a solo web developer without extensive 2D/3D art skills.

### 2.3 Player Experience Goals

The core player fantasy is to:

- Create something beautiful and intentional
- Solve emergent puzzles through creative solutions
- Experience the satisfaction of watching a well-designed system run smoothly
- Build societies with unique personality through meaningful choices
- Scale from intimate city management to regional/national governance

---

## 3. Core Gameplay

### 3.1 Core Loop

#### Phase 1: Creative Building

- Place settlements, production facilities, and infrastructure
- Design transport networks and connections
- Establish resource flows and trade routes

#### Phase 2: System Observation

- Watch resources flow through your network
- Monitor metrics and system performance
- Identify bottlenecks and inefficiencies

#### Phase 3: Iterative Optimization

- Solve emergent problems creatively
- Refine systems while preserving aesthetic intent
- Add bypasses, hubs, or alternative routes

#### Phase 4: Scaling & Expansion

- Use successful systems to expand into new regions
- Integrate new cities into existing networks
- Delegate management of stable systems

### 3.2 The First 5 Minutes

**Start Options:**

- **Blank Canvas:** Start with completely empty terrain
- **Existing Region:** Begin near a few established towns (provides inspiration and avoids blank page syndrome)

**Guided Opening Sequence:**

A natural tutorial that introduces core systems organically:

1. Place your first settlement/outpost
2. Settlement needs resources - connect to a source
3. Build production facility to generate resources
4. Establish transport link to move goods

This introduces all three core elements (urban, production, transport) without forcing the player to choose a specialization track upfront.

### 3.3 Core Puzzle Elements

The heart of the gameplay revolves around interconnected challenges:

#### Primary: Network Optimization + Resource Balancing

- Cities and facilities have inputs and outputs
- Design elegant hierarchical transport networks
- Balance supply chains across growing territories
- Example: City A produces steel, City B needs steel but produces food, City C needs food

#### Secondary: Growth Management

- What works locally might break regionally - forces modular redesign
- Early game: Direct connections work fine
- Mid game: Regional hubs become necessary
- Late game: Continental/national logistics layers

#### Tertiary: Spatial & Aesthetic Organization

- Modular, clean layouts satisfy the builder
- "Does this look like a real, intentional system?"
- Organic builds with character > rigid grids

### 3.4 Automation & Delegation System

**Philosophy:**

Rather than pure automation, the game features a **delegation system** that evolves as you scale.

#### Early Game (Hands-On)

- Manually set up production, routes, connections
- Learn systems through direct interaction
- Direct control with immediate feedback

#### Mid Game (Delegation)

- Establish entities (operations departments, companies, local governments)
- Set policy parameters: "maximize supply" vs "prioritize profit" vs "just meet demand"
- Systems run autonomously within guidelines
- Shift focus from micro to macro management

#### Late Game (Governance)

- Autonomous systems grow and adapt organically
- Systems surface issues requiring strategic decisions
- Focus on bottlenecks and high-level optimization
- Similar to SimCity 4 region view - managing the big picture

#### V1 Implementation Approach

*For the walking skeleton:*

- **Gameplay Layer:** Simple automation - things "just work" once properly set up
- **Architecture Layer:** Delegation entities exist under the hood making decisions
- **Future Expansion:** V2+ exposes these systems as player-controllable features

---

## 4. Progression Systems

### 4.1 Progression Philosophy

Progression mirrors scale. City-level tools unlock at city scale, regional coordination tools unlock at regional scale. This ensures the core gameplay isn't abandoned as you grow - you're adding layers above it, not replacing it.

### 4.2 Organic Unlocks (Primary)

**Achievement-Based:**

- "Transported 10 different cargo types" → Sorting facility unlocked
- "Connected 5 cities" → Regional hub building unlocked
- "Population reached 50,000" → Advanced infrastructure options

**Investment/Research:**

- Players can invest research capital to accelerate unlocks
- Can force progression into specific branches even without prerequisites
- Mix of natural progression + strategic choice

### 4.3 Geographic Expansion

**Core Scaling Path:**

- Settlement → City → Region → State → Nation
- (Planet/Solar System scale is aspirational for future versions)

**Expansion Mechanics:**

- Purchase neighboring land
- Win cities through influence or other means
- Integrate new areas into existing networks (NOT starting over)

**Regional Characteristics:**

Each new region has unique properties:

- **Resource-Rich:** Great for extraction and production
- **Population Centers:** High capacity for growth and labor
- **Balanced:** Moderate in all aspects
- **Strategic:** Important for military, trade routes, or political influence

### 4.4 Hierarchical Technology Trees

Different technology trees correspond to different scales of operation:

- **City-Level Tech:** Building types, local infrastructure, zoning options
- **Region-Level Tech:** Inter-city transport, regional hubs, coordination systems
- **Nation-Level Tech:** Continental logistics, political systems, large-scale policies

This prevents overwhelming players with one massive tech tree and naturally gates complexity as the player's territory expands.

---

## 5. Simulation & Systems

### 5.1 Meaningful Trade-offs

**Core Philosophy:** No objectively "correct" choices. Every decision creates texture and consequences.

**Example Trade-off Systems:**

| Decision | Benefits | Costs |
|----------|----------|-------|
| High Density Urban | Efficient land use, high economic output | Increased crime, stress, pollution |
| Rural/Sprawling | Higher quality of life, less stress | Limited services, education access |
| Democratic Governance | Higher happiness, innovation, serendipity | Slow decision-making, less control |
| Authoritarian Governance | Fast changes, efficient execution | Lower happiness, suppressed innovation |

### 5.2 Metrics & Data-Driven Gameplay

Metrics are **core to the gameplay**, not just UI polish. The game provides rich data visibility at progressive levels of detail.

#### Essential Metrics (Always Visible)

- Population happiness
- Economic health (income/expenses)
- Resource flow rates
- Growth trajectory

#### Advanced Metrics (Deep Dive)

- Transport efficiency by route
- Production chain bottlenecks
- Demographic breakdowns
- Historical trend analysis

#### Visualization Methods

- **Map Overlays:** Heatmaps, flow visualization, problem areas
- **Dashboard Panels:** Charts, graphs, tabular data
- **Detail Views:** Drill-down into specific facilities or routes

*Design Goal: Simple on the first layer but capable of spreadsheet-level depth for those who want it.*

#### Impact on the Simulation

All facilities and buildings are influenced by those metrics. High crime will reduce output for an industrial facility or supply line. Happiness will increase productivity. Education can allow unlocking advanced industries and so on.

### 5.3 Failure States & Challenge

**Philosophy: "Challenging Sandbox"**

The game avoids both extremes:

- **NOT** pure creative mode (consequences matter)
- **NOT** punishing failure (destroys contemplative satisfaction)

#### V1 Implementation: Soft Failure

- Cities can stagnate but won't catastrophically collapse
- Negative spirals are visible and gradual (declining happiness, slowing growth, rising costs)
- Players have tools to recover, but with trade-offs
- You can get stuck/blocked but always have options to adapt

#### Future: Bailout/External Help Mechanic (V2+)

When in serious trouble:

- Accept help from external corporation/organization
- Help comes with strings: debt, policy constraints, influence
- New challenge: dig yourself out while operating under constraints
- Turns failure into a new puzzle rather than game over

---

## 6. Technical Architecture

### 6.1 Platform & Technology Stack

**Target Platform:** Browser (Web)

#### Backend (Game Simulation)

- **Technology:** Node.js with Fastify framework
- **Purpose:** Authoritative game state, simulation logic
- **Rationale:** Source of truth must be server-controlled to prevent cheating and enable future multiplayer

#### Frontend (UI & Client Prediction)

- **UI Framework:** Vue or React (TBD)
- **Game View:** TBD - needs research for 2D/3D rendering
- **Client Responsibilities:** Predictable calculations run locally to reduce server load

### 6.2 Rendering Approach

**Current Status:** Undecided - requires research

**Considerations:**

- 2D vs 3D: Both viable given abstract minimalist art direction
- 3D options: Three.js, Babylon.js
- 2D options: Canvas, WebGL, Pixi.js
- Priority: Simple geometry, atmospheric lighting, performance at scale

### 6.3 Development Methodology

**Walking Skeleton Approach**

- Iterative development with rapid testing cycles
- Build minimum viable features end-to-end before adding complexity
- Regular playable builds to validate fun factor
- Architecture designed for future multiplayer but V1 is single-player

---

## 7. Future Vision (Post-V1)

### 7.1 MMO City-Building Concept

**Long-term Aspiration:** A massively multiplayer city-building experience where players coexist, trade, and influence shared economies.

**Potential Features:**

- Players build adjacent to or near other players' cities
- Trade goods and resources between player nations
- Shared economic markets and price dynamics
- Cooperative or competitive relationships
- Different player nations with different governance philosophies interacting

*Note: This significantly increases complexity and is not part of V1 scope. Backend architecture will be designed with this in mind but implementation is far future.*

### 7.2 Planetary/Solar System Scale

**Aspirational Goal:** Expand beyond nation-building to planetary and interplanetary scale.

**Key Challenge:** Ensuring this doesn't kill the satisfying micro-gameplay that makes the early game engaging.

**Reference:** Similar to Spore's scaling issue where galactic phase felt disconnected from earlier stages.

**Approach if Implemented:**

- Maintain ability to zoom into any city/region and manage details
- Planetary governance adds new layer without replacing city management
- New mechanics specific to space logistics (travel time, resource scarcity)

---

## 8. Development Roadmap

### 8.1 Version 1.0 - Walking Skeleton (Core MVP)

**Goal:** Create a playable core loop that demonstrates the fundamental game concept.

#### Core Features

- Place settlements and basic production facilities
- Establish simple transport connections
- Basic resource flow (1-2 resource types)
- Simple automation (routes work once built)
- Essential metrics display (happiness, productivity, services)
- Minimal UI for building and observing

#### Under the Hood

- Delegation entities exist in simulation (not exposed to player yet)
- Backend handles authoritative game state
- Architecture allows for future multiplayer (but not implemented)

#### Success Criteria

- Can build a small network of 2-3 connected settlements
- Resources visibly flow between locations
- Can identify and solve a simple bottleneck
- Experience feels satisfying to watch

### 8.2 Version 2.0 - Depth & Systems

- Expand resource types and production chains
- Add society/civilization metrics (governance types, quality of life trade-offs)
- Expose delegation systems as player-controllable features
- Implement organic unlock/progression system
- Add advanced metrics and visualization
- Soft failure mechanics (stagnation, bailout system)

### 8.3 Version 3.0 - Scale & Geography

- Geographic expansion mechanics
- Hierarchical growth (city → region → state → nation)
- Regional characteristics and unique properties
- Scale-appropriate technology trees
- Macro-level governance tools

### 8.4 Version 4.0+ - Multiplayer & Beyond

- MMO implementation (shared world, player interaction)
- Player-to-player trade and economics
- Potentially: planetary/solar system scale (if micro-gameplay can be preserved)

---

## 9. Open Questions & Design Decisions

### 9.1 Technical

- **Rendering Engine:** Which framework/library for game view? 2D or 3D?
- **UI Framework:** Vue vs React for interface
- **Performance:** How to handle simulation of large-scale networks in browser?

### 9.2 Gameplay

- **Transport Types:** What transport methods? (roads, rail, air, water?)
- **Resource Depth:** How many resource types in V1? How complex should production chains be?
- **Time Scale:** Real-time, speed controls, or tick-based?
- **Camera/Perspective:** Top-down, isometric, free-rotating 3D?

### 9.3 Design Philosophy

- **Save System:** Multiple saves? Auto-save only? Cloud saves from start?
- **Player Guidance:** How much tutorial? In-game advisor/counselor system?
- **Challenge Balance:** Exact mechanics for stagnation and recovery

### 9.4 Art Direction Details

- **Color Palette:** Specific color scheme for cyberpunk aesthetic
- **Building Styles:** How abstract? Recognizable shapes vs pure geometry?
- **Animation:** What needs to be animated for "watching" satisfaction?

---

## 10. Appendices

### 10.1 Reference Games Analysis

#### Transport Fever

- **Takes from it:** Network complexity, hierarchical routing (high-speed backbone + suburban branches)
- **Improves on:** Add more city-building depth beyond pure transport

#### Cities Skylines

- **Takes from it:** Creative building satisfaction, functional beauty balance
- **Improves on:** More emphasis on production/automation, meaningful societal trade-offs

#### Satisfactory

- **Takes from it:** Modular design, hierarchical transport scales, set-and-forget satisfaction
- **Improves on:** Add city/society layer, not just industrial automation

### 10.2 Design Vocabulary

- **Walking Skeleton:** Minimum viable implementation that exercises all layers of architecture
- **Contemplative Gameplay:** Watching well-designed systems run smoothly without constant input
- **Hierarchical Scaling:** Systems that work at small scale evolve into regional/national networks
- **Meaningful Trade-offs:** No objectively correct choices, every decision creates texture
- **Organic Unlocks:** Progression emerges from gameplay achievements, not just grinding

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | January 31, 2026 | Initial concept document created through collaborative design session. Captures core vision, gameplay loops, progression systems, and technical architecture. |

**Notes on This Document:**

This GDD is a living document designed to evolve iteratively as development progresses. Version 1.0 captures the initial design conversation and establishes the core vision. Future versions will add detail, resolve open questions, and document design decisions as they are made through prototyping and testing.