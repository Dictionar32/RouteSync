# RouteSync Engine Fix Record

## 2026-10-09 — Upstream capability ownership and interface wiring

### Trace scope

The reviewed path is Laravel source evidence → complete upstream source AST and route semantic flows → upstream semantic capability authority → manifest contract → wiring projection → CLI/SDK/React and graph/IR consumers. Related checks cover `operationIdentityCapability`, `SemanticDataflowJudgment`, `DataFlowInterface`, `RouteSyncManifestFlow`, `GraphEdgeRelation`, AST/ADT stage contracts, and the ecommerce Laravel fixture.

### Fixes applied

1. Split `ResourceGroupCapabilityContract` and `ResourceGroupCapabilityAlgebraInterface` into the type-only `resourceGroupCapability.ts` contract surface. Runtime group-shape construction now lives in `resourceGroupCapabilityAuthority.ts`.
2. The canonical upstream manifest builder closes `resourceGroupCapabilities` from the already-resolved `completeAst.ast.routeFlows` and stores the result on `RouteSyncManifest`.
3. `RouteSyncManifestFlow` transports the closed capability, and its projection forwards the same value. It does not reconstruct the shape.
4. The route-manifest wiring lowerer forwards `manifest.resourceGroupCapabilities`; it no longer composes group semantics.
5. CLI `domainGraphBuilder` consumes the upstream capability and fails closed if the capability set is missing. It no longer invokes a semantic fallback.
6. The public core barrel exports the capability contract types, not the runtime semantic constructor.
7. The duplicate, unreferenced `compiler/scanner/upstream/upstreamManifestBuilder.ts` was emptied in place. The canonical manifest construction path remains `compiler/scanner/wiring/upstreamManifestBuilder.ts`.
8. Phase 1318 and semantic ownership audits were updated to check semantic ownership and value forwarding instead of expecting construction in the retired path. DTS audits were aligned with the actual `tsdown.config.ts` (`dts: true`, root `tsconfig.json`) rather than requiring a nonexistent `tsconfig.dts.json`.

### Invariants

- Upstream semantic authority owns classification and proof; contracts describe the closed result.
- Wiring transports closed capability values without reclassification.
- Downstream generators project the supplied contract and fail closed when required semantic evidence is absent.
- Structural `GraphEdgeRelation` and semantic data-flow closure remain separate lanes.
- Operation identity construction remains upstream-owned; SDK and React consume the closed operation identity/hook metadata.
- Axios remains transport, Zod schema validation, mapper data-shape transformation, and TanStack Query cache/query behavior. None becomes RouteSync's semantic authority.

### Verification

The following source audits were run after the capability ownership change: Phase 1318 generator capability audit, semantic ownership coverage, Phase 1347 upstream wiring consumer trace, Phase 1344 semantic interface/wiring exports, Phase 1309 interface no semantic reasoning, Phase 1310 downstream no method semantic fallback, Phase 1312 semantic contract projection, Phase 1313 upstream capability completeness, Phase 1316 proof-preserving route capability, and the public export-boundary audits.

A full `npm run build` has **not** been run in this workspace because dependencies (`node_modules`) are absent. Static audit success is not a build-pass claim. This existing root record was extended with the Phase 1349 trace and fixes below.


## 2026-10-09 — AST data-flow contract and stage boundary

### Trace findings

- `types/upstream/semanticDataflow.ts` and `semanticDataflowAuthority.ts` are the canonical semantic data-flow ADT and constructor. The empty `astDataflowInterface.ts` contradicted the historical Phase 760 document, while `AstAnalysisJudgment` directly repeated the generic `DataFlowAuthorityInterface<...>` parameters.
- The semantic-dataflow wiring adapter preserves `state.reasoningContract`; AST analysis consumes the closed authority surface; `SemanticDataflowIRProjection` projects `state.closure` without recomputing it.
- `RouteSyncManifestFlow` is intentionally AST-free. Concrete AST/source-model construction stays upstream; downstream receives the resolved semantic flow.

### Fixes applied

1. Filled `types/upstream/astDataflowInterface.ts` as a type-only AST/ADT boundary with stable aliases for identity, fact, input, judgment, and the read-only `DataFlowAuthorityInterface`. It deliberately contains no solver or runtime semantic constructor.
2. Changed `AstAnalysisJudgment`, `AstAnalysisInput`, and analysis fact payloads to consume the AST-facing aliases instead of restating the generic data-flow type parameters and canonical fact type. Closure facts are projected with `relationProject`, not an array-method adapter.
3. Split `astSemanticStageInterface.ts` into a type-only contract and `astSemanticStageAuthority.ts` for runtime contract values, fact construction, ports, and pipeline wiring. Updated consumers to import runtime authority and type contracts from their separate boundaries.
4. Exported the AST data-flow contract from the upstream barrel and public core package.
5. Corrected the Phase 760 documentation to identify `semanticDataflow.ts` / `semanticDataflowAuthority.ts` as the actual semantic authority and `astDataflowInterface.ts` as its AST-facing contract.
6. Emptied the unreferenced historical `compiler/analysis/astDataflowAuthority.ts`, `compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts`, and `compiler/scanner/descriptors/route/routeDeclarations.ts` in place after tracing their references; the canonical authority and route producer paths remain active.
7. Replaced the `Sequence<T>` narrowing cast in `relationSequenceToArray` with `relationVariantFold`; the Phase 668 audit now checks the actual `semantic/foundation/relationalSequence.ts` path.
8. Added `audit:phase1349-ast-dataflow-contract-boundary` and expanded semantic ownership coverage to assert the AST contract → wiring → analysis → IR boundary and the AST-free manifest flow.

### Verification status

Verification: 34/34 selected semantic-ownership, operation-identity, group-capability, AST-stage, data-flow-boundary, and inactive-file audits passed; syntactic transpilation passed for 19/19 changed TypeScript files. Full TypeScript build/test execution remains unverified: `npm run build` exits 127 because `tsdown` is absent from `node_modules`, and the available global TypeScript 5.8.3 cannot validate this repository's `target: ES2025` / TypeScript 7 configuration. No downstream semantic fallback is introduced.

## Phase 1350 — Semantic reasoning contract boundary (2026-10-09)

### Applied
- Split `SemanticRelationReconciliationInterface`, `RelationReconciliationStatus`, and `SemanticRelationReconciliationAuthorityInterface` into the type-only `types/upstream/semanticReconciliation.ts` contract.
- Moved the runtime reconciliation implementation to `types/upstream/semanticReconciliationAuthority.ts` and exposed a single `semanticRelationReconciliationAuthority` implementation of the declared contract.
- Changed `compiler/scanner/semantic/model/modelSemanticDefinition.ts` to consume the canonical authority through `semanticRelationReconciliationAuthority.reconcile`; the model builder no longer imports a runtime implementation from a contract-named module.
- Updated reconciliation tests to import the runtime function from the authority module while type-only consumers continue importing the contract.
- Added `scripts/audits/audit-phase1350-semantic-reasoning-contract.cjs` and extended semantic ownership coverage for this contract/authority boundary.

### Verification
- `node scripts/audits/audit-phase1350-semantic-reasoning-contract.cjs`: PASS 11/11.
- `node scripts/audit/semantic-ownership-coverage.cjs`: PASS 79 checks.
- Full TypeScript build remains unverified in this workspace because project dependencies (`tsdown`/`node_modules`) are unavailable. Audit passes are not a substitute for a build or test run.

### Remaining semantic-reasoning frontiers (not claimed as fixed)
- `types/upstream/highLevelSourceModel.ts`: route/action policy composition still performs identity matching and branches over route target variants. Some are legitimate ADT eliminations; the semantic ownership of the complete composition still deserves a dedicated contract/authority extraction.
- `types/upstream/semanticReconciliationAuthority.ts`: candidate matching, reconciliation status, and canonical key selection still contain direct decision logic. This now has one explicit authority, but a future relation-algebra pass should encode relation-kind/key policy as a closed decision algebra and add conflict/ambiguity proofs before attempting to remove branches.
- `compiler/scanner/orchestrator/sourceAstScanner.ts`: source discovery, AST evidence collection, and source-kind orchestration should be audited separately to distinguish syntactic discovery from domain semantic inference.
- Downstream graph/IR/SDK/React must continue to consume closed upstream results and must not recreate these decisions when evidence is absent.

## Phase 1351 — Semantic reconciliation algebra (2026-10-09)

- Promoted Eloquent/schema relation applicability, candidate selection, canonical-key selection, reconciliation status, effective-key selection, and schema evidence projection into `SemanticReconciliationAlgebraInterface` plus the canonical `semanticReconciliationAlgebra` implementation.
- Kept `semanticReconciliation.ts` contract-only. `semanticReconciliationAuthority.ts` now orchestrates the algebra and seals the closed result; it no longer owns relation-kind/candidate-count/key-fallback classification.
- Exported the algebra through the upstream type barrel and added `scripts/audits/audit-phase1351-semantic-reconciliation-algebra.cjs` to guard against semantic logic drifting back into authority or model builder.
- Added `ControllerActionBindingAlgebraInterface`, a closed `supplied_policy | catalog_controller | unbound` result ADT, and a canonical upstream binding authority. `highLevelSourceModel.ts` now projects candidate identities and consumes that authority instead of independently searching supplied policies/controllers. Remaining source-model work is effective-policy composition itself, whose rules still live in `effectiveControllerActionPolicyResolver.ts`; that resolver should be assessed as a declarative middleware/policy algebra rather than moved blindly.
- Validation status for this phase must be reported from actual audit/transpilation runs. A full project build still requires the declared TypeScript 7 / tsdown workspace dependencies.

