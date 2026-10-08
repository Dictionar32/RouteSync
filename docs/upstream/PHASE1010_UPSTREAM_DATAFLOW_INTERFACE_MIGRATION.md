# Phase 1010 — Upstream Dataflow Interface Migration

## Boundary correction

Phase 1010 migrates the **dataflow interface itself**, not merely semantic identity. The canonical boundary is now an operational `SemanticDataflowInterface` with four operations:

```text
seed(input)
derive(judgment)
close(judgment)
reaches(judgment, source, target)
```

The interface still exposes the closed `judgment` for downstream projections, but closure ownership remains singular in `semanticDataflowAuthority.ts`. The operational methods delegate to that same authority; no second solver is introduced.

## Canonical production chain

```text
Laravel / upstream evidence
  -> SemanticDataflowInput (seed only)
  -> createSemanticDataflowInterface()
  -> SemanticDataflowInterface
       |-> seed
       |-> derive
       |-> close
       `-> reaches
  -> Manifest / Graph / IR projections
```

`routeSyncDataflowAnalysis.ts` now enters through `createSemanticDataflowInterface()` rather than constructing the judgment and wrapper separately.

## Upstream and framework alignment

- CodeQL separates AST structure from semantic data-flow nodes and lets a data-flow configuration feed a generic solver; RouteSync therefore keeps scanner evidence as seeds and exposes semantic flow through one interface. citeturn0search0turn0search5
- MLIR keeps fixed-point iteration in `DataFlowSolver` and exposes analysis state through a data-flow framework; RouteSync likewise keeps fixed-point authority below the consumer/projection boundary. citeturn0search4turn0search10
- Soufflé treats typed relations as the central declarative substrate and recursive rules as relation closure; RouteSync's `dependency`, `value_flow`, and `reaches` facts follow the same relation-first direction. citeturn0search1turn0search12
- Laravel Eloquent makes relationship keys semantic: `belongsTo` exposes foreign/owner keys and `hasOne`/`hasMany` expose foreign/local keys, with conventions only as defaults. This supports keeping model/schema relation identity upstream and separate from runtime value-flow closure. citeturn1search5turn1search11

## Fixture trace

The ecommerce fixture supplies concrete controller/model/resource/query evidence. Its Eloquent relationships provide structural lineage while controller queries and resource returns provide runtime/value-flow seeds; these must converge only through the canonical semantic dataflow interface.

## Validation

- `audit-phase966-controller-dataflow-interface.cjs`: clean
- `audit-phase968-manifest-dataflow-surface.cjs`: clean
- `audit-phase1010-dataflow-interface.cjs`: clean
- targeted TypeScript check: the modified dataflow authority/interface files no longer report local `semanticDataflow*` errors; the workspace still contains unrelated pre-existing type errors in other domains.
