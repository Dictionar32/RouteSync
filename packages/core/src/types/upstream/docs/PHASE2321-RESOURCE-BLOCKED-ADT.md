# Phase 2321 — Resource Scan Completeness ADT

## Finding

`LaravelResourceScannerInterface` already retained both resolved and rejected resource artifacts in one source-ordered integrated response. However, `laravelSourceAstPipeline.ts` filtered the sequence down to `laravel_resource_resolved_artifact` values and continued. An unresolved or ambiguous resource-model binding could therefore disappear from the projection path instead of preventing a complete source-AST judgment.

## Contract change

`LaravelResourceScanJudgment` is now a closed ADT:

- `laravel_resource_scan_complete` carries a response whose artifact sequence contains resolved resource artifacts only.
- `laravel_resource_scan_blocked` carries the complete source-ordered artifact sequence and an explicit `rejectedArtifacts` collection.

The resource scanner owns this classification because it has the binding outcomes and the source-correlated artifacts. The pipeline does not infer the semantic binding result or repair it by filtering rejected artifacts.

## Pipeline change

`LaravelSourceAstProjectionJudgment` gains `laravel_source_ast_projection_resource_scan_blocked`, preserving the exact resource scan judgment and invocation inventory receipt. `laravelSourceAstPipeline.ts` returns that blocked judgment before response scanning when resource binding is unresolved or ambiguous. Only the complete arm proceeds to resource AST and response projection.

## Versioning

- `LaravelResourceScannerInterface` / `LaravelResourceScanJudgment`: version 18.
- `LaravelSourceAstPipelineInterface`: version 13.

## Boundaries

This phase fixes one specific completeness leak. It does not claim that the entire Laravel scanner has become a pure executor or that `semantic/relations` imports have been retired throughout the broader route-scanner implementation.
