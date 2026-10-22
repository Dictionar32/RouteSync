# Phase 1597 — Interface contract closure

## Scope

Interface-only change under `packages/core/src/types/upstream/`. No scanner wiring,
semantic producer, verifier implementation, runtime executor, or downstream projection
was changed.

## Closed interface gaps

1. `RequestTypeDerivationSemanticDecisionPremises` now carries the intended `contract`
   independently of coverage evidence. A `contract_incomplete` witness necessarily has
   `contract: null`; without the separate intended contract, the decision boundary
   could not state which contract was being assessed.
2. Added `RequestTypeDerivationSemanticPipelineAssemblerInterface` and its explicit
   result union. The assembler contract now says it must compare the runtime contract
   values on reasoning, verifier, decision, and authority with the composition contract
   before exposing the consumer pipeline.
3. Contract mismatch is a typed rejection result, rather than an undocumented exception
   or an implicit assumption based only on TypeScript generic compatibility.

## Verification status

- Static source checks: performed by the phase creation command.
- Type test: added, but not executed because the workspace has no local `vitest` binary.
- Package build: not executed because the workspace has no local `tsdown` binary.
- Wiring migration: intentionally not performed; this phase is interface-first only.

## Decision

This phase closes two interface-boundary gaps. It does not claim migration readiness:
concrete reasoning, proof verification, assembly, and end-to-end consumer behavior still
require implementation and verification in a later phase.
