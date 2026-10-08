# Phase 1209 — Compositional Interface Algebra Public Surface

The upstream semantic capability algebra is now treated as a compositional contract surface, not only an internal type decomposition.

## Direction

`upstream semantic capability -> data-flow authority -> downstream projection -> manifest / graph / IR / CLI`

The producer/consumer role is relational: an interface may consume an upstream contract while exposing a stronger contract to the next stage. The authority remains upstream; downstream interfaces only project or query already-closed semantic state.

## Public surface

The core barrel exports:

- semantic capability algebra facets
- semantic capability projection boundary
- data-flow closure/authority contracts
- data-flow capability authority
- data-flow projection contracts
- generic interface dependency boundary

This prevents consumers from having to import internal files to participate in the compositional algebra.

## Data-flow relation

Calculus-style data-flow analysis separates transfer/propagation, lattice state, dependency, fixed-point convergence, and query. MLIR follows the same separation: the solver orchestrates analyses and reaches a fixed point, while analyses provide transfer behavior and state. CodeQL likewise distinguishes semantic data-flow nodes from AST structure and exposes source/sink flow through a generic data-flow solver.

RouteSync therefore keeps `DataFlowInterface` as the producer/execution surface and `DataFlowAuthorityInterface` as the read-only consumer surface. `DataFlowCapabilityProjectionInterface` composes semantic capability with that authority without allowing downstream reclassification.