### Phase 1351 validation record

- `audit:phase1351-semantic-reconciliation-algebra`: PASS 19/19.
- `audit:phase1351-controller-action-binding`: PASS 8/8.
- `audit:phase1350-semantic-reasoning-contract`: PASS 11/11.
- `audit:semantic-ownership-coverage`: PASS 79 checks.
- Phase 1347 upstream/wiring/consumer trace: PASS 12/12.
- Phase 1344 semantic interface/wiring boundary: PASS 20/20.
- Phase 1318 resource-group capability ownership: PASS 12/12.
- Phase 1310 downstream method fallback: PASS.
- TypeScript 5.8.3 scoped strict check of seven modified source files: zero diagnostics. Full root `tsc` cannot run with the available global compiler because it does not support this repository's `ES2025` target/lib and workspace type packages (`node`, `vitest/globals`) are not installed. Full build remains unverified until the repository's declared TypeScript 7.0.2 and `tsdown` dependencies are installed.


## Phase 1352 — Effective controller-action policy algebra (2026-10-09)

### Trace findings
- `types/upstream/effectiveControllerActionPolicyResolver.ts` still owned middleware scope applicability, middleware exclusion matching, controller middleware ADT interpretation, and authorization applicability as procedural logic. This meant Phase 1351 had centralized controller/action identity binding but had not yet made effective-policy composition a shared algebra contract.
- `highLevelSourceModel.ts` already called the resolver; the appropriate boundary is therefore an algebra consumed by the resolver, not another semantic decision in the source-model builder or downstream projection.

### Fixes applied
1. Extended the type-only `effectiveControllerActionPolicy.ts` contract with `EffectiveControllerActionPolicyUpstreamInput`, `ControllerMiddlewarePolicyParts`, and `EffectiveControllerActionPolicyAlgebraInterface`.
2. Added `effectiveControllerActionPolicyAlgebra.ts` as the canonical owner of controller middleware relation interpretation, `only`/`except` scope applicability, middleware exclusion matching, and authorization action applicability.
3. Reduced `effectiveControllerActionPolicyResolver.ts` to orchestration: merge upstream declarations/exclusions, delegate decisions to the algebra, and seal the `EffectiveControllerActionPolicy` result with provenance and inheritance evidence.
4. Exported the algebra at the upstream barrel and added `audit:phase1352-effective-policy-algebra`.
5. Expanded semantic ownership coverage to guard the contract → algebra → resolver boundary and prohibit policy-classification logic from drifting back into the resolver.

### Verification
- Phase 1352 effective policy algebra audit: PASS 11/11.
- Phase 1351 reconciliation algebra audit: PASS 19/19.
- Phase 1351 controller/action binding audit: PASS 8/8.
- Phase 1350 semantic reasoning contract audit: PASS 11/11.
- Semantic ownership coverage: PASS 83 checks.
- Full TypeScript 7 build remains unverified because this extracted workspace does not have its declared dependencies installed (`node_modules`/`tsdown`). The audit results are source-boundary checks, not a full compile/test claim.

### Remaining frontier
- `highLevelSourceModel.ts` still performs ADT projection from route target/request/response bindings and constructs the final relation graph. Trace each branch to distinguish legitimate ADT elimination from semantic inference that belongs in upstream authority; extract only the latter.
- `sourceAstScanner.ts` still coordinates source discovery and AST evidence production. Keep filesystem discovery and syntax parsing in the scanner, but move any cross-domain meaning inference into upstream semantic authorities.
- Verify `only`/`except`, duplicate declarations, exclusion precedence, authorization scope, and provenance through the existing focused policy tests when the project test runner is installed.

## Phase 1353 — Upstream AST contract closure and resource-group relation algebra (2026-10-09)

### Trace scope
- Traced `operationIdentityCapability` from the type-only upstream contract and authority through `RouteSemanticFlow`, the canonical route manifest flow, `routeManifestLowerer`, and the CLI SDK emitter. The downstream emitter projects `route.raw.operationIdentityCapability`; it does not call the upstream constructor.
- Traced `DataFlowInterface` and `AstDataflowInterface` through the read-only `DataFlowAuthorityInterface`, AST analysis input, the data-flow wiring adapter, and `SemanticDataflowIRProjection`. AST/dataflow reasoning remains upstream-owned; IR receives the closed state/closure rather than re-solving it.
- Traced resource-group capability from route flows in the upstream manifest builder, through manifest/scanner wiring and `routeManifestLowerer`, into the CLI graph builder. The CLI consumes the closed group capability and fails closed if it is missing.
- Traced the AST stage graph, stage-interface algebra, stage authority, transition proof ADT, and authority pipeline. The graph-membership relation existed in `astSemanticStageContract.ts` but was not used to validate the authority pipeline. `astSemanticPipelineInterfaces` and `astSemanticInterfaceProofs` were also helper surfaces not consumed by the pipeline.
- Checked semantic ownership guards for React/SDK/CLI method/action/operation-ID reclassification, and the ecommerce frontend transport boundary: Axios remains transport, Zod validates data shapes, mapper transforms payload shapes, and TanStack Query owns query/cache behavior. These libraries are not substitutes for RouteSync's domain-semantic authority.

### Changes applied
1. Added `resourceGroupCapabilityAlgebra.ts` behind the existing type-only `ResourceGroupCapabilityAlgebraInterface`. Group accumulation now uses immutable relation-index operations and `relationFold`; role membership uses relation membership; closed shape selection is centralized in the algebra.
2. Reduced `resourceGroupCapabilityAuthority.ts` to a stable upstream authority adapter delegating to `resourceGroupCapabilityAlgebra.compose`. It no longer owns CRUD group-shape classification or host `Map`/`Set` accumulation.
3. Preserved first-seen group order while updating an existing relation-index entry, so moving classification into the relation algebra does not reorder groups by their last route occurrence.
4. Wired `stageGraphContains` into AST authority-pipeline stage validation. The pipeline now projects its ports once with `astSemanticPipelineInterfaces`, selects stages from that closed sequence, narrows each stage through the stage discriminant, and consumes `astSemanticInterfaceProofs` for transition proof selection.
5. Added `audit:phase1353-upstream-ast-contract-closure`; strengthened Phase 1318 resource-group audit and `semantic-ownership-coverage` to protect the contract → algebra → authority → wiring → downstream boundary.
6. Did not empty/delete unused upstream declarations indiscriminately. An unused export must be classified by responsibility first: some helpers are now wired because the pipeline needs them; trivial fact accessors without a separate semantic role remain candidates for a dedicated usage/API decision rather than being activated artificially.

### Verification
- Phase 1353 upstream AST contract closure: PASS 28/28.
- Phase 1318 resource-group capability ownership: PASS 14/14.
- Semantic ownership coverage: PASS 87 checks.
- Phase 1352 effective-policy algebra: PASS 11/11.
- Phase 1351 semantic reconciliation algebra: PASS 19/19.
- Phase 1351 controller/action binding: PASS 8/8.
- Phase 1350 semantic-reasoning contract: PASS 11/11.
- Phase 1347 upstream/wiring/consumer trace: PASS 12/12; Phase 1344 interface/wiring boundary: PASS 20/20; Phase 1349 AST/dataflow contract boundary: PASS 14/14; Phase 1310 downstream no-method fallback: PASS.
- A scoped global TypeScript check reports **no diagnostics in the five Phase 1353 TypeScript files**. It still reports 29 diagnostics in other imported modules (including resource-model resolver/projection/surface, resource-model-key capability, semantic capability/dataflow/reasoning, and AST transition modules). This is not a clean project typecheck.
- Full `npm run build` and runtime tests were not run: `node_modules`/`tsdown` are absent in this extracted workspace. Static audit passes must not be read as a build/test pass.

### External design references checked
- MLIR's official interface model: generic analyses/transformations should depend on declared semantic interfaces rather than special-case concrete operation types.
- CodeQL's JS/TS data-flow model distinguishes AST nodes from data-flow nodes; RouteSync similarly keeps AST-facing contracts distinct from semantic data-flow authority.
- Laravel routing is the source-side route/controller/middleware vocabulary; Next.js route handlers are a target-side routing convention, not a replacement for Laravel semantic identity.
- TypeScript 7.0's official announcement confirms the native compiler release context; it does not justify assuming this workspace has a successful TS 7 build without installing the declared toolchain.
- Zod, Axios, and TanStack Query documentation reinforces their distinct roles (schema validation, HTTP transport, and query/cache state respectively), which must remain downstream of RouteSync semantic decisions.

### Remaining frontier
- Continue an inventory of all exported upstream type/interface symbols and classify each as live contract, missing wiring, deliberately type-only, or obsolete/duplicate. Do not bulk-empty files from a name-only search.
- Trace `highLevelSourceModel.ts` for semantic inference beyond legitimate ADT elimination, and `sourceAstScanner.ts` for cross-domain inference versus syntax/discovery.
- Fix the pre-existing TypeScript diagnostics outside the Phase 1353 files in separate, traced semantic-algebra passes; do not conflate them with the resource-group or AST-stage wiring changes.

## Phase 1354 — upstream contract usage inventory and AST fact wiring

