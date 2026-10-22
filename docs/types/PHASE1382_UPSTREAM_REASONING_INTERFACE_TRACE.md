# Phase 1382 — Upstream Reasoning, AST/ADT Proof, Dataflow Interface Trace

## Architectural target

`Laravel/source evidence -> upstream semantic reasoning -> proof-carrying ADT/judgment -> closed contract interface -> explicit wiring -> runtime executor -> Manifest/Graph/IR/CLI/SDK/React/Next.js projections`.

The ownership rule is strict: a downstream layer may serialize, validate a boundary, query a closed judgment, or project it to a target shape. It must not reconstruct identity, classify raw Laravel evidence, close a second semantic fixed point, or synthesize proof that the upstream judgment omitted.

## Source trace

### Operation identity capability

- Contract: `packages/core/src/types/upstream/operationIdentityCapability.ts` separates `OperationIdentityCapabilityContract` from the executable `OperationIdentityCapabilityRuntimeAlgebraInterface`; the contract carries `identity` and `SemanticReasoningContract`.
- Authority: `packages/core/src/types/upstream/operationIdentityCapabilityAuthority.ts` delegates `fromRoute(input)` to the selected algebra; it does not derive identity.
- Wiring: `packages/core/src/compiler/scanner/wiring/operationIdentityProjection.ts` accepts the closed capability and projects an `OperationIdentityReference`.
- Consumer: `packages/cli/src/generators/sdk/apiObjectEmitter.ts` emits that projected reference from `route.raw.operationIdentityCapability`; `packages/sdk/src/defineApi.ts` uses `route.operationIdentity` and fails closed when it is absent.
- Route capability input is likewise explicit: `RouteCapabilityCrudInput` is the canonical tagged input to `RouteCapabilityAuthorityAlgebraInterface.resolve(input)`. The boundary resolver uses that input rather than the deprecated positional resolver.

### AST / ADT proof closure

- `packages/core/src/types/upstream/astSemanticInterface.ts` owns the AST fact/rule/closure/judgment algebra.
- The closure state now carries both `facts` and `derivations` through the same `relationFixedPoint` call. `deriveRuleApplications` records only fresh conclusions, with the applied rule, typed premise facts, conclusion facts, and a deterministic witness containing the rule name and round.
- `closeFacts` returns `fixed.value.derivations`; it no longer reports an empty derivation list while claiming a closed fixed point.
- Important semantic limit: the witness records a rule application and its premises/conclusions, but it is not a cryptographic proof and does not itself validate every rule's domain-specific soundness. Rule definitions and premise matching remain the upstream semantic authority's responsibility.

### Semantic dataflow and runtime boundary

- Types: `packages/core/src/types/upstream/semanticDataflow.ts` defines canonical identities, facts, paths, derivations, and judgment shape.
- Authority: `packages/core/src/types/upstream/semanticDataflowAuthority.ts` performs reachability/path closure and produces the closed judgment plus derivation evidence.
- Consumer contract: `packages/core/src/types/dataflow/dataFlowInterface.ts` separates producer/execution interfaces from read-only authority/consumer interfaces. `packages/core/src/types/upstream/astDataflowInterface.ts` aliases the canonical input and judgment rather than duplicating the ADT.
- Adapter: `packages/core/src/compiler/analysis/semanticDataflowDataFlowAdapter.ts` calls `authority.judge(input)` and preserves the returned `reasoningContract` and `state`.
- IR: `packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts` reads `dataflow.state.closure` and projects facts; it does not call the closure solver.
- **Remaining boundary gap:** `SemanticDataflowRuntimeBoundary.project` currently accepts `SemanticDataflowInput`; `semanticDataflowRuntimeComposition.ts` wires it to the authority, and `semanticDataflowPipeline.ts` invokes that boundary during analysis. Thus the runtime composition still *triggers* upstream reasoning at execution time. The classification logic is owned by the upstream authority, but the architecture is not yet a pure “already-closed judgment in, execute/project out” contract. A follow-up should decide whether the upstream manifest surface must carry `SemanticDataflowJudgment` (or a closed reasoning contract) before the runtime boundary, then make runtime wiring accept that closed contract without calling `judge` again. Do not change this signature without migrating manifest producer and all callers together.

