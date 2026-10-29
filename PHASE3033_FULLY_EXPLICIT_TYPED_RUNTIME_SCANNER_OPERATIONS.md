# Phase 3033 — Fully Explicit Typed Runtime Scanner Operations

## Purpose

Continue the actual upstream → CLI → manifest generator path by replacing locally serialized source and invocation-shape keys in the invocation semantic authority with domain-owned equality judgments. This is a scoped runtime-path migration, not repository-wide primitive deletion.

## Runtime trace

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan entry.
2. Controller invocation manifest composition delegates to upstream invocation/source inventory and semantic judgment authorities.
3. `packages/core/src/types/upstream/invocationSemanticJudgmentAuthority.ts` validates source evidence and requested invocation shape before semantic judgments are accepted.
4. `semanticSource.same` returns a closed `SemanticSourceEquality` judgment over file path, start/end offsets, and evidence-provider code.
5. `invocationSemanticIdentityOperations.sameShape` returns a closed `InvocationSemanticShapeEquality` judgment over invocation identity, receiver disposition, operation name, ordered arguments, and source provenance.
6. Existing validation obligations, proof traces, effect evidence, and blocker outcomes remain owned by the existing authority; this change does not rebuild or bypass them.

## Implementation

- Extended `SemanticSourceOperationsInterface` with `same` and added `SemanticSourceEquality` as a closed judgment.
- Added interface-backed `invocationSemanticIdentityOperations` with `sameSource` and `sameShape` operations.
- Removed the local `JSON.stringify` source key and composite invocation-shape key from `invocationSemanticJudgmentAuthority.ts`.
- Migrated source provenance membership checks in target-resolution, argument-binding, and effect-flow validation to typed source equality.
- Added a focused Vitest suite covering provider-sensitive source equality and full invocation-shape equality.

## Explicit limits

`KnowledgeId` comparisons still use the existing derived `knowledgeIdKey` representation and are a separate migration candidate. Parser boundary paths and offsets remain primitive inputs. This phase does not claim global elimination of strings, numbers, booleans, `undefined`, `null`, arrays, `reduce`, nullish coalescing, ternaries, or control-flow dispatch. Parser/ADT dispatch should only be changed where the domain model can preserve the same evidence and blocker semantics.

## Verification

Run `npm run audit:phase3033-invocation-semantic-source-identity-domain-operations` for the static contract checks. The focused Vitest test is included, but its execution and full typecheck/Vitest/CLI-to-manifest E2E are not claimed while project dependencies are unavailable. Deleted generic relation foundation modules remain absent, and `packages/core/src/types/upstream/collections.ts` must remain exactly one newline byte.
