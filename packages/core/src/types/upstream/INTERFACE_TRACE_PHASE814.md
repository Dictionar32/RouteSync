# Phase 814 — Upstream Interface Trace

## Scope

Trace the canonical semantic interfaces from syntax evidence through upstream AST/ADT, data-flow, resolver, analysis, lowering, and target projection. Also trace remaining descriptor compatibility surfaces.

## Authority graph

```text
Laravel source
  -> LaravelSourceLexer / RouteDeclarationAst
  -> routeDataFlow
  -> RouteScanner
  -> routeProducer
  -> RouteAst / DomainAstJudgment
  -> AstSemanticAuthorityPipeline
       scanner_evidence
       -> upstream_mapping
       -> resolver_graph
       -> analysis
       -> semantic_type_lowering
       -> target_projection
  -> Next.js target semantic surface
```

## Canonical authorities

| Interface | Authority | Direct non-test consumers | Verdict |
|---|---|---|---|
| `ast.ts` / `RouteAst` | upstream AST/ADT | scanner + upstream consumers | canonical |
| `astDataflowInterface.ts` | `AstDataflowInterface` | `analysis/astDataflowAuthority.ts` | canonical, narrow consumer frontier |
| `astMappingInterface.ts` | `AstMappingInterface` | resolver graph + resource semantic mapping | canonical, but ownership needs consolidation |
| `astSemanticStageInterface.ts` | stage transport/judgment | lexer, semantic analyzer, resolver, lowering | canonical transport |
| `astSemanticStageInterfaceAlgebra.ts` | stage interface construction/fold | authority pipeline | canonical algebra |
| `astSemanticAuthorityPipeline.ts` | cross-stage authority | currently mostly its own construction | **under-consumed authority** |
| `route.ts` / `RouteSemanticFlow` | route semantic vocabulary | broad compiler surface | canonical upstream vocabulary, but legacy consumers remain |
| `routeProducer.ts` / `RouteProducer` | route AST construction | `RouteScanner` | canonical producer |

## Critical trace findings

### 1. `RouteProducer` is canonical but construction is not yet terminal

`RouteScanner.scanSource()` still constructs and accumulates `RouteSemanticFlowFactory` values and then `scanAsts()` converts them through `routeAstFromRouteSemanticFlow()`.

Therefore the actual path is still:

```text
RouteDeclarationAst
  -> RouteSemanticFlowFactory
  -> routeAstFromRouteSemanticFlow()
  -> RouteAst
```

rather than the desired:

```text
RouteDeclarationAst
  -> semantic relations
  -> RouteProducerInput
  -> routeProducer.produce()
  -> RouteAst
```

This is the largest remaining interface elevation frontier.

### 2. Descriptor layer is still alive

The route descriptor tree remains large and is referenced directly or indirectly by the scanner/index surface. Notably:

- `compiler/scanner/descriptors/route/RouteSemanticFlowFactory.ts`
- `ScannedRouteDescriptor.ts`
- `routeContracts.ts`
- route factories
- route parameter descriptor classes
- route response/security/mutation modules

`RouteSemanticFlowFactory` is structural rather than class-based, but it is still a compatibility descriptor layer. It should not become a second semantic authority.

### 3. `AstSemanticAuthorityPipeline` is structurally highest but under-consumed

The pipeline explicitly declares:

```text
scanner_evidence
 -> upstream_mapping
 -> resolver_graph
 -> analysis
 -> semantic_type_lowering
 -> target_projection
```

with least-fixed-point closure and semantic rewrite engine metadata. However, most current consumers import lower-level stage interfaces rather than consuming one complete authority object.

This means the model is high-level enough, but the **consumer graph has not caught up to the model**.

### 4. `AstSemanticStageInterface` is transport; it should not become competing domain AST

`astSemanticStageInterface.ts` contains stage facts, contracts, judgments, ports, and pipeline types. It should remain the relational stage boundary. It should not be duplicated by more domain-specific `*Interface` wrappers unless they introduce a distinct semantic judgment.

### 5. `AstDataflowInterface` has a good authority boundary

`astDataflowAuthority.ts` is its concrete semantic consumer. This is the desired shape:

```text
syntax evidence
 -> data-flow facts
 -> AstDataflowJudgment
 -> fixed-point closure
 -> analysis
```

The next step is to make route/controller/resource analysis consume this judgment rather than reconstructing data-flow facts locally.

### 6. `AstMappingInterface` still has two active semantic neighborhoods

It is consumed by:

- `resolverGraphSemanticInterface.ts`
- `resourceSemanticMappingRelations.ts`

These should eventually converge on one upstream mapping authority. The mapping interface must describe semantic correspondence, not act as a bag of adapter facts.

## Legacy / compatibility frontier

The following are not proven unused merely by name search; they are proven to be architectural compatibility surfaces because they remain on the scanner path or exported index:

```text
compiler/scanner/descriptors/route/*
compiler/scanner/descriptors/request/*
compiler/scanner/descriptors/resource/*
compiler/scanner/descriptors/model/*
```

They must be migrated consumer-by-consumer before deletion. Blind deletion would hide missing semantic edges.

## Required next elevation

1. Replace `RouteSemanticFlowFactory` as the intermediate construction product of `RouteScanner` with a canonical `RouteProducerInput` relation.
2. Make `routeProducer.produce()` the terminal construction authority for `RouteAst`.
3. Move route semantic facts currently reconstructed by `routeAstFromRouteSemanticFlow()` into upstream relations before production.
4. Make `AstSemanticAuthorityPipeline` a real consumer boundary for analysis/lowering/target code instead of an exported-but-underused aggregate.
5. Consolidate mapping consumers behind `AstMappingInterface`.
6. Trace request/response/resource/model descriptor consumers into corresponding upstream ADTs before deleting descriptor files.
7. Only after consumer migration, empty/delete descriptor files whose reachability becomes zero.

## Forbidden regressions

No new semantic boundary should introduce:

- `any`
- `unknown`
- `undefined` as semantic absence
- `null` as semantic absence
- primitive `string`/`number`/`boolean` in place of domain vocabulary
- `as` / `as unknown as`
- `??`
- ad-hoc `if`/`switch`/`for`/`map`/`filter`/`reduce`/`flatMap` semantic normalization
- duplicate Parsed/Scanned descriptor authorities

Host-language control flow may remain where it is infrastructure-only; semantic branching must remain relation/ADT based.

## Conclusion

The highest model already exists. The main remaining problem is **consumer migration**, not missing type definitions. The next phase should therefore be a producer-to-consumer cutover, beginning with `RouteScanner -> RouteProducer -> RouteAst`, followed by authority-pipeline adoption and descriptor reachability elimination.
