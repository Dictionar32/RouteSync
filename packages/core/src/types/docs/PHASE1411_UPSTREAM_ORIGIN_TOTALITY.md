# Phase 1411 — Upstream Origin Totality and Semantic Contract Boundary

## Change

`sourceAstSemanticOriginAuthority` now resolves origin through a declarative, exhaustive `Record<SourceAstEvidenceKind, rule>`. The source-kind union and the semantic rule table must remain total together. A new source family cannot silently fall through to `resource_field`; adding a source kind requires adding an explicit rule and satisfying TypeScript's closed mapping.

The resolver returns the same frozen `SourceAstSemanticOriginJudgment`, retaining the exact evidence that justified the origin. `sourceAstSemanticProducer` delegates origin decisions to this authority. Operation identity, semantic dataflow judgments, AST products, and IR/runtime boundaries remain connected to the upstream-owned contracts.

## Traced boundary

| Boundary | Current owner | Downstream responsibility | Remaining issue |
|---|---|---|---|
| Laravel source evidence | `sourceAstEvidenceAcquisition` | supply source files with source-family provenance | other Laravel families beyond model/resource/controller/service need explicit coverage |
| Syntax evidence | `sourceAstSyntaxParser` | consume typed parsed methods/properties/tokens | syntax parser should not assign semantic capabilities |
| AST semantic origin | `sourceAstSemanticOriginAuthority` | consume closed origin judgment | model accessor eligibility is still a producer-side semantic rule |
| Operation identity | upstream `operationIdentityCapabilityAuthority` and route producer | CLI/SDK project identity without guessing | keep identity fields lossless across every adapter |
| Dataflow | `SemanticDataflowInput` → `SemanticDataflowJudgment` → generic `DataFlowInterface` adapter | runtime solves/executes the already-judged dataflow | keep `SemanticDataflowInputFact` projection lossless; test all producer families |
| Manifest / graph / IR | upstream manifest builder, graph relations, IR projections | project authoritative judgments | projections must not rebuild closure or classify by names/paths |
| CLI / SDK / React | capability projection, `defineApi`, explicit CRUD execution slots | execute the contract | old classifier-named compatibility surfaces should remain projection-only |
| Zod / Axios / TanStack Query / Next.js | generated target adapters | validate, transport, cache, and route according to the contract | do not infer source semantics from target naming conventions |

## Architectural recommendation

Keep the compiler direction as:

`Laravel source → source evidence → syntax AST/ADT → upstream semantic reasoning algebra → closed capability/dataflow judgments → interface/contract → wiring → runtime executor → manifest/graph/IR/CLI/SDK/React projections`.

The generic `DataFlowInterface` is an execution/state-solving abstraction, not the place to rediscover Laravel semantics. The AST is syntax structure; the ADT is the closed semantic vocabulary; the reasoning authority turns evidence into judgments; wiring adapts the judgment to consumers without reclassification. Missing or ambiguous evidence should produce an explicit unresolved/unsupported judgment rather than an inferred fallback.

## Research anchors

- MLIR interfaces are intended to let generic analyses and transformations operate without embedding special cases for every operation/dialect: https://mlir.llvm.org/docs/Interfaces/
- CodeQL distinguishes data-flow nodes from AST nodes, so a source AST should not be mistaken for the full dataflow graph: https://codeql.github.com/docs/codeql-language-guides/analyzing-data-flow-in-javascript-and-typescript/
- Laravel resource controllers establish conventional route/action structure, but RouteSync should record the discovered capability upstream rather than ask target generators to infer it: https://laravel.com/docs/controllers#resource-controllers
- Next.js App Router is file-system based; this is a target projection concern, not source semantic authority: https://nextjs.org/docs/app
- Zod parses/validates runtime values against schemas: https://zod.dev/basics
- Axios instances carry transport configuration: https://axios-http.com/docs/instance
- TanStack Query keys identify cached query data and should include variables affecting results: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- TypeScript 7 was announced on July 8, 2026 as a native Go-based port; use its official compatibility notes when planning compiler/toolchain migration, not as a reason to change RouteSync's package/build contract in this phase: https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/

## Validation boundary

Static audits verify the declarative total mapping and the existing cross-stage contracts. They do not substitute for a full package build or integration run. The current workspace previously lacked `node_modules/.bin/tsdown`; report the build as blocked unless that executable is available and the build actually completes.
