# RouteSync Phase 208 — Typed Knowledge / Data-Flow Boundary

## Principle

> Naikkan pengetahuan menjadi data model. Jangan menurunkan pengetahuan menjadi control flow.

Semantic decisions are represented as typed immutable knowledge first. Control flow is retained only as an interpreter/traversal mechanism.

## Changes

### Execution layer

`nodeFactories.ts` previously encoded layer knowledge in ordered `if` branches. The knowledge now lives in `EXECUTION_LAYER_KNOWLEDGE` and `detectExecutionLayer()` only interprets it.

### Path parameter type

`inferParamType()` previously encoded identifier-name semantics through chained comparisons. The semantic rules now live in `PARAMETER_TYPE_KNOWLEDGE`.

### Request body policy

Request-body knowledge is not duplicated. `HTTP_METHOD_REGISTRY` remains the source of truth and `REQUEST_BODY_METHODS` is a derived index/projection.

### Existing ADTs

Existing registries and ADTs remain authoritative. `switch`/`if` inside exhaustive matchers are interpreters over already-modeled data, not storage locations for Laravel knowledge.

## Boundary rule

```text
Source / syntax evidence
        ↓
Typed facts + semantic relations
        ↓
Knowledge registries / ADTs
        ↓
Derived indexes (Map/Set allowed)
        ↓
Generic interpreter / traversal
        ↓
IR / generated contract
```

A `Map` is never the semantic source of truth. It is only a derived lookup index.

## Non-goal

Do not mechanically delete every `if`, `while`, or `switch`. Traversal, collection, and exhaustive ADT interpretation are execution mechanics. The prohibited pattern is domain knowledge hidden inside those mechanics.
