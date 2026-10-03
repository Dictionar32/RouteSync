# Phase 584 — Scanner/Lexer → Resolver Graph → AST/Upstream → Analysis → Semantic Lowering Frontier

## Purpose

Phase 583 closed the selected scanner/resolver/dataflow surfaces with relation-backed indexes and fixed-point state. Phase 584 widens the audit boundary to the layers that still sit *around* that closed core:

1. scanner/lexer construction adapters,
2. resolver graph construction,
3. AST/upstream mapping,
4. verification/analysis passes,
5. semantic type lowering.

The intended authority remains:

`lexical evidence → syntax relations → semantic facts → constraints → fixed-point closure → rewrite/equality saturation → canonical IR → target lowering`

Host-language control flow is not semantic authority.

## Research-derived architecture

The cutover follows several complementary ideas rather than copying one tool:

- Tree-sitter separates concrete syntax from later analysis and supports robust incremental parsing; RouteSync should likewise treat lexer output as evidence, not semantic truth. citeturn1search0turn1search10
- Soufflé models analysis state as typed relations and supports relation-level execution/indexing and magic-set specialization. citeturn0search3
- MLIR PDL/PDLL represents matching and rewriting declaratively, while dialect conversion separates conversion targets, rewrite patterns, and type conversion. citeturn0search0turn0search15turn0search16
- egglog combines Datalog with equality saturation, which is directly relevant to making semantic alternatives converge through rewrite/equivalence closure rather than hand-written dispatch chains. citeturn1search6turn1search22
- Flix treats relational and lattice fixed points as first-class constraint computations. citeturn1search4turn1search16
- Statix models name binding with scope graphs and constraints, suggesting that RouteSync's resolver graph should become explicit scope/reference relations rather than imperative lookup code. citeturn1search7turn1search21
- WebAssembly's current specification explicitly formulates validation constraints declaratively, with an algorithm derived from those constraints. citeturn0search1turn0search6
- CompCert demonstrates the stronger end state: compiler transformations can be specified as semantic transformations with machine-checked correctness rather than trusting implementation control flow. citeturn0search10

## Phase 584 audit result

The new TypeScript AST audit scans 317 active production files across the widened frontier.

| Surface | if | for | while | switch | ternary | map/filter/reduce/flatMap | undefined | ?? | ===/!== | new | Set/Map |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| scanner/lexer | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 | 0/1 |
| scanner/resolvers | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0/0 |
| scanner/semantic | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0/0 |
| scanner/upstream | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 0/0 |
| scanner/orchestrator | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 2 | 0/1 |
| resolver graph | 7 | 0 | 4 | 0 | 2 | 1/0/0/0 | 2 | 1 | 11 | 4 | 0/4 |
| AST/upstream | 5 | 0 | 14 | 3 | 11 | 15 | 2 | 7 | 24 | 12 | 5/5 |
| analysis/verification | 30 | 1 | 0 | 0 | 2 | 2 | 0 | 0 | 13 | 28 | 2/2 |
| compiler passes | 47 | 1 | 2 | 0 | 11 | 33 | 13 | 9 | 41 | 77 | 17/11 |
| semantic lowering | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 89 | 0/0 |

The machine-readable report is `docs/PHASE584_SCANNER_AST_ANALYSIS_LOWERING_FRONTIER_AUDIT.json`.

## Important distinction

The audit intentionally treats source-language semantic vocabulary separately from host-language implementation constructs. A PHP semantic variant named `null`, a source token named `new`, or a grammar rule describing `if` is not itself a host-language leak. The prohibited surface is the implementation mechanism used to *decide* semantics.

The most important remaining implementation leaks are therefore:

### A. Scanner/lexer construction

The lexer is already relational for control flow, but construction still contains object allocation in `tokenizer.ts`, `controllerBodyParser` support paths, and related parser boundaries. `controllerMethodParser.ts` also retains a host `Map` catalog. These should become immutable relation catalogs plus constructor-free semantic factories.

### B. Resolver graph

`manifestGraphCompiler.ts`, `graphNodeIndex.ts`, `ServiceGraphBuilder.ts`, `graphAssembler.ts`, and `nodeFactories.ts` still contain the clearest graph-authority leakage: mutable maps, imperative traversal, host equality, fallback operators, and object construction. The graph should instead be:

`node facts → reference facts → edge candidates → scope/reachability constraints → recursive closure → graph projection`.

This is the direct Statix/scope-graph direction. citeturn1search7

### C. AST/upstream mapping

`highLevelSourceModel.ts`, `routeResourceFlow.ts`, `model.ts`, `assignment.ts`, `request.ts`, `resourceVocabulary.ts`, and `presence.ts` still contain host branching and sentinel-style optionality. The next representation should use explicit algebraic presence/absence relations and candidate/witness closure. This preserves the existing Phase 557 direction instead of reintroducing `undefined`/fallback semantics.

### D. Analysis

`compiler/verification` and `compiler/passes` contain the largest remaining imperative surface. These are not merely utility loops: they are semantic analyses and therefore should be lifted into relation programs with monotone lattices and explicit transfer/join rules. Flix's relational/lattice fixed-point model and Soufflé's typed relation model are particularly relevant here. citeturn1search4turn0search3

### E. Semantic type lowering

`compiler/domain/common` has zero host branching/operator leaks in the audit, but still has 89 constructor expressions. The next cutover should not add another imperative resolver layer. Instead, preserve the existing semantic type relation and make lowering a projection from a closed target-relation model, following MLIR's separation of pattern/rewrite logic from type conversion. citeturn0search16turn0search0

## Target architecture for the next cutover

```text
Lexer / parser evidence
        │
        ▼
syntax-token / syntax-node relations
        │
        ├── AST provenance relations
        ├── upstream mapping relations
        └── source-span relations
        │
        ▼
resolver candidate relations
        │
        ├── scope/reference edges
        ├── type constraints
        ├── capability constraints
        └── dependency constraints
        │
        ▼
monotone fixed-point solver
        │
        ├── reachability closure
        ├── dataflow closure
        ├── type/subtype closure
        └── witness/provenance closure
        │
        ▼
equality/rewrite saturation
        │
        ▼
canonical semantic IR
        │
        ▼
target-specific lowering relations
        │
        ▼
TypeScript / Zod / SDK projection
```

The crucial change is that **resolver graph, analysis, and lowering become consumers of the same semantic relation substrate** rather than independent mini-kernels.

## Phase 584 status

- Phase 583 remains the clean baseline for its original closed frontier.
- Phase 584 adds the widened, machine-readable AST audit.
- No semantic authority is moved back into host control flow.
- The next implementation frontier is resolver-graph and AST/upstream relation cutover first, followed by verification/passes, then constructor-free semantic lowering.
