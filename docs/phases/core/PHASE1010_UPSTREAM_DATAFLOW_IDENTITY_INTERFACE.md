# Phase 1010 — Upstream Dataflow Identity Interface Alignment

Phase 1010 tightens the upstream dataflow interface without introducing a second solver.

## Changes

- `SemanticDataflowIdentityKey` is now the canonical comparison vocabulary for dataflow identities.
- `semanticDataflowIdentityKey()` is the single identity-key constructor used by the fixed-point authority and IR projection.
- The authority no longer compares serialized whole identity objects for reachability/equality.
- IR node/relation IDs are derived from the same canonical identity key instead of maintaining a second formatter.
- `createSemanticDataflowInput()` accepts the typed upstream producer role. The controller producer is explicit at the controller boundary; the legacy analyzer keeps the controller default for compatibility.

## Boundary

```text
upstream producer
  -> SemanticDataflowIdentity
  -> SemanticDataflowInput (seed facts only)
  -> SemanticDataflowJudgment (single least-fixed-point authority)
  -> SemanticDataflowInterface
       |-> Manifest surface
       |-> Graph-independent semantic flow
       `-> IR projection
```

No migration dataflow interface, graph dataflow solver, model-relation dataflow solver, or second closure authority is introduced.

## Identity/provenance rule

`SemanticDataflowIdentity` remains the stable semantic locator for an expression/dataflow node. `SemanticDataflowLineage.source` remains provenance. Consumers compare identities through `SemanticDataflowIdentityKey`, never by serializing the entire identity object.

This follows the external pattern where CodeQL exposes a semantic data-flow graph independently from AST structure, MLIR keeps analyses generic behind interfaces and a central solver, and Soufflé treats facts as typed relations with recursive closure. Laravel relation keys remain schema/model semantics rather than source-position identity.

## Fixture trace

The ecommerce fixture continues to prove the independent upstream lanes:

```text
migration foreignId('order_id')->constrained()
  -> schema/FK evidence
  -> ModelSemanticRelation
  -> GraphSemanticRelation
```

and:

```text
controller semantic knowledge
  -> SemanticDataflowInput
  -> SemanticDataflowJudgment
  -> SemanticDataflowInterface
  -> Manifest / IR projections
```

These lanes are intentionally not collapsed into a migration-to-dataflow solver.
