# Phase 2861 — Fully Typed Runtime Scanner Operations Audit

## Change

The upstream AST stage topology now owns both its graph and the executable membership judgment. `astSemanticStageTopologyAuthority` is an interface-first runtime export. `classifyMembership` returns a closed ADT (`ast_semantic_stage_declared` / `ast_semantic_stage_undeclared`); each branch exposes `continueWith` so consumers handle the domain result through explicit handlers. `order()` projects the one canonical stage order from the graph.

`astSemanticAuthorityPipeline.ts` now consumes the membership judgment with `continueWith` and gets its order from the same authority. This removes the relation utility dependency from `astSemanticStageContract.ts` and prevents a second, disconnected topology decision. It does not claim that the entire AST pipeline or manifest CLI path is relation-free.

## Manifest runtime trace

```text
CLI scan/sync
  -> routeSyncCliManifestScanOperationFactory
  -> composition.manifestScanOperation.scan(...)
  -> controllerInvocationManifestCompositionAuthority
  -> source discovery / identity binding
  -> invocation inventory judgment
  -> inventoryResult.continueWith(...)
       validated -> manifestBuilderOperationPreparation
                 -> ManifestBuilderJudgment
                 -> validation / generation / persistence operations
       rejected  -> inventory-rejected terminal operation
```

The AST stage topology is a separate supporting upstream contract consumed by the semantic pipeline; it is not represented as the sole manifest builder.

## Usage

```ts
const membership = astSemanticStageTopologyAuthority.classifyMembership(runtimeStage);
return membership.continueWith({
  onDeclared: stage => continueWithDeclaredStage(stage),
  onUndeclared: stage => reportUndeclaredStage(stage),
});
```

Runtime authority is exported using `export const name: ExistingInterface = Object.freeze({...})`; implementation helpers remain private. No generic relation/foundation layer is introduced. `collections.ts` remains empty.

## Audit boundaries

Run `npm run audit:phase2861-fully-typed-runtime-scanner-operations`. This structural audit checks the new topology authority, actionable ADT, pipeline consumption, exported function declarations in the production scanner/upstream/CLI scope, CLI relation imports, and the empty collections file. Remaining relation imports elsewhere are reported, not concealed. Structural audit is not a substitute for TypeScript, unit, build, or CLI end-to-end verification.
