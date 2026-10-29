# Phase 3062 — Fully Explicit Typed Runtime Scanner Operations

## Goal

Close the gap identified in Phase 3061: a controller body could have a typed `blocked` producer outcome, but the controller scanner did not make that outcome terminal for the real `upstream → CLI → manifest` runtime path.

## Runtime trace

```text
PHP source
  → LaravelSourceLexer.parseControllerDeclarationFromInvocationJudgment
  → ControllerMethodAst.body
  → controllerBodyParser / controllerDataflowAnalyzer
  → ControllerDataflowAnalysisOutcome (completed | blocked)
  → LaravelControllerScanner
       ├─ completed bodies → controller artifacts may be projected
       └─ blocked body → laravel_controller_scan_semantic_body_blocked
  → LaravelSourceAstPipeline
       → laravel_source_ast_projection_controller_scan_blocked
  → ManifestBuilder
       → manifest_builder_blocked(stage: source_ast)
  → CLI scan/sync manifestBlocked handler
       → stop before complete manifest projection and generated manifest/IR output
```

## Changes

1. `packages/core/src/types/upstream/laravelControllerScannerInterface.ts`
   - Added `LaravelControllerSemanticBodyBlocker`, preserving controller/action identity, source file, method span, and the original typed `ControllerDataflowAnalysisBlocked` outcome.
   - Added `laravel_controller_scan_semantic_body_blocked` to the scanner judgment ADT. The blocked case publishes no partial controller artifacts.

2. `packages/core/src/compiler/scanner/wiring/laravelControllerScanner.ts`
   - Added a gate over selected action methods before action/response/AST projection.
   - If any selected body has a blocked semantic outcome, the scanner returns the typed blocker ledger and an empty controller artifact set rather than continuing with a partial semantic model.

3. `packages/core/src/types/upstream/laravelSourceAstPipelineInterface.ts` and `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts`
   - Widened the existing controller-scan blocker payload to preserve any non-complete controller-scan judgment.
   - The source-AST pipeline now routes every non-complete controller-scan outcome through the existing source-AST blocked projection.

4. `packages/core/src/index.ts`
   - Exported the upstream blocker contract.

5. `scripts/audits/audit-phase3062-controller-body-blocker-to-manifest.cjs`
   - Added structural assertions covering blocker provenance, scanner gate, source-AST propagation, manifest builder blocker conversion, and CLI scan/sync blocked handlers.

## Verification

- Phase 3062 structural audit: see `PHASE3062_CONTROLLER_BODY_BLOCKER_TO_MANIFEST_AUDIT.json`.
- `collections.ts` remains exactly one newline byte; it was not modified.
- Deleted relation foundation modules were not restored.
- Strict TypeScript verification remains blocked by existing repository issues, including imports into deleted `packages/core/src/semantic/relations/` modules, the intentionally one-byte `collections.ts`, and existing unrelated diagnostics. This phase does not claim a clean typecheck.
- End-to-end PHP fixture execution through CLI manifest generation was not run. The structural path is connected, but an end-to-end runtime test remains necessary to prove the blocked fixture exits before any generated manifest/IR write.
- Primitive syntax is not claimed to be globally eliminated. Branches that eliminate closed ADTs remain at their owning domain boundary; parser/token primitives still require separate migration.

## Design alignment

Laravel's route/controller contract preserves distinctions among route declarations, controller actions, parameters, and model binding. RouteSync therefore preserves the source-bound controller/action and exact blocker rather than flattening a blocked analysis into an empty or successful manifest. References: [Laravel Routing](https://laravel.com/framework/docs/routing), [TypeScript Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces), and [TypeScript Union Types](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html).
