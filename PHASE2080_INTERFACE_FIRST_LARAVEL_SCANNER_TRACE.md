# Phase 2080 — Interface-first Laravel scanner trace

## Scope

Trace the existing Phase 2079 source without moving folders or adding a parallel authority. This phase is a source audit and migration specification; production TypeScript is intentionally unchanged because the action contract currently performs substantial derivation and changing its return shape without migrating all consumers would break the contract.

## Canonical flow

`Laravel source evidence → invocation inventory/closure → declaration judgment → action semantic derivation → integrated response judgment → AST projection judgment → correlated LaravelControllerScanArtifact`.

## Evidence from the current source

- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentInterface.ts` already declares an outcome-indexed `ControllerDeclarationSemanticSelection` union (`controller_declaration_selection_complete` / `controller_declaration_selection_blocked`).
- `packages/core/src/types/upstream/controllerDeclarationSemanticJudgmentAuthority.ts` still implements selection and ancestry decisions through `sameClassIdentity`, `isHasMiddleware`, `selectActions`, `ancestryFor`, nested `walk`, `.filter`, `.some`, and `.map`.
- `packages/core/src/compiler/scanner/descriptors/request/controllerActionContract.ts` exports `resolveControllerActionContract(...)` returning a complete `ControllerActionContract` directly. It imports relation operations and delegates response/body/schema/dataflow derivation to controller subscanner modules. There is no closed action judgment union at this boundary.
- `packages/core/src/compiler/scanner/subscanners/controller/actionScanner.ts` calls `resolveControllerActionContract(...)`; therefore action derivation is still owned by a runtime subscanner path.
- `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts` imports relation vocabulary and `scanControllerAction`, and coordinates declaration selection, action scanning, producer invocation, integrated response, and AST projection. It is not yet a thin executor of one closed upstream contract.
- `packages/core/src/types/upstream/collections.ts` still couples the upstream collection vocabulary to `semantic/relations`. Removing a single scanner import would not remove the architectural dependency.

## Architectural decision

Do not add a new `foundation`, `relations`, or parallel semantic interface directory. Evolve the current owners in place. Preserve existing source paths unless a complete import migration proves a move is necessary.

### Target 1 — action judgment

Evolve the existing action contract boundary so it consumes already-typed action evidence and yields a closed ADT. Reuse the current `ControllerActionContract` and existing domain types where compatible; do not invent duplicate result vocabularies.

Required semantic outcomes should distinguish complete contract, semantic rejection, and blocked/incomplete evidence. Any exact names must be reconciled with existing project types before implementation.

### Target 2 — declaration and ancestry

Retain the existing `ControllerDeclarationSemanticSelection` ADT. Evolve its upstream authority so action eligibility and ancestry evidence are explicit typed inputs/rules and the output records the complete or blocked judgment. Do not merely rename `selectActions` or move `walk` into another file.

### Target 3 — integrated response and AST

Preserve the canonical invocation judgment and the existing integrated response / AST projection owners. Projection consumes the correlated judgment and source AST evidence; it must not independently reclassify invocation or rebuild response provenance.

### Target 4 — executor-only scanner

Only after Targets 1–3 are actually consumed should wiring be reduced to forwarding evidence and closed judgments. Then migrate collection operations and retire `scanControllerAction` as a semantic authority. Do not delete relation operations while live consumers still depend on them.

## Explicit exclusions

- No folder relocation.
- No duplicate or wrapper-only interfaces.
- No claim that relation/foundation, subscanner, functions, constants, or classes have been eliminated.
- No build, typecheck, or Vitest claim; these were not run in this phase.

## Exit criteria for a source-migration phase

1. Action callers consume the action judgment ADT, not a directly inferred contract.
2. Declaration authority outputs closed selections whose required evidence is explicit.
3. Scanner no longer imports `semantic/relations` or controller subscanner APIs.
4. Every remaining relation import is accounted for and migrated without duplicate collection types.
5. Integrated response and AST projection remain correlated with the original invocation judgment.
6. Static audits and targeted tests verify behavior; full build remains a user-side verification if the environment is unsupported.
