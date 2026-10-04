# Phase 761 — Highest Boundary Provenance Judgment

## Frontier

The DTS frontier exposed a semantic-model leak rather than a missing cast:
`ResolvedRouteBoundaryOptions.sourceLine` was still a host `number`, while the canonical
`RouteProvenanceContract` already requires the nominal `SourceLineNumber`/`NumberValue` ADT.

## Elevation

The raw boundary remains a source-facing compatibility perimeter, but normalization now happens
immediately at the boundary:

`RouteBoundaryOptions.sourceLine: number`
→ `numberValue(...)`
→ `ResolvedRouteBoundaryOptions.sourceLine: RouteProvenanceContract["sourceLine"]`
→ `RouteProvenanceContract.sourceLine`

The resolved semantic authority therefore carries no free primitive source-line value.
The provenance builder consumes the canonical value rather than manufacturing a second semantic
representation.

## Architectural rule

A host primitive may exist only at the external/source evidence perimeter. Once evidence enters the
resolved semantic model, it must be represented by the closed nominal ADT already used by the
upstream semantic vocabulary.

## Legacy parsed descriptor state

The five known parsed-AST/legacy semantic reservoirs remain empty. They are not reintroduced as a
compatibility path.