### Trace and changes
- Continued from `RouteSync-phase1353-upstream-ast-contract-closure-20261009.zip`; the package root remains `RouteSync/` and the existing `build: tsdown` script is preserved.
- Traced `operationIdentityCapability` from upstream authority through route producer relations and manifest/wiring to the CLI projection. The CLI serializes the closed capability rather than rebuilding operation identity.
- Traced the resource-group capability from contract/algebra/authority through manifest lowerer to the CLI graph builder. The algebra owns grouping and group-shape reasoning; the CLI consumes the closed capability and fails closed if it is missing.
- Traced the AST stage contract, stage graph, stage-interface algebra, stage authority, transition proofs, and authority pipeline. The `astSemanticInterfaceFacts` projection was declared but unused. The AST authority pipeline now seals an ordered aggregate `facts` ADT from its projected stage interfaces in both pipeline constructors, preserving each fact's stage discriminator.
- Added `audit:phase1354-upstream-contract-usage`, which inventories exported `type`/`interface` declarations in `core/src/types/upstream`, searches identifier occurrences across packages, and writes `scripts/audits/reports/phase1354-upstream-contract-usage.json`. This is a candidate inventory, not a deletion list: occurrence counts cannot prove semantic liveness or obsolescence.
- Extended `semantic-ownership-coverage` to guard the new AST fact projection and pipeline aggregation boundary.
- Reviewed the downstream responsibility boundary: React/SDK/CLI consume upstream identity/capabilities; Axios is transport, Zod validates shapes, mapper maps payload shapes, TanStack Query manages query/cache behavior, and Next.js route handlers are target conventions rather than Laravel source semantics.

### Verification and limitations
- Phase 1354 upstream contract usage audit: PASS 12/12; inventory found 1,197 exported type/interface declarations across 165 upstream files, 803 with external identifier occurrences and 394 unreferenced candidates requiring semantic classification.
- Semantic ownership coverage: PASS 90 checks; Phase 1353 AST contract closure: PASS 28/28; Phase 1352 policy algebra: PASS 11/11; Phase 1351 reconciliation: PASS 19/19; controller/action binding: PASS 8/8; Phase 1350 reasoning contract: PASS 11/11; Phase 1347 wiring trace: PASS 12/12; Phase 1344 interface wiring: PASS 20/20; Phase 1349 AST/dataflow boundary: PASS 14/14; Phase 1318 group capability: PASS 14/14.
- A scoped `tsc --noEmit` check on the AST pipeline has 29 diagnostics in other imported modules; no diagnostic points to `astSemanticAuthorityPipeline.ts`. Global `tsc` is 5.8.3, not the project’s intended TypeScript 7 toolchain.
- This extracted workspace has no `node_modules`; `npm run build` and runtime tests are not claimed as passing.
- The exported type/interface inventory deliberately marks unreferenced declarations as candidates for human semantic review. It does not auto-empty or delete them.


## Phase 1355 — Operation Identity Runtime Algebra Boundary (2026-10-09)

- Distinguished the type-only closed capability shape from the behavioral runtime-algebra contract via `OperationIdentityCapabilityRuntimeAlgebraInterface` and `OperationIdentityCapabilityInput`.
- Added `operationIdentityCapabilityAlgebra.ts` as the executable constructor that seals the identity capability while preserving the route's existing reasoning, evidence lineage, derivation, and provenance. It does not reclassify the route method or derive a new identity.
- Reduced `operationIdentityCapabilityAuthority.ts` to an upstream authority boundary delegating to `operationIdentityCapabilityAlgebra.fromRoute`.
- Exported the runtime algebra and its contract through the upstream/core barrels. The existing `OperationIdentityCapabilityAlgebraInterface` remains source-compatible as the closed capability result shape; it is not the runtime object.
- Added `audit:phase1355-operation-identity-runtime-algebra` to check the contract → runtime algebra → authority → route producer → CLI projection boundary.
- Full build/runtime validation still requires the repository's declared toolchain and dependencies; static audit does not substitute for a build.

- Detailed trace: `packages/core/src/types/docs/PHASE1355_OPERATION_IDENTITY_RUNTIME_ALGEBRA.md`.

## Phase 1356 — 394 upstream contract candidates: symbol-surface and wiring triage (2026-10-09)

- Replaced the interpretation of the Phase 1354 lexical inventory with a richer TypeScript-AST occurrence report. The original 394 candidates are a review queue, not a dead-code list.
- The audit now distinguishes same-file references, external identifier occurrences, import/export references, source type-position occurrences, runtime-position occurrences, and reachability through upstream/package barrel exports. It records source locations for follow-up instead of deciding deletion from a zero external-text count.
- Each candidate receives a triage class: `externally_referenced`, `same_file_only`, `public_surface_unconsumed`, or `no_reference_no_barrel`; recommendations are advisory and preserve contracts until a semantic owner/consumer trace justifies a change.
- This phase deliberately does not delete/empty candidate files and does not add runtime implementations merely to make declarations appear used. Runtime algebra is required only when the contract represents executable semantic behavior; data/result ADTs remain type-only when appropriate.
- Architectural review order: semantic capability / identity / authority / algebra contracts first; AST/ADT and DataFlow contracts second; source-domain vocabulary and structural evidence third. For every candidate, trace producer → contract → runtime algebra/authority (if behavioral) → wiring → consumer, and distinguish a missing consumer from a deliberately public type-only contract.
- The AST-aware triage classified the original 394 candidates as 361 `same_file_only`, 31 `public_surface_unconsumed`, and 2 `no_reference_no_barrel`. The first group is not automatically dead: self-file references commonly indicate internal ADT members, aliases, or helper contracts. The two highest-priority no-reference cases are `RouteConstraintFlow` and `ApiResourceAction`; their current route-constraint AST/data-flow path and resource action knowledge were traced, and neither was force-wired merely to silence the audit. `RouteConstraintFlow` has no producer/consumer and appears disconnected from the active `RouteDeclarationAst`/`routeDataFlow` constraint path; `ApiResourceAction` is a narrower alias not used by the resource action knowledge table, whose modes already encode API-resource exclusions. Both remain preserved pending tests and semantic-owner review.
- References: MLIR Interfaces motivates generic semantic queries without per-operation special cases; CodeQL explicitly distinguishes AST nodes from data-flow nodes. These support separate AST, semantic judgment, and data-flow contracts rather than collapsing them.

## Phase 1357 — 31 public upstream contracts: TypeChecker symbol-identity trace (2026-10-09)

### Scope

Follow-up to the 394-candidate triage from Phase 1356. This phase isolates the 31 declarations classified as `public_surface_unconsumed` and upgrades their evidence from textual identifier matching to TypeScript Compiler API symbol identity.

### Implementation

- Added `scripts/audits/audit-phase1357-public-contract-symbol-usage.cjs` and `scripts/audits/reports/phase1357-public-contract-symbol-usage.json`.
- The audit creates a `Program` from `tsconfig.json`, uses `program.getTypeChecker()`, resolves import aliases, and compares references to each exact declaration symbol.
- Each contract now has a semantic disposition and an explicit next action: boundary candidate, public type/ADT candidate, vocabulary overlap, collection contract candidate, alias overlap, model overlap, or aggregate contract candidate.
- The 31 candidates remain exported through the existing upstream barrel, but no direct TypeChecker-resolved symbol references were found inside the program. This is evidence of absent internal consumers, not proof of dead public API.
- No source contract was removed, emptied, or given an artificial consumer. In particular, the empty `RouteCapabilityInterface` alias and the `SourceBoundaryInput` / `CanonicalSourceNode` ADT remain candidates for deliberate API/ownership review rather than automatic edits.
- Added `npm run audit:phase1357-public-contract-symbol-usage` and semantic ownership coverage checks for the symbol-aware audit.

### Results

- 31/31 candidate declarations resolved by the TypeChecker.
- 31/31 are reachable through the checked export-star barrel graph.
- 31/31 have zero resolved symbol references within the TypeScript program.
- 31/31 have explicit semantic disposition and recommendation.
- Audit ran with TypeScript 5.8.3 available in the environment. The repository declares TypeScript 7.0.2; this run is not evidence that the TypeScript 7 toolchain was used or that the full project builds with it.

### Architecture decision

Do not manufacture runtime implementations for type-only contracts merely to create references. Promote a candidate into `contract -> runtime algebra/authority -> wiring -> downstream` only when a real semantic producer/consumer path is demonstrated. This keeps ADT and vocabulary contracts from becoming duplicate semantic authorities.

## Phase 1359 — Canonical Source Boundary Algebra

- Closed the mismatch between `AstSemanticSchemaKind` and the source-boundary vocabulary by adding the existing `channel_ast` kind as `ChannelAst` / `channel_source`.
- Added `sourceBoundaryAlgebra.ts` as an exhaustive, representation-only mapping from `CanonicalSourceNode` to `SourceBoundaryInput`, with a `never` exhaustiveness check and a reverse node accessor that preserves object identity.
- Exported the algebra from the upstream barrel. The algebra does not parse source text, infer Laravel semantics, rebuild provenance, or replace `CompleteSourceAst`.
- Kept the concrete manifest path unchanged: it validates `CompleteSourceAst`, builds `CompleteLaravelSourceModel`, then projects manifest dataflow seeds. No artificial pass was inserted into manifest wiring because the existing source model is category-structured and already canonical.
- Updated the Phase 1357 symbol audit to track the new source-boundary references through the compiler symbol graph. `CanonicalSourceNode` and `SourceBoundaryInput` now move out of the unconsumed-only set; the public-surface subset falls from 31 to 29, and the Phase 1356 candidate inventory from 394 to 392. All other unconsumed candidates remain untouched.
- Made Phase 1356 triage compare its candidate count against the regenerated Phase 1354 inventory instead of a stale hard-coded count, so the audit chain remains consistent when a real consumer is added.
- Validation: Phase 1359 source-boundary audit 15/15; Phase 1358 path audit 13/13; Phase 1357 symbol audit 6/6. TypeScript 5.8.3 targeted compilation was attempted but repository-wide imported type errors in pre-existing resource-model and semantic-reasoning files prevent a clean typecheck. TypeScript 7.0.2 and the `tsdown` build were unavailable because local dependencies are absent; no full-build claim is made.

