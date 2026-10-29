# Phase 3031 — Fully Explicit Typed Runtime Scanner Operations

## Runtime path traced

The implementation remains on the real CLI-to-manifest path:

1. `packages/cli/src/manifestScanOperationInterface.ts` exposes the interface-backed CLI manifest scan operation.
2. The CLI operation delegates into the controller-invocation manifest composition authority.
3. PHP invocation inventory and semantic resolution feed `phpFunctionInvocationSemanticJudgmentBatchClosureAuthority`.
4. The batch closure now delegates duplicate-identity meaning to `phpFunctionInvocationEvidenceIdentityOperations` in `packages/core/src/types/upstream/phpFunctionInvocationEvidenceIdentity.ts`.
5. Duplicate evidence continues to be reported as `duplicate-invocation-evidence` in the existing rejection ledger; closure completeness, source identity, argument correspondence, and blocker semantics remain in place.

## Change applied

Previously, the batch closure flattened file path, source offsets, and function-name/malformed-name evidence into a delimiter-based string key. This obscured the data model and made identity depend on serialization.

The new upstream ADT models identity explicitly as:

- invocation `SourceSpan` evidence;
- a closed name identity with either ordered lexical name segments or an explicit malformed-syntax reason;
- interface-backed `create` and `same` domain operations.

`same` delegates source location comparison to `sourceSpanOperations.same`; name evidence is compared as typed segments or as a typed malformed-name reason. The closure no longer builds a serialized composite string key. Qualified and fully-qualified names retain the previous duplicate-key semantics when their segment sequences are the same, while malformed evidence preserves its reason.

## Architecture constraints

- No deleted generic relation foundation was restored or re-exported.
- The existing upstream/domain ADT path remains the source of truth.
- `packages/core/src/types/upstream/collections.ts` remains exactly one newline byte.
- The change does not claim that all `string`, `number`, `undefined`, `null`, `boolean`, `reduce`, empty arrays, `??`, ternaries, or control-flow constructs have been removed globally. Parser boundaries and syntax discrimination still require explicit representation and dispatch; replacing them mechanically could erase evidence.

## Validation

Run `npm run audit:phase3031-invocation-evidence-identity-adt` for the focused static contract audit. Previous phase audits should also be rerun after this migration. Full TypeScript typecheck, full Vitest, and CLI-to-manifest end-to-end validation remain unverified when dependencies are unavailable.
