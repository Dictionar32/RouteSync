# Phase 1405 — Semantic Ownership Closure

## Purpose

This phase hardens the boundary between upstream semantic authority and downstream execution. It does not claim that all downstream reclassification has been eliminated. The audit records the remaining owners and the exact migration order.

## Canonical route

`Laravel source evidence -> source AST/ADT -> complete AST validation -> CompleteLaravelSourceModel -> semantic capability judgments -> closed operation/resource-group contracts -> RouteSyncManifest -> CLI/SDK projection -> React/TanStack Query execution`

The AST and data-flow graph are separate semantic representations. The AST preserves syntax and source structure; data-flow nodes and judgments represent value relationships and semantic dependencies. Do not flatten one into the other or make downstream consumers reconstruct a lost relation.

## Phase 1405 hardening

- Hook projection rejects a route reference with zero or multiple projected matches. It never silently accepts the first matching identity.
- Hook wiring rejects duplicate resource-group capability identities before inserting them into a map. It never silently overwrites one upstream contract with another.
- The audit traces operation identity from upstream materialization to SDK endpoint metadata, resource-group execution slots from upstream algebra to generated hooks, and dataflow inputs/judgments through the manifest.
- Package version `1.0.49` and `build: tsdown` are intentionally preserved.

## Ownership matrix

| Concern | Semantic owner | Transport/projection | Executor | Residual |
|---|---|---|---|---|
| Operation identity | `operationIdentityCapabilityAuthority` and materializer | `apiObjectEmitter` serializes identity reference | SDK endpoint carries identity | Verify all consumers avoid recomputation |
| CRUD slots | `resourceGroupCapabilityAlgebra` | manifest → `hookSourceLowerer` → `hookConfigLowerer` | React consumes `crudSlots` | Legacy React fallback remains for manual configs |
| Source syntax | scanner producers and complete AST validation | `RouteSyncManifest` construction | No runtime AST interpretation intended | scanner still mixes extraction/traversal/producer work |
| Data flow | semantic dataflow input/judgment authority | manifest dataflow fields and policy contracts | downstream consumers | consumer-by-consumer audit still required |
| Action symbol uniqueness | expected upstream identity contract | route grouping and emitters | SDK object properties | downstream suffixing/normalization requires further trace |
| Query cache identity | upstream route/query policy semantics | generated cache/query-key config | TanStack Query | generator still maps update/delete roles to normalized cache labels |
| Schema and mapper | request/response contracts and type evidence | Zod schema + mapper emitter | Axios/SDK endpoint pipeline | audit schema/mapper round-trip and field-loss paths separately |

## Recommended next implementation order

1. Split `sourceAstScanner` into a source-evidence/AST production layer and a semantic-reasoning layer. Keep PHP syntax traversal inside the evidence/AST stage; do not let scanner control flow become the long-term semantic authority.
2. Trace every hand-authored `defineHooks` configuration and fixture. Migrate to closed `crudSlots`; only then make the property required for CRUD groups and remove `firstByRole` and custom endpoint role scanning from React.
3. Move canonical generated action-symbol uniqueness and normalized cache operation identity upstream, or explicitly prove that a given transform is presentation-only.
4. Trace `SemanticDataflowJudgment` consumers, graph edges, IR projections, request/response schema and mapper paths. Require explicit loss/absence/ambiguity judgments instead of implicit fallback.
5. Run audit scripts and a dependency-installed TypeScript build; a structural audit is not a substitute for compilation or integration tests.

## External design references

- MLIR Interfaces: https://mlir.llvm.org/docs/Interfaces/ — generic transformations and analyses query semantic interfaces instead of special-casing every operation/dialect.
- CodeQL JavaScript/TypeScript data flow: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/ — AST nodes and data-flow nodes are different representations; SSA and property read/write nodes can carry information not represented by a direct AST node.
- CodeQL overview: https://codeql.github.com/docs/writing-codeql-queries/about-data-flow-analysis/ — data-flow graph models runtime value flow rather than syntactic structure.
- TypeScript 7 announcement: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/ — the native toolchain is a compiler/runtime tooling change, not a replacement for semantic contract design or repository-level validation.

These references inform the architecture; they do not prove that RouteSync's implementation is correct. Correctness must be established by RouteSync-specific audits, tests, and build results.

## Audit results observed in this workspace

- Phase 1405 ownership audit: 14/14 structural checks pass; six residual work items remain.
- Phase 1404 slot-contract audit: 8/8 checks pass with residuals recorded.
- Phase 1309 interface/no-semantic-reasoning audit: 2/2 pass.
- Phase 1310 downstream/no-method-fallback audit: pass.
- Phase 918 dataflow boundary audit remains failing for real residuals: `astAnalysisInterface.ts` and the upstream barrel still import/re-export the legacy AST dataflow interface; the named inline corpus check is also absent. The audit itself was corrected to check the canonical `semanticDataflow.ts` and the actual `examples/ecommerce-shop-source` fixture rather than a misspelled path.
- Phase 729 relational calculus frontier audit remains failing four checks: canonical atom ownership/reuse, immutable fact index reuse, and stratum closure.
- Strict relational-authority audit reports 140 files with violations across the configured 338-file scan set. This is an existing broad migration frontier, not a claim that all control-flow constructs have been removed.
- Full `npm run build` was not run successfully because `node_modules/.bin/tsdown` is absent in this workspace. Do not treat structural audits as proof of TypeScript compilation.