## Phase 1360 — Semantic Boundary Ownership Trace (2026-10-09)

- Added `audit:phase1360-semantic-boundary-ownership` and its machine-readable report to trace the actual ownership path for `ControllerExpressionFact`, `ExpressionDefinition`, `ValidationRuleDefinition`, `SchemaRelationTarget`, `RouteConstraintFlow`, and `ApiResourceAction`.
- Confirmed the first two and `SchemaRelationTarget` remain declaration-only in core source. Preserved them instead of manufacturing references; their fields either overlap existing canonical evidence or lack a demonstrated consumer.
- Identified `ValidationRuleDefinition` as a parallel vocabulary beside the active domain `ValidationRuleNode` / `ValidationRuleParser` form-request pipeline. Did not bridge them in this phase because an adapter could create a second Laravel-rule classifier. Future migration must define one owner and preserve provenance/unsupported-rule semantics.
- Confirmed model schema relation construction already consumes `schemaRelationIndexFrom` and `SchemaRelationIndexInterface`; the simple `SchemaRelationTarget` tuple is not required by that path.
- Confirmed active route constraint facts/provenance are represented by `routeDataFlow.ts`; the disconnected `RouteConstraintFlow` contract remains untouched. `ApiResourceAction` remains an unused narrow alias beside `RouteResourceActionPlan` and is not force-wired.
- Preserved the existing canonical path: `CompleteSourceAst` validation -> `CompleteLaravelSourceModel` -> manifest/dataflow seeds; DataFlow and graph remain separate projection lanes; CLI/SDK/React consume explicit capability/identity contracts.
- Validation: Phase 1360 static ownership audit 16/16. No full build claim: environment has global TypeScript 5.8.3, project declares 7.0.2, and local `node_modules` / `tsdown` are absent. TypeScript 7.0's official announcement states that the 7.0 compiler itself does not ship a programmatic API; symbol audits need the compatible API package/version.
- Detailed trace: `packages/core/src/types/docs/PHASE1360_SEMANTIC_BOUNDARY_OWNERSHIP.md`.

## Phase 1361 — Validation semantic ownership and downstream projection

- Removed the CLI enum generator's legacy Laravel validation rule string parsing. The generator now reads canonical `RouteSchemaPayload.fields[].validation` ADTs and extracts `in` values from typed nodes.
- Removed the legacy `any` rule-node callback and the `Record<string, unknown>` cast in `enumConstantsBuilder.ts`.
- Kept upstream `ValidationRuleDefinition` unchanged and unwired: no source producer/consumer was proven, and bridging it without a canonical migration would duplicate semantic interpretation.
- Added `scripts/audits/audit-phase1361-validation-semantic-ownership.cjs` and its generated JSON report.
- Build script remains `tsdown`; full TypeScript 7.0.2 build is not verified because `tsdown`/node_modules are unavailable in the supplied workspace.

## Phase 1362 — Canonical schema-shape ownership (2026-10-09)

- Removed stale `schema.rules` checks from CLI singleton/custom group classification, form payload type resolution, and SDK API body-mapper emission.
- Added upstream `hasCanonicalRequestFields(RouteSchemaPayload)` based only on canonical `fields`; the route capability authority and downstream projections now share this one shape fact.
- Kept Laravel validation interpretation at scanner origin and typed `ValidationRuleNode` projection from Phase 1361. No legacy fallback or downstream rule parsing was introduced.
- Added `npm run audit:phase1362-canonical-schema-shape-ownership` and its JSON report.
- Build remains unverified: `tsdown`/local dependencies are absent in the workspace.

## Phase 1363 — Upstream contract closure and operation identity consumption (2026-10-09)

- Audited `ValidationRuleDefinition`, `ControllerExpressionFact`, `ExpressionDefinition`, and `SchemaRelationTarget` across production source trees. Each has a declaration but no production consumer in the traced workspace; the report records the active canonical alternative and disposition.
- Preserved all four declarations. They are unconsumed candidates, not proven-dead public API. No artificial producer, consumer, or duplicate semantic authority was added.
- Removed the redundant `as OperationIdentityReference` assertion from SDK `defineApi`: the existing guard narrows `RouteDefinition.operationIdentity` to the already-typed reference contract before `$key` and `$queryKey` are attached.
- Traced operation identity from runtime algebra and authority through representation projection/manifest into SDK; React consumes the closed `hookKind` contract. The AST/dataflow and graph/IR boundaries remain distinct.
- Added `npm run audit:phase1363-upstream-contract-closure` and its JSON report.
- Full build remains unverified because local `node_modules/tsdown` is unavailable; static audit results are not represented as a successful build.

## Phase 1364 — Controller Semantic Flow Contract Adoption

- Replaced the duplicate inline `{ variables: Sequence<ControllerVariableBinding> }` shape in `ControllerDataflowContract` with upstream `ControllerSemanticVariableFlow`.
- Applied the same canonical contract to the builder return type and resource-binding consumer parameter.
- Kept AST evidence and semantic dataflow as distinct representations; no unrelated unused contract was force-wired.
- Added `audit:phase1364-controller-semantic-flow-contract` and its JSON report.
- Build/runtime status must be verified separately; static audit success is not a build claim.

## Phase 1365 — Controller Semantic Candidate Closure (2026-10-09)

- Reconnected `ControllerVariableDefinition.semantic` to the existing semantic candidate solver through the missing `semanticForValue` wiring function.
- Corrected the `DB::table(...)` candidate guard so only a non-empty table identity satisfies the candidate requirement.
- Preserved `ControllerVariableSemantic` as the upstream semantic result contract and retained explicit external fallback behavior.
- Added `scripts/audits/audit-phase1365-controller-semantic-candidate-closure.cjs` and its JSON report.
- Build status must be reported separately from the static audit; a passing audit is not evidence that `tsdown` or runtime tests passed.

## Phase 1366 — React endpoint contract boundary and cross-layer trace (2026-10-09)

- Replaced unchecked `Object.entries(group)` endpoint assertions in React `createHooks` with runtime validation of the SDK endpoint shape (`$def`, `$key`, `$queryKey`) and closed upstream `hookKind` values before selecting the TanStack Query path.
- Removed `endpoint as EndpointCallable` assertions from query/mutation dispatch. The guard validates the endpoint boundary; it does not infer semantic intent from HTTP method, path, action name, or CRUD conventions.
- Added an audit trace spanning operation identity capability/algebra/projection, manifest CLI emission, SDK query-key consumption, React hook capability consumption, AST/dataflow interfaces, and the distinct graph relation projection.
- Kept `SchemaRelationTarget`, `ControllerExpressionFact`, `ExpressionDefinition`, and `ValidationRuleDefinition` unchanged because no distinct missing consumer was demonstrated. No fake consumers or parallel semantic authorities were introduced.
- Added `scripts/audits/audit-phase1366-react-endpoint-contract-boundary.cjs` and its machine-readable report.
- Static audit status must not be represented as a successful build; full build/runtime validation remains pending installation of repository dependencies (`tsdown`).

## Phase 1367 — Semantic reconciliation evidence closure (2026-10-09)

- Found duplicate relation-kind reasoning: reconciliation authority computed `RelationApplicability`, while candidate matching and schema provenance projection independently recomputed it.
- Strengthened `SemanticReconciliationEvidence` into a closed upstream contract carrying the canonical applicability judgment with relation and schema evidence.
- Rewired candidate matching, canonical-key resolution, status derivation, effective-key fallback, and schema provenance projection to consume the same evidence contract, preventing mismatched relation/judgment arguments.
- Kept applicability classification inside the existing semantic reconciliation algebra; did not add a second classifier or fabricate consumers for declaration-only types.
- Added `scripts/audits/audit-phase1367-reconciliation-evidence-closure.cjs` and its machine-readable report.
- Static audit success does not prove TypeScript typecheck, runtime tests, or full build. `tsdown` must be available to verify the build.

## Phase 1368 — Upstream schema parser contract adoption (2026-10-09)

- Moved the canonical `RouteParserSchema` and `SafeParseResult` declaration to `core/src/types/upstream/runtimeSchemaParser.ts`; `types/request.ts` now re-exports the same type for compatibility instead of owning a duplicate declaration.
- Replaced the weaker SDK-local optional parser shape with `ParserSchema<T> = RouteParserSchema<T>`. Both `parse` and `safeParse` are required by the upstream contract.
- Made `parseWithSchema()` accept only a configured parser/function schema and removed its `unknown as T` pass-through fallback. Missing schema handling now happens explicitly at the caller boundary.
- Strengthened `schemaMapper` to use the canonical `RouteSchemaMap` shape, prefer parser-contract detection before map interpretation, and throw when a configured schema does not satisfy the runtime parser contract. A configured schema now receives `undefined` input too, instead of bypassing validation before the parser runs.
- Updated `GenericService.findAll()` so a configured list schema validates the collection, while an entity schema is applied item-by-item when no list schema is configured.
- Added `npm run audit:phase1368-upstream-schema-parser-contract` and the machine-readable report. Static audit: 22/22 source-contract and cross-layer trace checks passed.
- Full TypeScript build/typecheck/runtime validation remains unverified because this workspace has no local `node_modules` or `tsdown`; do not treat the static audit as a successful build.
- Detailed trace: `packages/core/src/types/docs/PHASE1368_UPSTREAM_SCHEMA_PARSER_CONTRACT.md`.

