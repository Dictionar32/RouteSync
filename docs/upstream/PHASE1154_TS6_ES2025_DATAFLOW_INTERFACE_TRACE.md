# Phase 1154 — TS6 ES2025 Upstream DataFlow Interface Trace

## Canonical direction

```text
examples/ecommerce-shop-source (Laravel)
  -> CompleteLaravelSourceModel
  -> upstream semantic evidence / vocabulary / judgment
  -> SemanticDataflowInput
  -> DataFlowInterface<Input, State, Node>
  -> analysis
  -> IR
```

The structural lane remains separate:

```text
upstream StructuralSemanticRelation
  -> GraphEdgeRelation
  -> ServiceGraph
```

## TypeScript baseline

The workspace uses TypeScript `^6.0.3`, `target: ES2025`, `lib: ES2025`, `module: ESNext`, `moduleResolution: Bundler`, and `strict: true`.

Additional strictness enabled in this phase:

- `noImplicitReturns`
- `noImplicitOverride`
- `noFallthroughCasesInSwitch`
- `noUncheckedSideEffectImports`

These checks strengthen wiring implementations without adding domain semantics to the generic data-flow contract.

## DataFlow contract

`DataFlowInterface<Input, State, Node>` remains domain-neutral and is composed from:

- `DataFlowSourceInterface`
- `DataFlowStepInterface`
- `DataFlowFixpointInterface`
- `DataFlowStateInterface`
- `DataFlowQueryInterface`

The `kind: 'data_flow_interface'` marker prevents accidental structural conflation with an upstream semantic model.

## Boundary rule

Upstream owns semantic meaning, evidence, identity, facts, judgment, and closure. The data-flow interface owns generic execution/state/query capabilities. Graph owns structural relations. IR consumes canonical projections and does not recompute semantic closure.

## Validation note

The available container TypeScript binary is older than TypeScript 6 and does not recognize `ES2025`. Therefore it is not used as evidence for a full TS6/ES2025 build. A pre-existing syntax error is also present in `semanticDataflowStatePolicy.phase1031.test.ts`; it is outside this phase's changed source surface.
