# Phase Upstream Interface Repair 36 — Model Semantic Node SSOT

## Scope
Upstream high-level interface only. AST/source compatibility remains intact.

## Trace
`ModelAst` contains both:

- `definition: ModelDefinition` — source/AST-oriented model representation
- `facts: ModelFacts` — semantic model facts

`CompleteLaravelSourceModel` then exposed `ModelSemanticNode.definition: ModelDefinition`, forcing the high-level graph to consume the lower-level representation even though a higher semantic model already existed.

## Root defect
Two model representations were exposed at the same semantic boundary:

```text
ModelDefinition  ← lower/source-oriented
ModelFacts       ← higher semantic model
```

A downstream consumer could choose the wrong representation and reconstruct meaning from fragmented `ModelDefinition` collections.

## Repair
`ModelSemanticNode` now exposes:

```ts
readonly facts: ModelFacts;
```

instead of:

```ts
readonly definition: ModelDefinition;
```

`ModelAst.definition` is intentionally retained because the scanner AST must preserve source-oriented data. This repair only changes the high-level semantic boundary.

## Target flow
```text
Laravel source
  ↓
ModelScanner
  ↓
ModelAst
  ├── definition  (source/AST preservation)
  └── facts       (semantic model)
          ↓
ModelSemanticNode
  └── facts       (single semantic SSOT)
```

## Verification
No runtime `null`, `undefined`, `any`, `Record<>`, `??`, or `?.` was introduced in upstream interfaces.

Existing consumers that still expect `ModelSemanticNode.definition` are migration signals and are intentionally not repaired in this interface-first phase.