## Phase 1369 — Upstream reasoning contract adoption (2026-10-09)

- Restricted changes to `core/src/types/upstream` and the scanner-to-upstream capability adapter.
- Replaced partial field-by-field model relation matching with the existing canonical `ModelSemanticRelationIdentity` / `modelSemanticRelationIdentityKey` contract. Alignment now includes foreign-key identity and no longer duplicates the identity predicate.
- Removed `isMutating: boolean` from `RouteCapabilitySemanticEvidence`; the stronger `RouteActionKind` ADT and `ROUTE_ACTION_KIND_REGISTRY` are now the sole source for mutability, reused for hook, payload, and default error behavior.
- Added a regression case for mismatched foreign-key identity and `scripts/audits/audit-phase1369-upstream-reasoning-contract-adoption.cjs` with a machine-readable report.
- Kept domain inference and semantic relation reconciliation inside their canonical upstream judgment/algebra contracts; this phase removes duplicate/weaker reasoning inputs, not legitimate semantic authority.
- Static audit status does not prove TypeScript typecheck, runtime tests, or full build; dependencies are not installed in this workspace.

## Phase 1370 — Semantic Reasoning Interface Wiring Trace (2026-10-09)

- Traced operation identity from upstream runtime algebra/authority through the explicit projection interface into CLI emission and SDK fail-closed consumption; the upstream proof contract is preserved.
- Traced AST/ADT seed facts through the canonical semantic dataflow authority and generic `DataFlowInterface` bridge. AST structure and dataflow graph nodes remain distinct; the bridge does not rerun semantic closure or mint a new reasoning proof.
- Removed duplicate raw-schema table/primary-column selection from `modelPrimaryKey.ts`: primary-key reconciliation now consumes the existing `SchemaRelationIndexInterface`, and the model builder reuses one index for primary-key and relation reconciliation.
- Kept the broad semantic-ownership audit intact and added `scripts/audits/audit-phase1370-semantic-reasoning-interface-wiring.cjs` plus its machine-readable report.
- Scope includes Laravel source routes/models and example frontend, with production consumer trace through CLI, SDK, and React. No fake consumers or parallel semantic authorities were added.
- Static audit success is not a build/typecheck/runtime-test claim. Local dependency binaries must be present before the full build can be verified.

## Phase 1371 — AST stage topology authority (2026-10-09)

- Removed the duplicated `AST_SEMANTIC_STAGE_ORDER` list from `astSemanticAuthorityPipeline.ts`. The canonical `AST_SEMANTIC_STAGE_GRAPH` now supplies order through `astSemanticStageOrder()`.
- Both pipeline construction paths consume the same immutable graph-derived order; stage membership, proof-checked transitions, and interface-derived facts remain unchanged.
- Added `audit:phase1371-ast-stage-topology-authority`, report JSON, and focused design documentation.
- This change removes a duplicated topology source rather than adding another semantic authority. Static audit does not substitute for TypeScript build or runtime tests.

## Phase 1372 — Runtime Semantic Contract Execution (2026-10-09)

- Added the upstream `SemanticDataflowReasoningAuthorityInterface` so runtime code depends on a typed executable semantic contract rather than the concrete closure constructor.
- Bound `semanticDataflowReasoningAuthority.judge` to the canonical `createSemanticDataflowJudgment` implementation in upstream authority.
- Injected the authority contract into `semanticDataflowDataFlowAdapter`; initial state and later seed operations both delegate through `authority.judge`.
- Updated the deprecated AST compatibility analyzer to use the same contract instead of importing the concrete constructor.
- Kept the closed `SemanticDataflowJudgment` ADT canonical and retained `SemanticDataflowInterface` as a read-only result projection. No second solver was introduced.
- Added `audit:phase1372-runtime-semantic-contract-execution` and its JSON report. Static audit does not substitute for build/runtime tests.

## Phase 1373 — Reasoning Judgment Interface Composition

- `SemanticDataflowReasoningAuthorityInterface` now specializes the shared `SemanticReasoningJudgmentInterface<SemanticDataflowInput, SemanticDataflowJudgment>` rather than redeclaring `judge` locally.
- The domain contract retains its upstream authority and discriminant markers; the concrete solver binding remains in upstream authority and is selected by runtime composition.
- AST input/judgment aliases, generic dataflow wiring, operation identity capability projection, manifest, graph, IR, React, SDK, and CLI boundaries were audited for continued contract consumption.
- Audit: `npm run audit:phase1373-reasoning-judgment-interface-composition`.
- Build/runtime status must be reported independently from static audit results.


## Phase 1374 — Runtime Closed Authority Boundary (2026-10-09)

- Traced the upstream `SemanticDataflowReasoningAuthorityInterface` through `semanticDataflowDataFlowAdapter`, `SemanticDataflowRuntimeBoundary`, `SemanticDataflowAnalysisResult`, policy queries, manifest projection, IR, graph, and endpoint consumers.
- Found that the adapter exposed `DataFlowInterface` even though upstream had already closed the judgment. Its `seed`, `derive`, and `close` methods either re-entered the authority or returned the same closed judgment, advertising producer execution capabilities at a consumer boundary.
- Narrowed the adapter, runtime boundary, and analysis result to `DataFlowAuthorityInterface`. The runtime now exposes only canonical input/state, proof authority, closure, and `reaches` query. It no longer exposes fake producer execution methods or an identity `judge` function.
- Kept semantic closure in `semanticDataflowAuthority.ts`; the composition root still binds the canonical authority. The adapter preserves `state.reasoningContract` and uses `semanticDataflowIdentityEqual` for reachability.
- Updated the ecommerce integration assertion to inspect `analysis.interface.state.fixedPoint`, matching the declared closed-state contract.
- Updated Phase 1372/1373 audit expectations to require the read-only authority boundary rather than the broader execution interface. Added `audit:phase1374-runtime-closed-authority-boundary` and its JSON report.
- Build remains unverified when `tsdown` and project dependencies are unavailable; audit results are static checks, not a substitute for typecheck/runtime tests.

## Phase 1375 — Operation Identity Authority Contract Composition (2026-10-09)

- Added `OperationIdentityCapabilityAuthorityInterface`, specializing the existing runtime algebra contract with explicit upstream ownership and closed-authority metadata.
- Added `createOperationIdentityCapabilityAuthority(algebra)` so authority composition depends on `OperationIdentityCapabilityRuntimeAlgebraInterface`, not on reconstruction logic.
- Bound the canonical production authority to `operationIdentityCapabilityAlgebra` once. The existing `operationIdentityCapabilityFromRoute(route)` entry point remains backward compatible; explicit authority injection is available for composition and verification.
- Exported the new contract and factory from the core entry point.
- Traced route producer → authority → algebra → closed capability → projection → CLI/SDK, and rechecked AST/dataflow, manifest, graph, IR, and React boundaries. No downstream identity classifier or second algebra was added.
- Added `audit:phase1375-operation-identity-authority-contract` and its machine-readable report. Static audit does not substitute for typecheck/build/runtime tests.

## Phase 1376 — Route Capability Authority Composition (2026-10-09)

- Split the executable CRUD route reasoning surface from its authority metadata through `routeCapabilityAuthorityAlgebra` and `routeCapabilityAuthorityFactory.create(algebra)`. The wrapper delegates all operations and does not duplicate route/action classification.
- Applied the same composition boundary to non-CRUD route capability reasoning with `routeCapabilitySemanticAuthorityAlgebra` and `createRouteCapabilitySemanticAuthority(algebra)`. The closed authority wrapper delegates `resolve` exactly once.
- Kept `RouteActionKind` as the canonical mutability ADT, `RouteSchemaPayload.fields` as canonical request-shape evidence, and the existing proof/evidence resolution behavior intact.
- Exported the algebra and composition factories from the core public entry point. Existing canonical authority names remain stable for current consumers.
- Traced the producer/boundary → upstream contracts → closed capability → CLI/SDK/React consumers and checked AST/ADT, semantic dataflow, manifest, graph, and IR boundaries for continued contract use.
- Added `audit:phase1376-route-capability-authority-composition` and its machine-readable report. Static audit success is not a TypeScript build/typecheck/runtime-test claim.


## Phase 1377 — Runtime Security Contract Execution (2026-10-09)

- Found a real duplicate reasoning path: `types/domain/authAndPolicy.ts` contained a full middleware classifier even though `types/upstream/routeSecurityAuthority.ts` already owned the canonical security resolution.
- Replaced the domain classifier implementation with a compatibility facade that executes `routeSecurityAuthority.resolve(middleware)`; removed the second state machine while retaining the public class symbol.
- Added `RouteSecurityAuthorityAlgebraInterface`, a closed upstream authority contract, and `createRouteSecurityAuthority(algebra)`; production authority composition delegates through the interface.
- Fixed upstream ability/role payload extraction to split at the actual `:` separator rather than using an empty prefix.
- Added `audit:phase1377-runtime-security-contract-execution` and its JSON report. Static audits do not establish a successful TypeScript build or runtime test.

## Phase 1396 — Upstream Interface / Reasoning / Dataflow / AST Contract Trace (2026-10-09)

