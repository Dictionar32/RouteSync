# Phase 3102 — Query-Policy Identity Domain Operation

## Runtime trace audited

`CLI scan/sync → controllerInvocationManifestBuilder → ControllerInvocationManifestCompositionAuthority.compose → controllerSourceProjectIdentityCanonicalization.canonicalize → SourceProjectIdentity.queryPolicySelection.createSourceProjectIdentity → LaravelSourceProjectIdentityFactoryInterface.create/createWithPolicy → canonical SourceProjectIdentity → source discovery → source reads and identity binding → semantic judgments → manifest build/validation → CLI terminal manifest → generator/persistence`.

## Concrete migration

The Phase 3101 query-policy migration removed the generic `continueWith<Result>` from `SemanticDataflowQueryPolicySelection`, but the real CLI canonicalization path still called `queryPolicySelection.continueWith(...)`. That left the runtime consumer inconsistent with the new upstream contract.

This phase closes that seam without restoring a generic visitor or handler:

- `SemanticDataflowQueryPolicySelectionOperations` now exposes `createSourceProjectIdentity(sourceRoot, factory)` as a named domain operation.
- The default selection delegates to the existing canonical identity factory's `create` operation.
- The explicit selection delegates to `createWithPolicy` while preserving the exact selected `SemanticDataflowQueryPolicyIntent`.
- `controllerSourceProjectIdentityCanonicalization` delegates to the selection operation instead of branching over `onDefault`/`onExplicit` handlers.
- The canonical identity factory remains the single owner of `SourceProjectIdentity` construction; this does not add a second identity authority or relation foundation.
- Regression coverage checks the named operation on both selection variants.

The selection operation accepts the existing identity factory as a typed dependency. This avoids a runtime import cycle and preserves the dependency direction: the selection chooses the appropriate domain operation; the existing identity factory constructs the identity.

## Interface-first usage

```ts
const canonical = input.sourceProject.queryPolicySelection.createSourceProjectIdentity(
  sourceFileIdentityFactory.create(stringValue.create(canonicalRoot)),
  createLaravelSourceProjectIdentity,
);
```

The CLI no longer interprets selection variants. The source-project policy decision is represented by an operation owned by the selection ADT.

## Scope limits and data-loss guardrails

This is one concrete seam migration, not a claim that all repository primitives have been removed. Existing source evidence, policy intent, source identity, provenance, blockers, and manifest contracts remain the authority. The broader AST export frontier from Phase 3101 remains open; its 979 declaration candidates are not mechanically rewritten because each needs a real owner interface and compatibility review. The forbidden-construct inventory (`if`, `switch`, `===`, `??`, ternaries, array transforms, primitive types, and similar syntax) is also not globally zeroed by this phase.

Deleted relation-foundation modules under `packages/core/src/semantic/relations/` remain absent. `packages/core/src/types/upstream/collections.ts` was not reconstructed or modified; its existing empty-file state remains a pre-existing typecheck risk.

## Verification

The Phase 3102 structural audit is registered as `npm run audit:phase3102-query-policy-identity-operation`. JSON metadata validation, TypeScript syntax transpilation for changed TypeScript files, and ZIP integrity are checked when producing the artifact. Full typecheck, full test suite, and real PHP → CLI → manifest → generator E2E are explicitly unverified in this workspace.
