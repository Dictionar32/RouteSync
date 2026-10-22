# Phase 1382 — Upstream AST Proof + Dataflow Contract Trace

## Goal

Strengthen the contract chain rather than adding another downstream classifier:

`Laravel/source evidence -> upstream AST/ADT -> semantic reasoning + dataflow judgment -> closed capability contract -> wiring -> runtime executor -> manifest/graph/IR/CLI/SDK/React/Next.js projection`.

The runtime executor must execute a contract already reasoned upstream. It must not repair missing proof, infer route semantics from strings, or close dataflow a second time.

## Changes in this phase

- `packages/core/src/types/upstream/astSemanticInterface.ts`: `closeFacts` now carries the derivation list in the same fixed-point state as facts. Each rule application that contributes new conclusions records its typed rule, deterministic witness, premises, and newly introduced conclusions. It no longer advertises an empty derivation list for a closure that actually derived facts.
- `packages/core/src/types/upstream/__tests__/ast-semantic-closure-proof.phase1382.test.ts`: adds focused cases for proof-carrying closure and unmatched rules.
- `scripts/audits/audit-phase1382-upstream-ast-proof-dataflow-contract.cjs`: audits AST proof, canonical dataflow aliases, authority/runtime boundary, operation identity authority/projection, IR, and target integration presence.
- `scripts/audits/reports/phase1382-upstream-ast-proof-dataflow-contract.json`: machine-readable audit result.

## Actual source trace

### Operation identity

`routeProducerRelations.ts -> operationIdentityCapabilityFromRoute -> OperationIdentityCapabilityAuthorityInterface -> OperationIdentityCapabilityContract -> operationIdentityProjection -> CLI apiObjectEmitter -> SDK defineApi / React hooks`.

The identity authority delegates to the canonical algebra. The projection accepts the closed capability and serializes a stable reference; it does not need to reclassify HTTP methods. Existing Phase 1375 audit verifies the identity chain.

### AST / semantic reasoning / dataflow

`highLevelSourceModel.ts + scanner evidence -> semanticDataflowInputFactory / SemanticDataflowInput -> semanticDataflowAuthority.ts -> SemanticDataflowJudgment -> SemanticDataflowDataFlowAdapter -> DataFlowAuthorityInterface -> analysis / SemanticDataflowIRProjection`.

`astDataflowInterface.ts` aliases the canonical `SemanticDataflowInput` and `SemanticDataflowJudgment`; it does not create a parallel AST dataflow model. The read-only authority exposes input/state/reachability/closure. The solver and fixed-point reachability/path closure remain owned by the upstream authority.

The AST semantic relation closure is a separate AST-stage algebra; this phase makes its derivations truthful. It does not merge AST syntax facts, semantic dataflow facts, structural graph relations, and IR into one untyped relation bag.

### Manifest / graph / IR

`upstreamManifestBuilder.ts` validates and completes source AST, calls `buildCompleteLaravelSourceModel`, and emits the canonical manifest with source model and dataflow inputs. `SemanticDataflowIRProjection.ts` reads the closed `DataFlowAuthorityInterface.state`; graph projection consumes `StructuralSemanticRelation` and creates `GraphEdgeRelation`. Structural dependency edges and runtime value-flow/reachability remain distinct.

### React / SDK / CLI / example target stack

- React hooks and SDK runtime should consume endpoint/operation capabilities and typed schema contracts.
- CLI generators emit route modules, Zod schemas, and TanStack Query hooks from manifest contracts; Axios is an HTTP execution layer, not a semantic source.
- `examples/ecommerce-shop-source/frontend/src/api-compiler` has explicit contract/schema/mapper layers, while `frontend/src/lib/core/api-client.ts` uses Axios and `frontend/src/lib/query-client.ts` uses TanStack Query.
- Laravel routes and middleware are evidence: middleware may authenticate/filter a request, but its source representation must be resolved into a closed security/capability judgment upstream. See official Laravel middleware docs.

## Remaining migration debt (not hidden by this phase)

- `generators/classifier/pathClassifier.ts` is already empty. `routeGrouper.ts` consumes `route.capability.crudRole` and `route.capability.actionName`, and explicitly disallows path/method semantic fallback; it is a legacy projection/grouping surface, not the current CRUD authority. Keep its compatibility projection until consumers are migrated and audited; do not repopulate the empty path classifier.
- The example `frontend/src/api/sdk/runtime.ts` contains `any` in its mapper extraction surface. This is a target-example type-safety debt, not evidence that the upstream semantic contract is incomplete; it should be replaced with a typed mapper contract in a separate bounded phase.
- `DataFlowAuthorityInterface` is the correct consumer boundary, but source audit alone cannot prove all runtime values came from the canonical authority. The next hardening step should add consumer-level tests and a no-reclassification audit over the remaining CLI generators and SDK/React entry points.
- `AstSemanticClosure.converged` reports fixed-point convergence, while derivation records describe newly introduced facts. A future proof-validation layer should check that each premise is available before the witness round and every non-seed fact has at least one derivation. This phase does not claim a full proof checker.

## Validation

- Phase 1382 structural audit: 18/18 passed.
- Phase 1381 route capability closed-contract audit: 8/8 passed.
- Phase 1375 operation identity authority contract: 22/22 passed.
- Phase 1373 reasoning/judgment interface composition: 24/24 passed.
- Phase 1350 semantic reasoning contract: 11/11 passed.
- `npm run build` could not run because `tsdown` is not installed in this workspace (`sh: 1: tsdown: not found`). The global `tsc` is 5.8.3, older than the repository's TypeScript 7.0.2 configuration; its `--noEmit` run is blocked by unsupported target/lib options and missing `@types/node` / `vitest/globals`. The new Vitest test file is added but not executed here. Do not treat source audits as build/test success.
- `package.json` version remains `1.0.49`; `build` remains `tsdown`.

## Official references and design implications

- MLIR Interfaces: <https://mlir.llvm.org/docs/Interfaces/> — generic transformations and analyses should depend on semantic interfaces instead of hard-coded knowledge of each concrete operation/dialect.
- TypeScript 7.0 announcement: <https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/> — the native port is designed to preserve type-checking semantics; it does not substitute for designing a complete semantic contract.
- Laravel 13 middleware: <https://github.com/laravel/docs/blob/13.x/middleware.md> — middleware is request-inspection/filtering evidence, including authentication and CSRF handling.
- TanStack Query TypeScript: <https://tanstack.com/query/latest/docs/framework/typescript> — typed query-function results support downstream inference; query typing should consume already-resolved endpoint contracts.
- TypeScript narrowing: <https://www.typescriptlang.org/docs/handbook/2/narrowing.html> — discriminated unions encode variants so a consumer can handle a closed contract rather than guess from unrelated fields.
- CodeQL JavaScript/TypeScript dataflow: <https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/> — use independent source-to-sink analysis to audit whether raw Laravel facts reach target consumers without passing through the canonical contract boundary; CodeQL is a verification tool, not RouteSync's semantic authority.
