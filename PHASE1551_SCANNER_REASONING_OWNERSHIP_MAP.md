# Phase 1551 — Scanner reasoning ownership map

## Coverage boundary

`PHASE1550_SCANNER_REASONING_INVENTORY.json` enumerates every `.ts`/`.tsx` file under `packages/core/src/compiler/scanner`. It is a heuristic map of code signals, not a proof that each flagged file owns reasoning. Current snapshot: 464 files total (371 production, 93 tests), 187 production files with reasoning signals, and 0 production files matching the configured direct generic-solver-call patterns. The last number does **not** mean zero semantic reasoning remains: inference, candidate ranking, classification, type derivation, and domain resolution can occur without direct solver calls.

## Ownership classifications

| Cluster | Scanner responsibility allowed | Semantic authority target | Migration status |
|---|---|---|---|
| Relation program / theory / behavior kernel / closure / constraints | compatibility imports and wiring | `types/upstream/semantic*` authority + existing foundation solver | Moved in Phase 1550; audit checks facades and dependency direction |
| Route CRUD capability | parse route evidence and pass typed route input | `types/upstream/routeCapabilityAuthority.ts` | Upstream authority exists; legacy classifier is a facade |
| Route domain | collect typed domain/resource/controller/path/action evidence | `types/upstream/routeDomainAuthority.ts` | Phase 1551 improves closed judgment with selected evidence, explicit default outcome, and precedence identity |
| Route security | collect middleware/auth evidence | `types/upstream/routeSecurityAuthority.ts` | Upstream authority exists; remaining consumers require continued trace |
| Route-group facts | extract route-group syntax facts | `compiler/scanner/upstream/route/routeGroupSemanticResolver.ts` | Upstream semantic projection exists; scanner path is a facade/wiring layer |
| AST parsing/classification | tokenization, delimiter matching, syntax structure, AST node construction | `types/upstream/astClassifierRuleAlgebra.ts` for generic rule ordering; scanner parser may retain syntax construction | Mixed boundary: do not blindly move AST construction; audit any domain inference mixed into parser rules |
| Model/resource/request type derivation | source facts and syntax evidence | upstream model/resource/request semantic authorities and typed judgments | Open frontier; trace producer → authority → consumer before moving each cluster |
| Resource mapping and upstream-expression closure | evidence extraction and adapter wiring | upstream semantic rewrite authority/executor | Partial migration; audit all consumers and any local fallback logic |
| Controller expression/dataflow | AST/source evidence and typed requests | upstream controller/dataflow semantic authority | Open frontier; Phase 1547 moved one variable-resolution path only |

## Required trace for every remaining candidate

1. Record the producer and the exact fact/evidence it emits.
2. Follow imports and calls to identify every place selecting candidates, applying precedence, inferring types/domains, filtering constraints, or closing relations.
3. Identify one canonical upstream authority and one closed judgment for that semantic domain. Reuse the existing algebra/solver.
4. Define or strengthen the interface before changing wiring; represent absence, conflict, unsupported input, and incomplete reasoning distinctly.
5. Make scanner code collect evidence and delegate. Keep parser mechanics in scanner where they are genuinely syntax-specific.
6. Check all consumers for reclassification and fallback reasoning. Add behavior tests, ownership audit, and dependency-direction checks.

## Immediate next clusters

1. `lexer/astClassifierRuntime.ts`, `astClassifierEvidence.ts`, `astClassifier.ts`: separate syntax parsing from semantic/domain decisions; preserve AST node construction in scanner when it is syntax-only.
2. `resolvers/RouteDomainResolver.ts`, `RouteSecurityResolver.ts`, `RouteCrudClassifier.ts`, plus resolver-graph consumers: ensure callers use complete judgments instead of projecting then reasoning again.
3. `subscanners/semantic/*Deriver.ts`, `SemanticTypeDeriver.ts`, `RequestTypeDeriver.ts`, `subscanners/resource/*`: trace inference and fallback behavior against upstream semantic contracts.
4. `semantic/semanticEvidenceRelations.ts`, `queryEvidenceProducer.ts`, and related binders: confirm they only produce evidence and do not make a second semantic decision.

## Reference architecture

MLIR's interface documentation explains that generic analysis/transformation should query semantic behavior through interfaces rather than accumulating concrete-operation special cases. RouteSync applies the same principle to semantic authorities: scanner syntax evidence is concrete, but domain reasoning is queried through an upstream contract. See <https://mlir.llvm.org/docs/Interfaces/>.
