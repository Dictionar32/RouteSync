# Phase 3030 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope: PHP invocation semantic batch closure

This phase continues the real `upstream → CLI → manifest` path and migrates one concrete upstream consumer. It does not create a replacement relation foundation.

Runtime trace:

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed manifest scan operation.
2. The CLI delegates into `ControllerInvocationManifestCompositionAuthorityInterface`.
3. The PHP invocation inventory and resolution judgments enter `phpFunctionInvocationSemanticJudgmentBatchClosureAuthority`.
4. Batch closure now delegates source-span equality and containment to `sourceSpanOperations` from `packages/core/src/types/upstream/provenance.ts`.
5. Inventory completeness, source-file identity checks, syntax evidence, missing/duplicate/orphan judgments, argument correspondence, and the existing rejection ledger remain in the existing authority.

## Applied migration

`phpFunctionInvocationSemanticJudgmentBatchClosureAuthority.ts` no longer implements span equality by directly comparing start/end offsets, and no longer reimplements span containment through coordinate arithmetic. It delegates to the canonical domain operations:

- equality: `sourceSpanOperations.same(left, right)`
- containment: `sourceSpanOperations.contains(outer, span)`

The authority remains an interface-backed exported object. This migration intentionally leaves `evidenceIdentity` serialization unchanged: turning that key into a typed identity ADT requires a separate migration with tests proving that file identity, offsets, and syntax/function-name evidence are all retained.

## Audit

Run:

```sh
npm run audit:phase3030-invocation-batch-source-span-domain-operations
```

The static audit checks the selected consumer's delegation, interface-backed domain operations, the CLI/composition trace, the deleted relation-foundation invariant, and the one-newline `collections.ts` invariant.

## Non-claims and remaining debt

- This is a scoped static audit, not proof of full runtime correctness.
- Parser offsets remain `NumberValue`; replacing the representation with a meaningful position model is not achieved by merely wrapping the primitive.
- `evidenceIdentity` still uses a serialized key and should be considered for a typed identity ADT.
- Repository-wide elimination of `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty arrays, `??`, ternaries, and exported function declarations is not complete. These patterns must be migrated by domain ownership, not by unsafe global replacement.
- Full TypeScript typecheck, full Vitest, and CLI-to-manifest end-to-end verification were not run in this environment.

## References

- TypeScript interfaces define structural contracts: https://www.typescriptlang.org/docs/handbook/interfaces
- TypeScript discriminated unions preserve distinct domain outcomes: https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html
- Laravel routing documents route/controller behavior and explicit model binding: https://laravel.com/docs/routing
