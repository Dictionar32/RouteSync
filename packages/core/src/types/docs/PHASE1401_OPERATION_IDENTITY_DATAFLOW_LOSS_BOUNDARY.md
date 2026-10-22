# Phase 1401 — Operation identity and dataflow loss boundary

## Trace result

- `OperationIdentityCapabilityContract` remains the upstream semantic contract and carries identity, evidence, derivation, provenance, closure, and semantic reasoning.
- `operationIdentityProjection` is a wiring boundary. It intentionally narrows the rich capability to the SDK-safe `OperationIdentityReference` (`key`, `method`, `path`).
- Before this phase, that narrowing was implicit. The projection contract now declares `identity_reference_only`, the fields preserved, and the proof fields omitted from the compact reference. The omitted proof remains on the upstream capability; the projection does not claim to reconstruct it.
- `SemanticDataflowJudgment` retains facts, closure, derivations, paths, fixed-point status, and reasoning contract. `createSemanticDataflowDataFlowInterface` forwards the same judgment object as both input and state and carries its reasoning contract. IR consumes this closed authority surface.
- AST, semantic dataflow, and structural graph remain distinct representations; no assumption is made that AST identity equals dataflow identity.

## Architecture invariant

`upstream evidence -> semantic reasoning authority -> closed capability/judgment -> explicit loss-aware wiring contract -> runtime/SDK/React/manifest/graph/IR projection`. A narrow downstream reference is permitted only when its information loss is explicit in the projection contract. Downstream consumers must not reconstruct omitted evidence or reclassify the source.

## Validation

Run `npm run audit:phase1401-operation-identity-dataflow-loss-boundary`. This is a static source audit, not a substitute for the TypeScript 7 / tsdown build.
