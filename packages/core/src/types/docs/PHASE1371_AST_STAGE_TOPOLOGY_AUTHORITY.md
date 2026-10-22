# Phase 1371 — AST Stage Topology Authority

## Trace

`AST_SEMANTIC_STAGE_GRAPH -> astSemanticStageOrder() -> AstSemanticAuthorityPipeline -> proof-checked stage transitions -> downstream stage consumers`

## Finding

The AST semantic stage graph already declared the legal stage edges, and `stageGraphContains()` already used that graph for membership. However, `astSemanticAuthorityPipeline.ts` separately maintained `AST_SEMANTIC_STAGE_ORDER`, repeating the same six-stage topology in a second location. The duplicated list could drift from the graph while both remained locally valid.

## Change

- Added `astSemanticStageOrder()` to `astSemanticStageContract.ts`; it projects stage order directly from `AST_SEMANTIC_STAGE_GRAPH.edges` using the relational sequence projection and freezes the result.
- Replaced the manually maintained order array in `astSemanticAuthorityPipeline.ts` with `astSemanticStageOrder()` in both pipeline construction paths.
- Preserved stage membership checks, proof-checked transition construction, interface-derived facts, and the existing AST semantic judgment authority.
- Added `audit:phase1371-ast-stage-topology-authority` and a machine-readable report.

## Why this boundary

The graph is the topology contract; the pipeline is a consumer of that topology. The pipeline should assemble stage interfaces and proof-carrying transitions, not independently restate their order. This removes a real duplicated topology source without creating another solver or making AST structure equivalent to dataflow.

## Validation

The Phase 1371 audit checks graph-derived order, immutable projection, both pipeline construction paths, transition proof preservation, and package/build-script stability. A static audit does not establish TypeScript type correctness or runtime behavior. The full build remains unverified when local `tsdown` and project dependencies are absent.
