# Phase 1697 — Laravel Scanner Interface / Invocation Semantic Judgment Trace

## Scope

This phase traces the Phase 1696 interface-first boundary against the actual subscanner signatures, the Laravel source-AST pipeline, and the existing invocation semantic judgment authority. It makes only a contract correction that is directly supported by the call graph. It does not wire the subscanners or claim that their semantic reasoning has migrated.

## Trace findings

1. `LaravelSourceAstPipelineInterface` is a useful outer contract, but `wiring/laravelSourceAstPipeline.ts` still owns orchestration and constructs indexes/derived inputs. It is not yet a trivial adapter over six subscanner interfaces.
2. `LaravelControllerScannerInterface` omitted `FormRequestSource[]`, while `ControllerScanner.scanCanonicalBundle` consumes a `RelationIndex<string, FormRequestSource>`. The input contract now exposes source-backed FormRequest evidence explicitly. The wiring adapter must build the relation index without re-deriving request semantics.
3. `LaravelRouteScannerInterface` currently describes `ControllerActionFlowContract[]`, but the current `RouteScanner.scanCanonicalBundle` consumes a nested `RelationIndex<string, RelationIndex<string, ControllerActionInfo>>` wrapped in `RelationOption`. A semantic adapter/judgment is required before wiring; do not cast the flow contract to the legacy index.
4. `LaravelResourceScannerInterface` currently accepts `ModelAst[]`, `ControllerAst[]`, and `ControllerActionFlowContract[]`, but `ResourceScanner.scanCanonicalBundle` consumes `ModelSymbolTable` and `Presence<ControllerResourceDataflow>`. This is a material contract mismatch. The right fix is an upstream-owned closed resource-binding judgment and model lookup capability, not importing compiler/scanner implementation types into `types/upstream` and not asking the runtime scanner to infer the binding again.
5. `LaravelModelScannerInterface` matches the current scanner’s explicit `SourceProjectIdentity + SchemaInterface` inputs and returns ASTs plus definitions.
6. `LaravelFormRequestScannerInterface` intentionally hides `TypeInterner`, an implementation detail, but the pipeline still consumes the legacy `sources` bundle to build controller request evidence. The contract needs to expose source-backed request evidence (or a closed judgment containing it) before the old bundle is replaced.
7. `LaravelChannelScannerInterface` matches the canonical AST entrypoint. It is evidence/AST acquisition, not a substitute for semantic judgments in route/controller/resource domains.
8. Invocation semantics already have a distinct upstream model: `invocationSemanticJudgmentInterface` → `invocationSemanticJudgmentAlgebra` → `invocationSemanticJudgmentAuthority` → `invocationSemanticRuntimeExecutor` → `invocationSemanticPipeline`. `controllerDataflowAnalyzer` calls `invocationSemanticPipeline.analyzeKnowledge`. Preserve this authority; do not duplicate invocation reasoning inside Laravel scanner interfaces or route/controller facades.

## Required order

1. Close upstream domain contracts and judgment invariants first.
2. Add upstream-owned adapters/authorities for controller request evidence, route controller-action resolution, and resource/model binding.
3. Wire the subscanner interfaces to those authorities, with no type casts or fallback classification.
4. Reduce `laravelSourceAstPipeline` to dependency ordering and data transport only.
5. Migrate consumers to closed judgments, then empty legacy entrypoints in place only after consumer tracing.
6. Run targeted audits/tests, TypeScript typecheck, build, and ecommerce fixture end-to-end.

## Change made in Phase 1697

- Added `formRequests: readonly FormRequestSource[]` to `LaravelControllerScanInput` because the live controller scanner consumes that source evidence.
- No subscanner wiring changed.
- No legacy implementation removed or emptied.
- No claim that semantic reasoning has been removed from scanner runtime.

## Validation status

- The Phase 1696 structural interface audit remains the baseline and should be rerun after this change.
- Full build/typecheck is not asserted here: previous environment checks found `tsdown` missing and ambient `node`/`vitest` types unavailable to the global `tsc`.