- Traced `operationIdentityCapability`, `SemanticCapability`, `SemanticReasoning`, `SemanticDataflowInput`/judgment, `DataFlowInterface`, AST semantic stage interfaces, and the wiring from Laravel source model through manifest, graph, IR, CLI, SDK, and React.
- Fixed a real ownership bypass in `routeProducerRelations.ts`: route identity capability now enters through `operationIdentityCapabilityFromRoute`, so the producer uses the canonical upstream authority wrapper instead of calling the lower-level materializer directly. The authority delegates to `OperationIdentityCapabilityContractMaterializerInterface` and does not classify route semantics.
- Updated Phase 1355/1375 and semantic-ownership audits to the current materializer contract; updated Phase 938/940/943 audits to check the current producer-authority -> closed judgment -> proof-preserving DataFlow/AST projection topology instead of retired adapter signatures. Existing checks were retained and made current, not deleted to force a pass.
- Added `audit:phase1396-upstream-interface-reasoning-dataflow-ast-contract` with 23 checks, a JSON report, and `PHASE1396_UPSTREAM_INTERFACE_REASONING_DATAFLOW_AST_CONTRACT.md`.
- Verified runtime-contract audits Phase 1386–1396, operation identity audits, Laravel/dataflow wiring audits, and `semantic-ownership-coverage`: all passed. The 98-check semantic-ownership audit passed.
- Build remains unverified: the extracted workspace has no local `node_modules` and `tsdown` is unavailable. The global compiler is TypeScript 5.8.3, not the package-declared 7.0.2; a targeted TypeScript 5.8 check reaches unrelated existing scanner/request/AST errors, so it is not evidence of TypeScript 7 compatibility.


## Phase 1398 — AST classifier single-interface boundary (2026-10-09)

- Added `AstClassifierEvidenceInput<TToken>` and `AstClassifierEvidenceInterface<TToken>` in the upstream contract layer. The contract is generic over token representation, avoiding an upstream-to-compiler-runtime import.
- Changed `classifyAstSemanticEvidence` from a positional `(node, source, tokens)` signature to one typed `input` object.
- Added a frozen `astClassifierEvidenceInterface` adapter returning the existing closed `AstSemanticStageInterface`.
- Kept PHP syntax parsing in the scanner implementation; semantic authority remains in the AST semantic-stage authority/algebra.
- Added `audit:phase1398-ast-classifier-single-interface` and report `scripts/audits/reports/phase1398-ast-classifier-single-interface.json`.
- Audit status: Phase 1398 8/8, Phase 1396 23/23, Phase 1395 8/8. Full build not claimed because dependencies are not installed in this workspace.

## Phase 1399 — AST classifier runtime/port separation (2026-10-09)

- Moved the large PHP AST classification implementation to `packages/core/src/compiler/frontend/php/astClassifierRuntime.ts`.
- Kept `astClassifierEvidence.ts` as a narrow adapter implementing the upstream `AstClassifierEvidenceInterface`; parser implementation details are no longer the module's public consumer surface.
- Extended the generic upstream port to describe syntax-classification capabilities and the single-input semantic evidence operation without importing compiler/scanner runtime types.
- Updated `astClassifier.ts` and `semanticEvidenceRelations.ts` to consume the port explicitly.
- Added `audit:phase1399-ast-classifier-runtime-port-separation` and its JSON report. Package version remains `1.0.49`; build command remains `tsdown`.
- Boundary note: this is an adapter/implementation split, not a claim that the PHP parser has become declarative or that all SDK/React/CLI projection logic has been eliminated. Those are separate trace targets.

- Updated stale architecture-audit assertions to match the current `routeCapabilityAuthority.resolve` and `OperationIdentityCapabilityContractMaterializerInterface` contracts; the audits now check the current producer/wiring API rather than obsolete `crudRoleResolution` / `algebra.fromRoute` names.
- Exported `AstClassifierEvidenceContract` through the upstream type barrel.

## Phase 1400 — AST ADT single-port and semantic boundary (2026-10-09)

- Re-traced AST classifier consumers and found the Phase 1399 port still exposed three syntax methods plus a semantic method. That was a wider interface than the requested single upstream capability.
- Replaced that multi-method port with one `classify(request)` operation over a closed `AstClassifierEvidenceRequest` ADT and a discriminated `AstClassifierEvidenceResult` ADT.
- Kept parser/classifier logic in `astClassifierRuntime.ts`; the facade dispatches requests and typed conveniences are only projections over the one port.
- Added `audit:phase1400-ast-adt-single-port` and a trace report for AST, operation identity, dataflow authority, IR, CLI, SDK, React, and the Laravel ecommerce example.
- Build remains unverified until the workspace has the project's configured `tsdown` dependency available.


## Phase 1401 — Explicit operation identity projection loss contract (2026-10-09)

- Trace found `OperationIdentityCapabilityContract` carries semantic evidence, derivation, provenance, and reasoning, while `OperationIdentityReference` deliberately carries only `key`, `method`, and `path`. That narrowing had not been declared as a loss policy in the projection interface.
- Added `OperationIdentityProjectionLossContract`: the projection explicitly declares `identity_reference_only`, its preserved identity tuple, and omitted proof fields. The omitted proof remains owned by the upstream capability; the compact reference does not pretend to reconstruct it.
- Completed the wiring metadata required by `UpstreamWiringInterface`: `direction: upstream_to_downstream` and `upstreamAuthority: upstream`.
- Added a Phase 1401 audit tracing operation identity, semantic dataflow, IR, CLI, SDK, React, and the Laravel ecommerce example. It checks that the dataflow adapter forwards the exact closed judgment and reasoning contract, and that target packages do not import the AST classifier runtime directly.
- The projection intentionally remains a compact SDK key reference for compatibility. This phase does not claim full build success; use the declared TypeScript 7 / tsdown toolchain to verify the whole workspace.

## Phase 1402 — Runtime CRUD slot contract (2026-10-09)

- Traced React `defineHooks` / `groupSlotResolver` back to CLI `hookConfigLowerer` and the upstream `RouteSemanticFlow.capability`.
- Added generated `crudSlots` contract with direct endpoint references and upstream-resolved route parameter names; React can execute the contract without scanning CRUD roles.
- Removed synthetic `[groupName, 'list']` and `[groupName, 'detail', id]` query-key fallbacks. Missing query-key capabilities now fail explicitly rather than inventing a cache identity.
- `createService` is wired from the slot contract rather than assuming an action named `create`.
- Audit deliberately records that hand-authored legacy configurations without `crudSlots` still use compatibility role scanning. This is a known migration frontier, not a completed elimination.
- Root package version remains `1.0.49`; build script remains `tsdown`.

### Phase 1402 residual trace note

The application runtime should execute closed upstream capability contracts. Phase 1402 adds contract-first generated CRUD wiring and tightens cache/retry policy types, but does not claim all runtime interpretation is gone. The explicitly tracked frontiers are the legacy hand-authored React slot scanner, compiler-side role searches in resource-group descriptors, and caller-configurable mapper policy in the generic SDK service. Network `unknown` and schema validation remain appropriate at untrusted response boundaries.

## Phase 1403 — Semantic Reasoning / Interface Boundary Trace (2026-10-09)

- Added `scripts/audits/audit-phase1403-semantic-reasoning-interface-boundary.cjs` and `scripts/audits/reports/phase1403-semantic-reasoning-interface-boundary.json`.
- Added `audit:phase1403-semantic-reasoning-interface-boundary` without changing package version or build command.
- Added `packages/core/src/types/docs/PHASE1403_SEMANTIC_REASONING_INTERFACE_BOUNDARY.md` documenting the actual source AST -> upstream reasoning -> closed contract -> wiring/projection -> runtime boundary and external design references (MLIR, CodeQL, TanStack Query, TypeScript 7).
- Trace result: 13/13 boundary checks pass; six residuals are intentionally reported, not hidden: sourceAstScanner mixes extraction with semantic traversal; hookConfigLowerer still scans roles to assign slots; React has a legacy role-scanning runtime fallback; ResourceGroupCapability lacks closed CRUD slot references; routeGrouper can suffix duplicate action names during projection; legacy resource-group descriptors retain role selection helpers.
- This phase is an auditable trace/frontier specification, not a claim that the six residuals are fixed. Next implementation should move slot assignments and final action symbols into upstream closed ADTs, migrate generated fixtures, then remove React fallback and separate AST evidence extraction from semantic reasoning.
- Validation: Phase 1402 audit remains 12/12; Phase 1403 audit 13/13 `passed_with_residuals` with six tracked residuals. `npm run build` cannot run in this environment because `tsdown` is absent (exit 127); build success is not claimed.

## Phase 1404 — Upstream execution-slot contract

- Added a closed `ResourceGroupSlotDecision` ADT (`route` / `absent` / `ambiguous`) and `ResourceGroupExecutionSlots` to the upstream resource-group capability contract.
- Upstream relation algebra now resolves CRUD slot assignments and custom endpoint references, including canonical route identity and parameter key.
- CLI hook lowering consumes the upstream slot contract; route lookup is by canonical route identity only. It no longer scans `crudRole`/`targetScope` to decide slot semantics.
- Added `scripts/audits/audit-phase1404-upstream-execution-slot-contract.cjs` and report under `scripts/audits/reports/`.
- Audit result: 8/8 boundary checks passed, with four documented residuals. This is not a claim that all runtime fallback, scanner traversal, or duplicate action identity issues are complete.
- Preserved package version `1.0.49` and `build: tsdown`.

## Phase 1406 — Runtime Contract Migration (2026-10-09)

