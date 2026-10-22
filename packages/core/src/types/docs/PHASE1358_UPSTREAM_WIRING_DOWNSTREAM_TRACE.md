# Phase 1358 — Upstream → Wiring → Downstream Contract Trace

## Result

This phase adds a repeatable contract-path audit for the semantic boundary across Laravel source AST, upstream capability contracts/algebras, manifest wiring, the canonical data-flow authority, graph relations, IR projection, CLI emission, SDK validation, React intent wrapping, and the ecommerce example. It traces ten public upstream boundary candidates from Phase 1357 without forcing artificial consumers.

## Canonical flow

`Laravel source evidence + provenance → CompleteSourceAst / closed AST ADT → upstream semantic authority/algebra → validated source-model/manifest wiring → SemanticDataflowInput + structural semantic relations → read-only DataFlow authority / GraphEdgeRelation → IR and CLI/SDK/React target projection`.

The data-flow lane and structural graph lane remain distinct. The upstream authority owns semantic interpretation and proof/provenance; wiring performs validated projection, not reclassification. IR, CLI, SDK and React consume explicit capabilities. Axios remains transport, Zod validates target schemas, mappers transform payload shape, and TanStack Query manages client cache/query behavior; none should become the owner of Laravel route/controller/resource semantics.

## Ten boundary candidates

- `ProviderContainerOperations`: compare producer output with canonical `ProviderContainerBindings`; do not create a parallel provider lane without evidence of a distinct raw-operation stage.
- `ControllerExpressionFact`: preserve expression origin and source span; map into dataflow only if producer tracing proves there is no equivalent existing fact.
- `ExpressionDefinition`: retain provenance-bearing contract; avoid a duplicate expression-plus-span adapter.
- `RequestRouteParameterName`: keep request-side parameter identity at the upstream route/request binding boundary; never infer it again in SDK/React.
- `RequestUriValue`: do not equate runtime request URI with declared route identity without an explicit semantic rule.
- `RequestIpAddress`: optional request-context vocabulary, not route identity; wire only when a real source and consumer exist.
- `ValidationRuleDefinition`: compare against validation capability/rule contracts and keep Zod as target projection, not a Laravel rule classifier.
- `SchemaRelationTarget`: map to structural relation/graph only if schema relation authority does not already emit the same canonical target.
- `CanonicalSourceNode`: type-only canonical union; don't convert it into another source model without a consumer.
- `SourceBoundaryInput`: useful closed ADT only if a source visitor algebra replaces duplicated classifiers/switches.

## Required invariants

1. Upstream owns semantic meaning, evidence, provenance and proof.
2. Wiring is a one-way conversion boundary, not a second semantic authority.
3. DataFlow execution/solver methods remain producer-side; downstream receives read-only authority and closure.
4. AST/ADT contracts stay closed and preserve discriminants; no broad `any`/untyped escape hatch is introduced.
5. Structural `GraphEdgeRelation` and semantic dataflow remain separate lanes.
6. Zero internal references alone is not grounds to delete a public contract.
7. Do not claim TypeScript 7 compatibility until the repository-pinned compiler actually runs the audit/build.

## Validation

Run `npm run audit:phase1358-upstream-wiring-downstream-contract-trace`. The JSON report is generated at `scripts/audits/reports/phase1358-upstream-wiring-downstream-contract-trace.json`. This audit is not a substitute for the full build or runtime tests.
