# Phase 1845 — Laravel Resource Scanner Interface-First Cutover

Date: 2026-10-13

## Trace findings

- `LaravelResourceScannerInterface` existed but production still called `ResourceScanner.scanCanonicalBundle()` and `ControllerScanner.extractResourceDataflow(...)`.
- That path let the legacy resource scanner choose the model and construct the resource AST/definition before the new binding authority was consulted.
- The previous artifact shape required an AST and definition even when model binding was unresolved or ambiguous. That contract could encourage fabricated or convention-fallback model-bearing ASTs.
- The source AST pipeline already retained the complete `LaravelControllerScanJudgment`, including each controller's integrated invocation semantic judgment and resource-return evidence.

## Interface changes

- Advanced `LaravelResourceScannerInterface` to contract version 4.
- Input now includes the complete controller scan judgment, canonical model definitions, corresponding model ASTs for projection only, source-backed relation evidence, and the existing binding authority.
- The output is closed over two outcomes:
  - `LaravelResourceResolvedArtifact`: AST, definition, and a resolved model-binding judgment stay correlated.
  - `LaravelResourceRejectedArtifact`: unresolved or ambiguous judgment and source identity are retained without fabricating an AST with a guessed model.
- `SourceAsts.resourceScan` preserves the full judgment, including rejections.

## Production cutover

- Added `compiler/scanner/wiring/laravelResourceScanner.ts` implementing the existing upstream interface.
- Added `compiler/scanner/lexer/resourceSourceEvidence.ts` as a source-only extraction boundary. It preserves resource syntax/provenance and emits source-backed nested-resource relation evidence; it does not choose model candidates or produce ResourceDefinition.
- Production wiring now calls `laravelResourceScanner.scan(...)` and projects ASTs and definitions from the same resolved artifacts.
- Removed `ResourceScanner.ts` and its subscanner barrel export. The controller response detector now imports the lower-level resource expression mapper directly.
- Removed the production `ControllerScanner.scanCanonicalBundle()` and `ControllerScanner.extractResourceDataflow(...)` dependency from `laravelSourceAstPipeline.ts`.
- No `semantic/foundation` dependency was added.

## Important remaining boundary

`resourceModelBindingAuthority` currently resolves controller-return and resource naming-convention candidates. Relation evidence is now preserved and supplied, but relation evidence alone currently improves unresolved classification rather than deriving a model candidate through relation propagation. That is a separate semantic-algebra enhancement, not a scanner fallback.

## Static audit results

- Phase 1845 resource scanner interface-first: 15/15
- Phase 1844 resource model binding authority: 11/11
- Phase 1843 controller resource evidence: 11/11
- Phase 1841 route scanner interface-first: 10/10
- Phase 1839 controller scanner implementation: 12/12
- Phase 1838 integrated response preservation: 8/8
- Phase 1837 controller inventory receipt: 14/14
- Phase 1836 downstream interface boundary: 17/17
- `package.json` JSON parse: passed
- ZIP integrity: passed

Build, typecheck, and E2E were not run.

## Technical references

- Laravel resource controller documentation: https://laravel.com/framework/docs/12.x/controllers
- TypeScript interface contracts: https://www.typescriptlang.org/docs/handbook/interfaces