- Completed the React runtime migration instead of leaving it as a recommendation: `HookConfig.crudSlots` is required and closed, `groupSlotResolver.ts` no longer scans `crudRole` / `targetScope`, and the checked-in ecommerce example's 18 hand-authored endpoint groups now carry an explicit no-slot contract because those endpoint declarations do not carry upstream Laravel capability evidence.
- Moved cache-operation-key normalization (`update` / `remove`) into the upstream resource-group algebra and added `ResourceGroupCapabilityContract.routes` as the complete route-reference surface. The CLI generator projects action keys from `reference.cacheOperationKey` rather than reclassifying each route.
- Generated CRUD contracts now emit `closed: true`. Removed `toNormalizedActionKey` from the generator API.
- Added `audit:phase1406-runtime-contract-migration`, report `scripts/audits/reports/phase1406-runtime-contract-migration.json`, and `PHASE1406_RUNTIME_CONTRACT_MIGRATION.md`.
- Verification: Phase 1402 12/12, Phase 1405 14/14 structural checks, Phase 1406 9/9. Full build is not claimed: `node_modules` and `tsdown` are absent, and global TypeScript 5.8.3 is not the declared TypeScript 7 toolchain.
- Remaining actual migrations: split AST evidence extraction from scanner semantic traversal; close action-symbol identity upstream rather than suffixing in `routeGrouper`; retire legacy resource-group role helpers; audit dataflow consumers; resolve Phase 729 and strict relational-authority failures.

## Phase 1407 — Source AST Semantic Producer Boundary (2026-10-09)

- Migrated expression, assignment, and model-property production out of `sourceAstScanner.ts` into `sourceAstSemanticProducer.ts`, behind the closed upstream `SourceAstSemanticProducerInterface`.
- The scanner orchestrator now consumes one typed product set and no longer owns PHP statement traversal or producer selection for these semantic products.
- Added `audit:phase1407-source-ast-semantic-producer-boundary`, report `scripts/audits/reports/phase1407-source-ast-semantic-producer-boundary.json`, and `PHASE1407_SOURCE_AST_SEMANTIC_PRODUCER_BOUNDARY.md`.
- Verification: Phase 1407 structural audit 10/10. This is a partial migration: source discovery/parsing remains inside the producer, and duplicate action identity still requires upstream closure. Full build/typecheck remains unverified until project dependencies are installed.

## Phase 1408 — upstream evidence acquisition and action identity closure (2026-10-09)

- Introduced `SourceAstEvidenceAcquisitionInterface` and a closed `SourceAstEvidenceAcquisitionContract` carrying immutable source-file evidence (`sourceKind`, canonical file path, source text).
- Moved PHP file discovery and source reads for models, resources, controllers, and services into `sourceAstEvidenceAcquisition`; `sourceAstSemanticProducer` now consumes the acquired evidence and no longer imports filesystem scanning utilities.
- Introduced `RouteActionIdentityCapabilityInterface` and `routeActionIdentityCapabilityAuthority`. Duplicate generated action names are now resolved upstream in stable canonical route-key order, with duplicate route keys rejected.
- Updated CLI `routeGrouper` to consume the closed upstream action-identity resolution instead of creating suffixes during projection.
- Added `scripts/audits/audit-phase1408-upstream-evidence-and-action-identity.cjs` and its JSON report. Audits Phase 1405–1408 were refreshed to mark the two migrated responsibilities accurately.
- Residuals: syntax parsing and semantic judgment production still share the semantic producer; other Laravel source families retain their existing acquisition paths; dataflow/relational-calculus authority audits remain unresolved; full typecheck/build is blocked by absent dependencies and TypeScript 5.8.3 being older than the repository's ES2025 config.

## Phase 1409 — Upstream syntax / semantic reasoning / dataflow boundary (2026-10-09)

- Completed the Phase 1408 parser-boundary migration instead of leaving it as a recommendation: added generic, compiler-independent `SourceAstSyntaxParserInterface` / `SourceAstSyntaxParseContract` upstream contracts and a concrete syntax parser under `compiler/semantic`.
- `sourceAstSyntaxParser` now owns PHP tokenization, method parsing, and model-property syntax parsing. `sourceAstSemanticProducer` consumes typed parsed syntax and retains semantic product construction (`ExpressionAst`, `AssignmentAst`, `PropertyAst`) without directly invoking the lexer or PHP method/property parsers.
- Kept the upstream contract generic over parser syntax types so `types/upstream` does not import compiler implementation types. This preserves dependency direction while allowing the concrete parser to use the current PHP AST vocabulary.
- Reconnected the stages explicitly: `SourceAstEvidenceAcquisitionInterface -> SourceAstSyntaxParserInterface -> syntax AST -> semantic producer/reasoning -> closed AST/ADT and SemanticDataflowJudgment -> wiring -> runtime executor -> manifest/graph/IR/CLI/SDK/React`.
- Wired the existing Phase 1408 audit into `package.json` (it existed as a script file but was not reachable through npm scripts), and added `audit:phase1409-upstream-syntax-reasoning-dataflow-boundary` plus its JSON report.
- Verification: Phase 1408 audit 10/10; Phase 1409 audit 12/12 `passed_with_residuals`; Phase 918 now passes after removing production imports of the legacy AST dataflow facade and checking actual Laravel ecommerce fixture source coverage. Package version remains `1.0.49`; `build` remains `tsdown`.
- Residuals are explicit: semantic origin still depends on source-family/owner context inside semantic production; other Laravel source families retain their existing canonical scanner paths; Phase 918 dataflow and Phase 729/strict relational-calculus authority issues remain separate migrations. `tsdown` and local `tsc` dependencies are absent, so no full build/typecheck success is claimed.


## Phase 1410 — Upstream Semantic-Origin Reasoning

Moved expression-origin classification from the AST producer to a closed upstream evidence/judgment contract and semantic-origin authority. The producer now consumes the resolved origin. The phase audit is registered as `audit:phase1410-upstream-semantic-origin-reasoning`. The Phase 1409 residual concerning a missing `relationRuleEntries` helper was stale: the helper is present and declared before catalog initialization in the source examined here; runtime execution still needs validation in the full dependency environment.

## Phase 1411 — Upstream origin totality (2026-10-09)

- Replaced the origin authority's implicit final `resource_field` fallback with a typed, exhaustive `Record<SourceAstEvidenceKind, rule>`.
- Kept the origin judgment closed, frozen, and provenance-carrying; the producer delegates origin decisions to the authority.
- Added `audit:phase1411-upstream-origin-totality` and `PHASE1411_UPSTREAM_ORIGIN_TOTALITY.md` with cross-stack ownership/residual map and official research anchors.
- Package version remains `1.0.49`; build command remains `tsdown`.
- Residual: model-accessor eligibility still contains semantic reasoning in the producer; broader Laravel source families and full integration/build verification remain outstanding.


## Phase 1413 — Runtime semantic ownership

React now consumes a typed closed domain-intent capability contract rather than shape-classifying an unknown manifest; AST eliminator preserves variant correlation. The CLI route identity authority call remains an explicit high-priority residual and must move to upstream manifest construction. See `docs/PHASE1413_RUNTIME_SEMANTIC_OWNERSHIP.md`.


## Phase 1414 — Scanner semantic producer migration (2026-10-09)

Separated syntax classification from semantic-stage judgment production. `astClassifierRuntime.ts` now only constructs syntax AST results; `types/upstream/astSemanticEvidenceProducer.ts` owns conversion of syntax observations into the upstream stage port. See `docs/PHASE1414_SCANNER_SEMANTIC_PRODUCER_MIGRATION.md`.


## Phase 1415 — AST classifier algebra migration (2026-10-09)

Moved expression-rule candidate projection and first-applicable selection out of `astClassifierRuntime.ts` into the generic upstream `astClassifierRuleAlgebra`. PHP-specific grammar recognition remains as supplied rule implementations; statement parsing remains an explicit residual, not reported as migrated. Run `npm run audit:phase1415-ast-classifier-algebra`.


## Phase 1416 — Scanner runtime interface algebra migration (2026-10-09)

Migrated expression, structured-statement, and simple-statement rule selection to the generic upstream AST classifier algebra. The algebra now owns applicability, ordered precedence, and lazy first-proven resolution. PHP grammar productions remain language-specific capabilities in `astClassifierRuntime.ts`; they were not blindly relocated. Audit: `npm run audit:phase1416-scanner-runtime-interface-algebra`. Full TypeScript build remains unverified without installed `tsdown`.


## Phase 1417 — Scanner Runtime Interface Algebra
- Extracted generic statement-boundary and statement-sequence control into upstream algebra contracts. Scanner runtime supplies PHP grammar capabilities; it no longer owns delimiter-state or sequence-recursion mechanisms. See `docs/PHASE1417_SCANNER_RUNTIME_INTERFACE_ALGEBRA.md`.

## Phase 1418 — Scanner Assignment Parts Algebra
- Moved generic assignment decomposition into `packages/core/src/types/upstream/scannerAssignmentPartsAlgebra.ts`: ordered operator candidate selection, target validation, reference-marker handling, and typed result assembly.
- Kept PHP operator spellings, target grammar, expression parsing, and AST construction as injected runtime capabilities; this avoids leaking PHP AST semantics into a language-neutral upstream contract.
- Added `scripts/audits/audit-phase1418-scanner-assignment-algebra.cjs` and `docs/PHASE1418_SCANNER_ASSIGNMENT_ALGEBRA.md`.
- Remaining frontier: PHP target/destructuring rule provider; top-level token traversal; expression precedence/associativity; classification rule priority/fallback closure; explicit sequence `contract_violation` instead of prefix truncation.

## Phase 1419 — Scanner contract evolution

Evolved scanner token-structure and statement-sequence contracts instead of adding a wrapper-only interface. Token traversal now belongs to `scannerTokenStructureAlgebra`; statement parsing returns a closed completion/contract-violation result; runtime rejects contract violations instead of silently returning a valid-looking prefix. Assignment algebra now reuses the selected operator candidate rather than searching for it again. See `docs/PHASE1419_SCANNER_CONTRACT_EVOLUTION.md` and `scripts/audits/audit-phase1419-scanner-contract-evolution.cjs`.

