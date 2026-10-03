# Phase 588 — Analysis Relational Cutover

This phase moves compiler-pass graph analysis from host `Map`/`Set` state and imperative traversal to immutable relation indexes and recursive closure.

## Authority

- pass nodes: `RelationIndex<string, ExecutablePass>`
- artifact producers: `RelationIndex<ArtifactKey, ExecutablePass>`
- artifact adjacency: `RelationIndex<ArtifactKey, readonly ExecutablePass[]>`
- validation: recursive relation constraints
- execution order: recursive ready-layer closure
- cycle detection: empty-ready witness over a non-empty residual relation

## Design direction

The graph is now semantic data. The execution layer consumes derived relations instead of constructing mutable host indexes. This follows the useful separation seen in declarative rewrite and validation systems: the specification describes matches/constraints while an engine derives an executable result.

## Remaining frontier

The next analysis surfaces are `CompilationState`, response analysis, mapper/contract passes, and the semantic type lowering family. Legacy object/class projections remain compatibility boundaries until their relation-native representations are available.
