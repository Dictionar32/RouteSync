# Phase 1334 — Upstream Semantic Capability / Data-Flow Contract Trace

Date: 2026-10-08

## 1. Build-error root causes visible in the current user log

The visible errors are not semantic failures in Laravel route inference. They are erased-type/runtime-export boundary violations:

- `Diagnostic.ts` and `ASTArtifact.ts` referenced `FileSpan` only as a TypeScript contract but imported it as a runtime value.
- `ArtifactCache`, `CacheDescriptor`, and `CacheInputDescriptor` are interfaces, but the cache barrel and compiler public barrel exported them as runtime values.
- `CompilerFingerprint` is an interface, but the fingerprint barrel and compiler public barrel exported it as a runtime value.

The repair makes type-only edges explicit while preserving `LRUCache` and `computeFingerprintHash` as runtime values. It does not claim that all 107 build errors are resolved; only the displayed error family is addressed.

## 2. Traced upstream path

```text
examples/ecommerce-shop-source
  routes/api.php + web.php
  controllers + form requests + models + resources + migrations/schema
       |
       v
LaravelSourceLexer / scanner subscanners / source AST scanner
       |
       v
CompleteSourceAst -- validateCompleteSourceAst
       |
       v
CompleteLaravelSourceModel -- buildCompleteLaravelSourceModel
       |                                  |
       |                                  +--> structural relations
       |                                         -> StructuralSemanticRelation
       |                                         -> GraphEdgeRelation / ServiceGraph
       |
       +--> semanticDataflowInputsFromSourceModel
                    |
                    v
             SemanticDataflowInput
                    |
                    v
             SemanticDataflowAuthority / reasoning closure
                    |
                    v
             DataFlowInterface<Input, State, Node>
                    |
                    +--> AST analysis / policy query / IR projection

Route capability lane:
route evidence + semantic reasoning
  -> RouteCapabilityContract (identity + evidence + derivation + provenance + closed)
  -> RouteSemanticFlow.capability
  -> CLI route capability projection
  -> manifest grouping / graph and generator projections
```

`StaticLaravelScanner` currently acts as a compatibility facade/orchestrator, while `ManifestBuilderInterface` and `manifestBuilder.build` expose the manifest construction contract. The canonical construction implementation is `constructRouteSyncManifest`; it gathers source ASTs, validates completeness, constructs the complete source model, and derives manifest dataflow seeds from that model.

## 3. Contract ownership

- `types/upstream/semanticCapability.ts` owns generic semantic capability identity/evidence/derivation/provenance/closure contracts.
- `types/upstream/route.ts` specializes that contract for route capability; `RouteSemanticFlow.capability` is the authoritative route capability.
- `types/upstream/semanticDataflow.ts` owns the semantic dataflow ADT and identity/fact/judgment vocabulary.
- `types/upstream/semanticDataflowManifestSurface.ts` adapts the complete source model into manifest-level seeds; it must not own closure.
- `types/dataflow/dataFlowInterface.ts` owns the generic, domain-neutral execution/state/query/authority boundary. It must not absorb Laravel-specific meaning.
- `types/interfaces/interfaceDependencyBoundary.ts` owns directional upstream-to-downstream projection wiring, not semantic inference.
- Graph construction is structural and remains separate from the dataflow solver lane.
- `packages/cli/src/generators/classifier/routeGrouper.ts` reads `route.capability.crudRole` and `route.capability.actionName`; it projects to legacy generator shapes. `classifyRoutes` is a deprecated compatibility alias, not a semantic authority.

## 4. Strengthening recommendations

1. Keep one semantic authority per fact. Do not add a second capability registry or a second dataflow ADT that mirrors `RouteCapabilityContract`/`SemanticDataflowInput`.
2. Make scanner outputs explicit evidence/fact contracts with source provenance. Scanner implementations should parse and preserve evidence; semantic capability builders/relations should own interpretation.
3. Keep `DataFlowInterface<Input, State, Node>` generic. Laravel source/sink/policy selection belongs in upstream input/policy contracts, while fixpoint mechanics and read-only queries remain generic.
4. Keep `InterfaceDependencyBoundary<Upstream, Downstream>` structural and directional. It should only project a closed upstream value, never classify routes or infer controller/model roles.
5. Keep graph and dataflow distinct: structural relations project to `GraphEdgeRelation`/`ServiceGraph`; value/semantic-flow closure projects through `DataFlowInterface` to analysis and IR consumers.
6. Add a boundary audit that traverses barrels and detects type-only declarations exported as values, rather than treating each Rolldown `MISSING_EXPORT` as an isolated fix. The focused Phase 1334 audit guards the visible boundary and the main upstream/dataflow ownership chain.
7. Do not replace all scanner functions with empty interfaces. A scanner interface is useful only when its output contract is canonical and consumers depend on that contract; executable parsing still belongs in an implementation. The existing `StaticLaravelScanner` facade and `ManifestBuilderInterface` are separate layers and should not be collapsed.

## 5. External design alignment

- TypeScript's `verbatimModuleSyntax` guidance explicitly distinguishes runtime imports/exports from type-only imports/exports. Phase 1334 follows that distinction at the barrel boundaries.
- CodeQL models data flow as a path between source and sink nodes with separate analysis/policy configuration. This supports keeping generic flow mechanics separate from Laravel-specific source/sink policy.
- MLIR interfaces let transformations and analyses consume generic contracts without hardcoding every concrete operation/dialect. RouteSync should apply the same principle to capability consumers: consume a closed interface instead of reclassifying concrete route paths or methods.

These references support the design direction; they do not prove that RouteSync's implementation is correct. Local source audits and the user's complete build remain the validation criteria.
