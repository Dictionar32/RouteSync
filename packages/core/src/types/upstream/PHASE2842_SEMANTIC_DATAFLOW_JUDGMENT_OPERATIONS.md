# Phase 2842 — Semantic Dataflow Judgment Operations

## Scope

This phase continues the live CLI-to-manifest trace through `semanticDataflowManifestSurface` and the existing upstream `semanticDataflowReasoningAuthority`. It evolves the existing `SemanticDataflowJudgment` contract rather than introducing a parallel judgment or authority.

## Contract changes

- Added `SemanticDataflowJudgmentOperationsInterface` to the judgment ADT.
- Each authority-produced judgment now carries frozen domain operations: `containsFact`, `reaches`, and `pathsBetween`.
- Operations query the exact closure and paths already carried by that judgment. They do not derive new facts, re-run closure, repair incomplete evidence, or collapse admission outcomes.
- Removed the duplicate primitive `reasoning: 'declarative_relation_rewrite_fixed_point'` label from the semantic-dataflow judgment. The typed `reasoningContract` remains because the admission boundary validates its evidence, derivation, provenance, and closure facets; this is not a claim that all reasoning-shaped metadata across RouteSync has been removed.
- Admission continues to verify the typed reasoning proof contract and fixed-point closure marker, rather than depending on the removed primitive label.
- `packages/core/src/types/upstream/collections.ts` remains empty.

## Runtime trace

`CLI scan/sync` → manifest builder → source-AST projection → `semanticDataflowManifestSurface.judgmentsFromInputs` → `semanticDataflowReasoningAuthority.judge` → judgment carrying domain operations → semantic dataflow admission / consumers.

## Example

```ts
const judgment = semanticDataflowReasoningAuthority.judge(input);
const hasFact = judgment.operations.containsFact(candidateFact);
const canReach = judgment.operations.reaches(sourceIdentity, targetIdentity);
const matchingPaths = judgment.operations.pathsBetween(sourceIdentity, targetIdentity);
```

The operations are queries over already-produced judgment evidence. They do not substitute for admission, and consumers should still call the existing boundary before trusting externally supplied judgments.

## Verification boundary

The accompanying audit checks source structure only. A passing audit does not prove a complete project typecheck or end-to-end CLI run.