## Phase 1420 — Scanner boundary and assignment contract closure (2026-10-09)

Evolved scanner boundary and assignment contracts instead of adding wrapper-only interfaces. Statement boundary resolution now uses delimiter-kind stack evidence and explicitly reports malformed structure; statement sequence rejects malformed boundaries and invalid boundary/index combinations; assignment decomposition returns a closed `resolved | unresolved | malformed | contract_violation` ADT with reasoned unresolved outcomes. PHP runtime supplies grammar/operator capabilities and explicitly adapts every result. Focused emitted-JavaScript assertions passed 9/9 and strict typecheck of the four algebra modules passed. Full runtime typecheck still reports unrelated existing errors in query/dataflow/upstream modules; full build is pending because `tsdown` is unavailable. See `docs/PHASE1420_SCANNER_BOUNDARY_ASSIGNMENT_CLOSURE.md`.

## Phase 1421 — Scanner expression operator algebra

- Moved generic binary operator candidate selection, precedence resolution, and associativity handling from `astClassifierRuntime.ts` into `scannerExpressionOperatorAlgebra.ts`.
- Extended `scannerTokenStructureAlgebra.ts` with a single-pass top-level candidate collector that excludes nested occurrences and rejects malformed delimiters.
- PHP runtime now provides only the operator vocabulary, AST operator mapping, and language-specific precedence/associativity facts for binary selection.
- Closed outcomes distinguish resolved, not found, malformed, and contract violation.
- Focused algebra compilation and 6 direct runtime assertions passed; full repository build/typecheck remains pending due missing `tsdown` and unrelated existing diagnostics.

## Phase 1422 — Scanner assignment target algebra (2026-10-09)

- Moved assignment-target precedence and recursive destructuring entry resolution into `scannerAssignmentTargetAlgebra.ts`.
- The algebra owns variable, append, array-element, property, static-property and destructuring selection, including keyed/nested/reference entries and malformed-structure propagation.
- PHP runtime now provides grammar observations, expression/member/static-property evidence, and AST constructors; it adapts the closed resolution to the scanner's existing option boundary.
- Added focused algebra tests and `audit:phase1422-scanner-assignment-target-algebra`.
- Focused strict typecheck of the new algebra passes. Vitest and full build remain unavailable in this workspace because `vitest`/`tsdown` are not installed; runtime file diagnostics still include pre-existing issues outside the migrated block.

## Phase 1423 — Scanner expression-form algebra

- Added `packages/core/src/types/upstream/scannerExpressionFormAlgebra.ts` for generic conditional-marker pairing and prefix-operator resolution.
- Migrated `classifyTernary` and `classifyUnary` in `astClassifierRuntime.ts` to delegate structural decisions to the algebra; PHP runtime retains PHP operator vocabulary and AST construction only.
- Added closed results for malformed conditionals and prefix-contract violations; no `any` introduced.
- Audit 10/10 and direct compiled assertions 5/5 passed. Whole build is pending because `tsdown` is absent from this workspace.

## Phase 1424 — Scanner expression candidate algebra (2026-10-09)

- Added `scannerExpressionCandidateAlgebra.ts`, a language-neutral contract that validates candidate identities and lazily resolves ordered expression candidates until the first successful result.
- Migrated `classifyCompoundExpression()` away from eager `OptionalSemanticCandidate` construction; PHP runtime keeps syntax evidence and AST construction while candidate arbitration belongs to the upstream algebra.
- Audit 12/12 and strict typecheck of the new algebra plus the related expression/token algebra modules passed. Vitest/full build remain unverified because Vitest/`tsdown` are unavailable in the workspace.
- Next frontier: unify PHP precedence facts across binary, null-coalescing, short-ternary, and full ternary syntax with explicit PHP-version semantics. See `docs/PHASE1424_SCANNER_EXPRESSION_CANDIDATE_ALGEBRA.md`.

## Phase 1425 — Expression root-operator contract

- Trace source: `packages/core/src/compiler/frontend/php/astClassifierRuntime.ts`, especially `classifyCompoundExpression` and the former `findBinaryOperator` path.
- Migration: null-coalescing (`??`) was previously selected in a separate early runtime candidate, while binary operators used the precedence algebra. That split let candidate ordering—not a single structural rule catalog—decide the relationship between coalescing and binary operators.
- Change: coalescing and supported binary operators now share `findExpressionRootOperator`, which delegates root selection to `scannerExpressionOperatorAlgebra`. The PHP adapter supplies token spellings, precedence/associativity facts, and the AST factory; recursive operand classification happens only after the root is resolved.
- Structural rule for the supported PHP 8 operator subset: multiplication `60`, addition/subtraction `50`, concatenation `40`, comparisons `25–30`, `&&` `20`, `||` `10`, and right-associative `??` `5`. Lower values become the root split; right associativity selects the leftmost same-tier root so recursion forms the right-associated tree.
- Kept distinct: ternary/short-ternary are still resolved by the expression-form path, because they have three-way/omitted-branch structure and PHP 8 makes unparenthesized ternary non-associative. This phase does not claim a complete PHP expression grammar.
- Validation: Phase 1421–1425 static audits are run separately. Full TypeScript/build validation remains pending where local dependencies are unavailable; do not interpret static audit success as a successful package build.


## Phase 1426 — Expression operator contract migration (2026-10-09)

- Trace found that Phase 1425 had unified `??` and binary root selection, but the PHP operator catalog and result adaptation still lived in `astClassifierRuntime.ts`.
- Moved PHP-specific token spellings, operator identities, precedence facts, and associativity facts into `packages/core/src/compiler/frontend/php/phpExpressionOperatorContract.ts`. The runtime now delegates root-operator resolution through that contract and retains recursive AST projection.
- Extended the language-neutral `scannerExpressionOperatorAlgebra` with `non_associative` precedence tiers. Chained top-level operators from such a tier now return the closed `malformed` result rather than silently producing a tree. PHP comparison/equality operators in the supported subset use this rule.
- Added algebra tests for rejected unparenthesized comparison chains and accepted single comparisons; added `audit:phase1426-expression-operator-contract-migration`. The PHP contract covers the currently supported operator subset, not the complete PHP grammar. Ternary/short-ternary and several operators remain on separate paths.
- Validation is limited to static audit and available local checks; full package build must not be claimed unless `tsdown` is installed and `npm run build` succeeds.

## Phase 1427 — Explicit semantic decision interface (2026-10-09)

- Added `semanticDecisionInterface.ts`: a minimal closed upstream contract for rule identity, declared priority, applicability, derivation, and explicit `derived` / `not_derived` / `contract_violation` judgments.
- Added `semanticDecisionAlgebra.ts`: generic rule resolution validates duplicate identities/priorities and sorts by declared priority. Declaration-array order is no longer semantic authority for AST expression classification.
- Migrated the top-level expression rule table in `astClassifierRuntime.ts` from implicit `resolveFirst` list ordering to the explicit semantic decision contract with declared priorities. PHP-specific recognition and AST construction callbacks remain adapter responsibilities; this phase does not claim all per-expression reasoning has been eliminated from the scanner.
- Added tests for order independence and invalid contracts, plus `audit:phase1427-explicit-semantic-decision-interface`.
- Build verification remains pending when `tsdown` is unavailable in the environment; the audit is a source-boundary check, not a substitute for full typecheck or test execution.

## Phase 1428 — Expression structure contract (2026-10-09)

- Trace: `classifyCompoundExpression()` used candidate callbacks that returned `RelationOption<PhpAstValue>`, so candidate arbitration and AST construction were coupled. The upstream candidate algebra selected already-built AST values rather than a structural judgment.
- Added `packages/core/src/types/upstream/scannerExpressionStructure.ts`, a closed syntax-level ADT for short ternary, ternary, array access, call, binary, and unary structures. It is generic over token and operator facts and does not depend on PHP AST factory types.
- Migrated compound candidate providers to return token partitions/operator facts first. The generic candidate algebra now selects the structural result; the PHP runtime projects that result into `PhpAstFactory` nodes only afterward. Removed redundant compound call and unary AST-building resolvers.
- Updated Phase 1423/1425 audits to track the new ownership boundary. Phase 1428 audit passes 8/8; Phase 1423 passes 10/10; Phase 1425 passes 11/11.
- Boundary: this is a real separation of structural judgment from AST construction, not a claim that all runtime reasoning is gone. PHP token-shape recognition, top-level rule selection, and other syntax paths remain migration frontiers.
- Full `npm run build` and Vitest remain unverified because `tsdown` and Vitest are not installed. Targeted TypeScript checking found no diagnostics in the changed runtime or new structure ADT, while unrelated existing diagnostics remain elsewhere.


## Phase 1429 — Upstream expression model projection trace

- Traced existing upstream `Expression`, `ExpressionAst`, and `ExpressionStructure` before adding any new semantic model.
- Confirmed `Expression` is the domain-level expression ADT projected by `expressionProducer`; `ExpressionStructure` is the token-level structural judgment used before PHP AST construction. They are different stages and must not be conflated.
- Extracted the existing structure-to-PHP-AST mapping from `astClassifierRuntime.ts` into `phpExpressionStructureProjector.ts`; runtime now delegates projection after structural resolution.
- Remaining frontier: candidate providers and token-shape recognition still reside in runtime; this phase does not claim to have moved all semantic reasoning upstream.
- Audit: `audit:phase1429-upstream-expression-model-projection`.
