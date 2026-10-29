# Phase 3032 — Fully Explicit Typed Runtime Scanner Operations

## Purpose

Continue the real upstream → CLI → manifest path audit without introducing a generic relation foundation. This phase extends the Phase 3031 invocation identity ADT so that identity retains the provenance of each lexical PHP function-name segment, and the source span of malformed name evidence.

## Runtime trace

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the CLI manifest scan operation through an interface-backed exported object.
2. Controller invocation manifest composition continues through the PHP source inventory and semantic judgment batch closure.
3. `packages/core/src/types/upstream/phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts` creates and compares invocation identities through `phpFunctionInvocationEvidenceIdentityOperations`.
4. `packages/core/src/types/upstream/phpFunctionInvocationEvidenceIdentity.ts` now retains typed name segments together with their source spans; malformed syntax retains both its closed reason and source span.
5. Duplicate identity remains a typed batch-closure violation and therefore continues into the existing rejection ledger.

## Domain model change

`PhpFunctionInvocationNameSegmentIdentity` carries `FunctionName` and `SourceSpan` as separately inspectable fields. Named identity comparison checks each segment's typed name and canonical source-span equality. Malformed identity comparison checks both the syntax reason and malformed-evidence source span. The composite identity is not flattened into a delimiter-based string key.

## Explicit limits

This is a scoped domain-model migration, not a claim that all `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty arrays, nullish coalescing, ternaries, `if`, or `switch` constructs have disappeared repository-wide. Parser boundaries still require concrete representations; the goal is for downstream semantic decisions to use domain-owned typed operations rather than recreate identity logic. `SourceSpan` offsets remain `NumberValue`. Full TypeScript typecheck, complete Vitest, and CLI → manifest end-to-end execution remain unverified because dependencies are absent.

## Verification

Run `npm run audit:phase3032-invocation-name-source-provenance-identity`. The audit verifies the ADT shape, segment-level provenance retention, malformed-span retention, canonical span operations, duplicate identity integration, runtime trace anchors, absence of the deleted relation foundation modules, and the one-newline `collections.ts` invariant.
