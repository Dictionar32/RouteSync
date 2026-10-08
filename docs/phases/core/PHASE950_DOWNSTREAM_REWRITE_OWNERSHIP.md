# Phase 950 — Downstream Rewrite Ownership

## Decision

Generic semantic relation rewrite execution is owned by `semantic/foundation`, not by
`compiler/scanner/lexer/routeAst`.

Foundation owns:

- `semanticRewriteEngine.ts`
- `semanticRelationalExecutionPlan.ts`
- `semanticRelationalAlgebra.ts`
- `semanticRelationalCollections.ts`

The scanner copies are compatibility facades only. They contain no generic execution
implementation.

## Allowed direction

```text
semantic/foundation
        ↑
        ├── compiler/scanner
        ├── compiler/domain
        ├── compiler/passes
        ├── compiler/ir
        └── ir/domain
```

The foundation must not import scanner, compiler, upstream types, or semantic/kernel.

Downstream domains must not import scanner-owned rewrite machinery.

## Upstream / Laravel / dataflow preservation

The Phase 948 upstream boundary remains authoritative:

```text
source evidence
  -> canonical upstream relations
  -> source model
  -> analysis / graph projection
```

Laravel controller/route policy relations remain semantic source-model relations and
are excluded from structural graph projection.

Dataflow remains:

```text
SemanticDataflowInput
  -> astDataflowAuthority
  -> SemanticDataflowJudgment
  -> semanticDataflowInterfaceFromJudgment
  -> AstAnalysisInterface / SSA consumers
```

`reaches` remains derived closure state rather than an input seed.

## E-commerce provenance

The maintained fixture is:

`packages/sdk/tests/fixtures/ecommerce-shop-source`

The historical `examples/ecomerce-shop-source` and `examples/ecommerce-shop-source`
paths remain absent.
