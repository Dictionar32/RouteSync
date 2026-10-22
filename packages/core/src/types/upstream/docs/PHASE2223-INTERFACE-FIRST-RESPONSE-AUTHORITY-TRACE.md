# Phase 2223 — Interface-First Response Authority Trace

## Authority decision

The existing `LaravelControllerResponseSemanticPipelineInterface` remains the sole integrated Laravel response authority. It owns the closed invocation-correlated response judgment, DTO/evidence composition, method response projection, and AST projection dependencies. The scanner must not become a second response-semantic authority.

The response scanner's responsibility is source acquisition and orchestration: discover DTO source files, tokenize/parse declarations, obtain framework lock-file evidence, submit closed inputs to the selected pipeline, and publish only completed projection judgments. It must not infer HTTP response meaning from PHP syntax.

## Phase 2223 change

Removed `semantic/relations` usage from `compiler/scanner/subscanners/responseScanner.ts` for scanner mechanics only:

- DTO class-token discovery is a lexical scan, not a semantic relation.
- asynchronous DTO file collection is ordinary source acquisition, not semantic inference.
- collecting definitions/ASTs from already-produced results is a structural projection.

No replacement relation/foundation layer, new authority, or new subscanner was introduced. The existing upstream pipeline/interface was not copied or moved.

## Trace and unresolved migration boundary

`LaravelControllerScannerExecutor` → canonical invocation judgment → `LaravelControllerResponseSemanticPipelineInterface.judgeIntegratedResponse` → closed response judgment → existing method AST projection authority → response scanner publishes only complete projection results.

The remaining legacy action path is still material: `scanControllerAction` / `resolveControllerActionContract` can reach `resolveResponse` / `resolveResponseAttributeAst`, which resolves DTO class files and merges observed return fields. This is not claimed migrated by Phase 2223. The next semantic change must evolve the existing upstream response pipeline to consume the exact source-correlated DTO declaration and return evidence needed to replace that legacy derivation, prove parity, and only then retire it. Do not add a parallel response descriptor authority.

## Validation boundary

Structural checks: response scanner no longer imports `semantic/relations`; canonical action/source correlation and complete-projection gating from Phase 2222 remain intact. Full TypeScript typecheck, Vitest suite, and package build were not run in this environment.
