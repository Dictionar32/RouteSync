# Phase 2339 — Existing Upstream Policy Authority Contract

## Scope

This phase starts at the existing `EffectiveControllerActionPolicy` contract. It does not claim that the runtime is already wired to the new interface contracts. The goal is to make ownership explicit before implementation is migrated.

## Contract audit

Existing source:

- `packages/core/src/types/upstream/effectiveControllerActionPolicy.ts`
- `packages/core/src/types/upstream/effectiveControllerActionPolicyAlgebra.ts`
- `packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts`
- `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts`
- `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts`
- `packages/core/src/types/upstream/laravelRouteScannerInterface.ts`

The current output ADT is already closed (`complete` exposes products; `blocked` does not). The input properties `policy`, `inheritedFrom`, and `source` are required in Phase 2338, which prevents omitted fields from silently becoming empty evidence. However, the ownership boundary remains incomplete: the upstream resolver and scanner-side resolver both calculate a complete/blocked judgment, while the existing algebra interface only owns parts of middleware and authorization calculation.

## Contract changes

The existing policy contract now declares:

- `EffectiveControllerActionPolicySemanticAuthorityInterface`: the authority owns the judgment and binds it to the existing algebra contract.
- `EffectiveControllerActionPolicyRuntimeExecutorInterface`: executor delegates a single typed input to that authority and preserves the returned closed ADT.

No `V2` interface, `semantic/foundation` dependency, or second semantic vocabulary was introduced. No runtime/wiring change is claimed in this phase.

## Trace

```text
ControllerActionFlowContract policy + inheritedFrom + source
  -> EffectiveControllerActionPolicyUpstreamInput
  -> [target contract: EffectiveControllerActionPolicySemanticAuthorityInterface]
  -> EffectiveControllerActionPolicyRuntimeExecutorInterface
  -> LaravelRouteScannerInterface / route semantic flow
  -> AST / manifest projection
  -> CLI
```

The bracketed authority/executor contract boundary is specified but not yet wired. The current implementation has two separate resolver paths:

1. `packages/core/src/types/upstream/effectiveControllerActionPolicyResolver.ts`
2. `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.ts`

This is the next implementation defect to remove by making the scanner path consume the canonical upstream contract instead of maintaining its own judgment closure. Only after that should the Laravel scanner and CLI flow be updated to preserve the same judgment.

## Recommended next changes

1. Implement the existing semantic authority against the existing algebra and upstream resolver.
2. Convert the scanner-side resolver into a thin executor/delegator; remove its independent policy judgment and duplicate scope logic.
3. Evolve `LaravelRouteScannerInterface` only where the traced data path shows the closed policy judgment is not preserved; do not bump versions without an actual shape/contract change.
4. Trace the same judgment into AST and manifest projection, ensuring no `auth:boolean` or downstream reclassification becomes a second authority.
5. Audit legacy `RouteScanner` callers and remaining `semantic/relations` imports separately; do not claim they are resolved here.

## Verification

The phase audit is a static contract audit. It deliberately asserts the remaining duplicated resolver logic so the report cannot misrepresent the wiring as complete. Typecheck, Vitest, build, and CLI end-to-end are not claimed as run.
