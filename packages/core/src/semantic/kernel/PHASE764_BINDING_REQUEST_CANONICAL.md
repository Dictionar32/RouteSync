# Phase 764 — Binding Request Canonicalization

## Build frontier

The user-provided `npm run build` reached DTS generation and failed at:

`packages/core/src/compiler/scanner/resolvers/boundary/boundaryContractFactory.ts`

The diagnostic was:

`ResolvedRouteBoundaryOptions` was not assignable to `RouteCapabilityResolutionInput` because `request` was missing.

The prior Phase 763 model had already elevated route operation binding, but capability resolution still expected `request` as an independent boundary field. That re-opened a second binding authority.

## Highest-model correction

`ResolvedRouteBinding` is now a domain semantic ADT owned by `packages/core/src/types/domain/routes.ts`:

- `operation: RouteOperationBinding`
- `request: RouteRequestBinding`

The boundary input no longer reconstructs binding from controller/action/handler. It reuses the canonical incoming `params.binding` judgment.

Capability resolution receives the request explicitly from `binding.request`, rather than requiring `request` to exist on `ResolvedRouteBoundaryOptions` as a free field.

The factory likewise resolves capability from `resolved.binding.request`.

This preserves a single semantic authority:

```text
Laravel route evidence
  -> closed boundary input
  -> ResolvedRouteBinding
       -> operation
       -> request
  -> capability judgment
  -> RouteBindingContract
  -> RouteSemanticFlow
```

## Legacy reservoir cleanup

`packages/core/src/compiler/scanner/resolvers/boundary/bindingResolution.ts` no longer owns a duplicate resolver implementation and is intentionally empty. The semantic ADT moved to the domain type authority instead of leaving a dead compatibility resolver.

The boundary index no longer exports that dead resolver.

The existing parsed-descriptor reservoirs remain empty.

## Audit

`scripts/audit-phase764-binding-request-canonical.cjs` verifies:

- resolved binding is a domain ADT;
- boundary owns one canonical binding judgment;
- boundary input reuses the canonical binding;
- capability consumes `binding.request`;
- factory consumes `resolved.binding.request`;
- capability has no independent `params.request` authority;
- binding builder consumes canonical operation/request;
- legacy binding resolution file is empty;
- parsed-descriptor reservoirs are empty.

All Phase 764 audit checks pass in the workspace.

## Build status

This phase does **not** claim a full `npm run build` pass. The supplied build log is the diagnostic evidence that drove this correction. The next build in the user's complete dependency environment is the authoritative validation of the new boundary.

## Architectural direction

The correction follows the RouteSync semantic compiler model:

`Laravel source evidence -> closed AST -> semantic judgments -> relational closure/fixed point -> declarative rewrite -> canonical Laravel route semantics -> Next.js projection`.

Host implementation constructs are not used as a substitute for the semantic model. Source-language tokens remain evidence where they belong; semantic authority is represented by closed ADTs and relations.
