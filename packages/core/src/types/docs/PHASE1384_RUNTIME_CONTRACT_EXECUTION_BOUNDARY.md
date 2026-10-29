# Phase 1384 — Runtime Contract Execution Boundary

## Objective

Keep runtime as an executor/projection of closed upstream contracts. A runtime boundary must not accept raw semantic inputs when a closed judgment already exists, invoke semantic authority, or reconstruct closure/proofs.

## Trace result

- `types/upstream/semanticDataflowManifestSurface.ts`: the upstream manifest producer calls `semanticDataflowReasoningAuthority.judge(...)` to create the first closed judgment.
- `compiler/scanner/wiring/upstreamManifestBuilder.ts`: builds `dataflowInputs` as source evidence and `dataflowJudgments` as upstream-owned closed results.
- `compiler/analysis/semanticDataflowRuntimeBoundary.ts`: accepts `SemanticDataflowJudgment`, not `SemanticDataflowInput`.
- `compiler/analysis/semanticDataflowRuntimeComposition.ts`: delegates projection to `createSemanticDataflowDataFlowInterface`; it does not call `judge` or import the authority.
- `compiler/analysis/routeSyncDataflowAnalysis.ts`: finds a judgment by canonical identity and fails closed when it is absent; it does not fall back to raw inputs.
- `compiler/frontend/php/routeAst/semanticDataFlowAnalyzer.ts`: still calls `judge`, but is explicitly a deprecated compatibility facade and the repository search found only test references, not production callers. Keep this distinction visible; do not treat it as the runtime path.

## Operation identity interface/type evolution

- Added `OperationIdentityCapabilityContractMaterializerInterface.materialize(...)` to express the actual behavior: sealing already-resolved route capability evidence into a closed operation-identity contract.
- Added `operationIdentityCapabilityContractMaterializer` as the canonical upstream implementation.
- `OperationIdentityCapabilityAuthorityInterface` delegates `materialize` to that materializer.
- `routeProducerRelations.ts` now calls `materializeOperationIdentityCapability(...)` to make the producer-side operation explicit.
- Preserved `fromRoute` and `OperationIdentityCapabilityRuntimeAlgebraInterface` as deprecated compatibility projections. They must not be used as the canonical API because their naming blurs producer materialization with runtime execution.

## Runtime responsibility

Runtime may query already-closed reachability/path facts, serialize, project to manifest/graph/IR, and invoke target code generation. It must not classify Laravel routes, call `judge`, recompute fixed-point closure, invent derivations, or repair missing judgments. Missing canonical judgments fail closed.

## External design references

- MLIR Interfaces: generic analyses/transformations should interact through interfaces instead of encoding implementation-specific semantics: https://mlir.llvm.org/docs/Interfaces/
- TypeScript discriminated unions: explicit variants make contracts easier to narrow exhaustively: https://www.typescriptlang.org/docs/handbook/2/narrowing.html
- CodeQL JS/TS dataflow: AST nodes and dataflow nodes are distinct; source-to-sink analysis can independently audit consumer paths: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- TypeScript 7.0 announcement (2026): compiler upgrade compatibility should be audited separately from interface architecture: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/

## Verification limits

Phase 1384 static audit checks the source-level contract boundaries. It is not a successful build or runtime test. In this workspace, `npm run build` currently fails because `tsdown` is not installed (`sh: 1: tsdown: not found`). Package version `1.0.49` and build script `tsdown` are unchanged.
