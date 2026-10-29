# Phase 2872 — Manifest Domain Continuation Design

## Scope

This phase narrows the next implementation batch to the decisions in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` that decide whether a manifest may advance. It does not claim those branches have been removed. The goal is to evolve the result ADTs at their producer boundaries, not to relocate `if` statements into helper functions.

## Runtime trace and branch ownership

| Current decision | Current source | Existing contract / evidence | Intended owner of follow-up operation |
|---|---|---|---|
| Project canonicalization complete vs blocked | `compose` after `sourceProjectIdentityCanonicalization.canonicalize` | `ControllerSourceProjectIdentityCanonicalizationResult` and `ControllerSourceProjectIdentityCanonicalizationInterface` in `controllerInvocationManifestCompositionInterface.ts` | Canonicalization result ADT: `continueWith({ onCanonicalized, onBlocked })` |
| Discovery complete vs blocked | `compose` after `sourceDiscovery.discover` | `LaravelControllerSourceDiscoveryResult`, `LaravelControllerSourceDiscoveryInterface` in `packages/core/src/types/upstream/laravelControllerInvocationSemanticJudgmentInventoryInterface.ts` | Upstream discovery result ADT, because discovery completeness is an upstream domain contract |
| Source-document identity bound vs rejected | identity binding aggregation in `compose` | `PhpSourceDocumentIdentityBindingJudgment`, `PhpSourceDocumentIdentityBindingInterface` in `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts` | Identity-binding judgment ADT; rejected identities must remain a separate terminal outcome |
| Document read complete vs blocked | aggregation after identity binding | `PhpSourceDocumentReadResult` in `phpSourceFrontendInterface.ts` | Read result ADT; blocked reads remain distinct from an empty document set |
| Inventory validated vs rejected | `closeInventory` | Existing `LaravelControllerInvocationSemanticJudgmentInventoryResult.continueWith(...)` | Already owned by inventory ADT; preserve existing operation |
| Manifest complete vs blocked | `closeInventory` after `build()` | Existing `ManifestBuilderJudgment.continueWith(...)` | Already owned by manifest-builder ADT; preserve AST/source-model blockers |
| CLI terminal complete/blocked/rejected | terminal factory | `ControllerInvocationManifestTerminalOperationInterface.continueForDriftAudit(...)` | Already owned by CLI terminal ADT; preserve existing operation |

## Target pattern

The operation should be attached to each actual ADT variant by the authority that creates that variant. The consumer then calls the operation directly:

```ts
const canonicalization = await dependencies.sourceProjectIdentityCanonicalization.canonicalize(input);
return canonicalization.continueWith({
  onCanonicalized: identity => continueWithCanonicalProject(identity.canonical),
  onBlocked: identity => terminalOperations.sourceProjectIdentityBlocked(
    Object.freeze({ kind: 'controller_invocation_manifest_source_project_identity_blocked', identity }),
  ),
});
```

This is a target sketch, not a claim that `continueWith` is already implemented on canonicalization results. Before implementation, add the named handler/operation to the existing domain contract and bind it in the canonicalization producer. Do not create `GenericResult<T>`, a generic dispatch helper, or a second canonicalization abstraction.

## Runtime export policy

For a genuine exported domain operation, prefer an existing named operation interface and an object export:

```ts
export const existingDomainOperation: ExistingDomainOperationInterface = Object.freeze({
  execute: input => existingDomainAuthority.execute(input),
});
```

Do not mechanically wrap value constructors, vocabulary constants, or implementation-private helpers in interfaces. Remove direct exported function declarations and unannotated exported arrows only after classifying their domain role and migrating callers. Public API shape is not a substitute for a domain contract.

## Required invariants

- `packages/core/src/types/upstream/collections.ts` remains empty.
- AST/source-model failures remain explicit blocked judgments; never normalize them into a successful empty manifest.
- Identity rejection, source discovery blocked, document read blocked, inventory rejection, and manifest blocked remain distinct.
- Each continuation is defined at the ADT producer/authority boundary; consumers must not repeat discriminant dispatch.
- Tests must cover every outcome branch and prove continuation preserves the original judgment evidence.

## Verification boundary

The companion audit measures decision points and checks contract anchors using the TypeScript compiler API and source inspection. It is a structural audit, not a semantic typecheck, build, or end-to-end test. Those must be run after each source migration with the repository's supported dependencies and TypeScript version.
