# Phase 1161 — TS7.0.2 upstream/dataflow/graph boundary trace

- TypeScript baseline is exact `7.0.2` in package manifests and package-lock snapshots.
- DataFlowInterface remains generic execution/state/query boundary; semantic Laravel knowledge remains upstream.
- Graph boundary remains structural: CompleteLaravelSourceModel relations -> StructuralSemanticRelation -> GraphEdgeRelation -> ServiceGraph.
- Dataflow boundary remains semantic: CompleteLaravelSourceModel -> SemanticDataflowEvidence -> SemanticDataflowInput -> semanticDataflowAuthority -> DataFlowInterface -> analysis/IR.
- Graph assembler generic collection construction is explicit so `unknown` does not leak from generic inference into ServiceGraph.
- Controller action membership compares canonical `ActionName` values rather than widening to `string`.
- No semantic cast is introduced to silence these boundaries.
- TS7.0.2 is the current npm `latest` stable release; nightly builds remain `typescript@next` and are not used as the project baseline.
- Full TS7 build must still be run in the user's environment after `npm install`; this environment does not provide a TS7 compiler binary.
