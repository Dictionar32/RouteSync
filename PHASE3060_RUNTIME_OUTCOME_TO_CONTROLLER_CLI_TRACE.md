# Phase 3060 — Fully Explicit Typed Runtime Scanner: Outcome-to-Controller/CLI Trace

## Intent

Trace the live PHP/Laravel semantic-evidence path and separate what the current code proves from what remains an implementation blocker. This phase is deliberately not described as a completed blocked-outcome gate: the producer's outcome is present as typed data, but the controller-body ADT and CLI/manifest publication path do not yet use it as a terminal outcome.

## Runtime trace from source

1. `phpAstSemanticKnowledgeEvidenceAdapter.project` in `packages/core/src/compiler/frontend/php/routeAst/semanticKnowledgeDataFlowProducer.ts` calls `phpAstSemanticKnowledgeDataFlowProductionOperation.produceWithOutcome`.
2. The projection retains `sourceFile`, `evidenceProvider`, canonical `knowledge`, and `productionOutcome` (`produced | blocked`) through `SemanticKnowledgeEvidenceProjection` in `packages/core/src/types/upstream/semanticKnowledgeEvidenceAdapterInterface.ts`.
3. `createControllerDataflowAnalyzer` in `packages/core/src/compiler/frontend/php/controllerDataflowAnalyzer.ts` collects payload evidence and places the complete projection in `sourceCorrelation` before calling the upstream semantic judgment authority.
4. The published controller dataflow model retains the projection at `semanticKnowledgeProjection` in `packages/core/src/types/upstream/controllerDataflowInvocationSemanticModelInterface.ts`.
5. `controllerVariableSemanticRuntimeBinding` is an interface-backed runtime object and is consumed by `controllerBodyParser.ts`.
6. **Gap:** `controllerBodyParser.ts` currently treats `analyze(...)` as a completed `ControllerDataflowAst`. It does not project `productionOutcome.kind === 'blocked'` into a distinct controller-body ADT case. This means the outcome is preserved as nested data, but does not yet prevent downstream semantic/manifest publication.
7. **Unverified terminal:** this structural phase does not claim that the CLI manifest builder rejects or preserves the blocked outcome as a first-class terminal result. The actual CLI-to-manifest path still needs a field-by-field trace and an end-to-end fixture.

## ADT / interface recommendation for the next implementation

- Add an upstream-owned controller dataflow analysis outcome with explicit `completed` and `blocked` cases. The blocked case must carry the exact `SemanticKnowledgeEvidenceProjection` (including source identity, provider provenance, canonical knowledge and validation violations), plus source-correlated payload evidence needed for diagnostics.
- Make the scanner runtime binding return that outcome rather than implying every producer result is semantically publishable.
- Extend `ControllerBodyAst` with explicit blocked cases; keep invocation-integrated and non-integrated cases distinct so the response judgment is not discarded.
- Make the CLI/manifest boundary consume the outcome and emit an explicit blocked manifest result, retaining blocker evidence. Do not silently downgrade to `knowledge` compatibility field.
- Keep domain decisions in upstream-owned ADT operations. Use `export const name: Interface = Object.freeze({...})` for runtime operations. Do not mechanically replace parser grammar dispatch with wrappers, and do not claim that primitive syntax-boundary types have disappeared globally.
- Do not recreate generic relation foundations. Keep `packages/core/src/semantic/relations/relationMembership.ts`, `relationalSequence.ts`, and `semanticRelations.ts` absent; do not add kernel re-exports to them.

## PHP/Laravel domain grounding

Laravel's official routing documentation distinguishes route declarations, controller actions, ordered route parameters, and implicit/explicit route-model binding. RouteSync should preserve these as source evidence and typed domain outcomes, rather than infer a successful controller/manifest result merely because syntax and a knowledge graph exist. See the [Laravel routing documentation](https://laravel.com/framework/docs/routing). TypeScript interfaces are appropriate for stable object contracts, while discriminated unions represent distinct outcomes; see the [TypeScript interfaces handbook](https://www.typescriptlang.org/docs/handbook/interfaces) and [union types handbook](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html).

## Verification

Run `npm run audit:phase3060-runtime-outcome-to-controller-cli-trace`. This is a structural trace audit, not a TypeScript build or CLI end-to-end test. The script explicitly records the blocked-outcome propagation gap as a known blocker while checking that the current projection/provenance and repository invariants are preserved.

## Acceptance criteria for closing the gap

1. A producer `blocked` result cannot be treated as a completed `ControllerDataflowAst`.
2. The parser's public AST has an explicit blocked case with source/provenance/violations intact.
3. CLI manifest output carries the blocked status and exact blocker data; no fallback to `projection.knowledge` alone.
4. An integration test exercises PHP source -> scanner -> controller AST -> CLI manifest for both `produced` and `blocked` outcomes.
5. Strict TypeScript and existing phase regression audits pass, without restoring deleted relation foundations.