### Manifest, graph, IR, CLI, SDK, React, example source

- `packages/core/src/compiler/analysis/routeSyncDataflowAnalysis.ts` selects the canonical manifest dataflow input by controller node and delegates analysis through the typed runtime boundary.
- `packages/core/src/compiler/ir/SemanticDataflowIRProjection.ts` projects closed dataflow facts; the service graph lane is separately represented under `packages/core/src/graph/service` and should remain structural rather than becoming a second value-flow solver.
- `packages/cli/src/commands/scan.ts` and `sync.ts` consume the analysis interface and project it to IR. `apiObjectEmitter.ts` consumes the already-resolved operation identity capability.
- `packages/sdk/src/defineApi.ts` consumes a stable operation identity reference. React and `examples/ecommerce-shop-source` are integration/consumer surfaces; they should not infer Laravel middleware, controller actions, or operation identity.
- Laravel source interpretation belongs upstream. Next.js route handlers, Zod schemas, Axios calls, and TanStack Query options are target-side projections: they should be generated from the closed operation/request/response contracts, not used to infer source semantics back from URL strings.

## Audit and verification

Run `npm run audit:phase1382-upstream-ast-proof-dataflow-contract`.

The static contract audit checks AST derivation evidence, AST-to-dataflow aliasing, producer/consumer interface separation, authority delegation, operation identity projection, IR consumption, CLI identity use, integration-surface presence, and preservation of package version/build script. It is a source-structure audit, not a TypeScript compilation or runtime test.

Additional passing static audits in this workspace:

- Phase 1334 upstream semantic capability/dataflow boundary: 18/18.
- Phase 1349 AST dataflow contract boundary: 14/14.
- Phase 1350 semantic reasoning contract: 11/11.
- Phase 1361 validation semantic ownership: 22/22.
- Phase 1375 operation identity authority contract: 22/22.
- Phase 1378 route security contract input: 8/8.
- Phase 1380 runtime consumes closed security contract: 8/8.
- Phase 1381 route capability closed contract: 8/8.
- Phase 1382 AST proof/dataflow contract: 16/16.

`npm run build` could not run in this environment because the shell reports `tsdown: not found` (exit 127). Vitest is also not installed in this workspace, so the added focused AST proof test source was not executed. Package version remains `1.0.49`; the build script remains `tsdown`. No build or runtime-test success is claimed.

## External references consulted

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — analyses should consume semantic interfaces rather than hard-code per-operation implementation details.
- TypeScript narrowing: https://www.typescriptlang.org/docs/handbook/2/narrowing.html — discriminated unions and exhaustive narrowing support explicit ADT contracts.
- CodeQL JavaScript/TypeScript dataflow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and dataflow nodes are distinct models; the dataflow graph represents semantic value propagation, not merely syntax shape.
- TypeScript 7.0 announcement (July 8, 2026): https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — native compiler port, compatible type-checking direction with TypeScript 6.0, and new defaults/deprecation errors. Treat TS 7 adoption as a separate compatibility audit, not a reason to silently change project toolchain.
- Next.js Route Handlers: https://nextjs.org/docs/app/getting-started/route-handlers — target-side HTTP handler conventions are projection targets, not the source of Laravel semantics.
- Zod basics: https://zod.dev/basics — schemas validate/parse values and infer types; generated schemas should come from resolved request/response contracts.
- TanStack Query TypeScript: https://tanstack.com/query/latest/docs/framework/react/typescript — typed query functions support inference; target query typing should flow from generated SDK contracts.

## Next recommended phase

Prioritize **closed-judgment handoff**: make the distinction between `SemanticDataflowInput` (evidence to reason over) and `SemanticDataflowJudgment` (already-closed result) explicit in manifest and runtime contracts. Then prove every runtime/IR/CLI/SDK/React consumer receives the latter or a lossless projection, while only the upstream authority owns `judge`, fixed-point closure, and derivation production. Add end-to-end tests for a representative Laravel route/controller/request/model/resource path in `examples/ecommerce-shop-source`.
