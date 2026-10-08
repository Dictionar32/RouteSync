# Phase 1228 — Resource Model Upstream Wiring

This phase moves the semantic precedence decision for Resource -> Model resolution into an upstream-neutral reasoning authority.

## Topology

```text
Laravel/compiler evidence
  -> ResourceModelCandidate[]
  -> reasonResourceModel()
  -> ResourceModelJudgment + SemanticReasoningContract
  -> compiler wiring adapter
  -> ResourceModelBinding
  -> graph / IR / CLI
```

`ResourceModelResolver.ts` is now a wiring adapter. It may inspect compiler-owned `ModelSymbolTable`, controller dataflow, structural fields, and knowledge dataflow to assemble evidence. It must not own semantic precedence. The precedence relation itself is now closed upstream as `controller_dataflow -> relation_propagation -> convention -> structural`, so candidate assembly order in the compiler cannot silently change semantic meaning.

The upstream authority only knows `ResourceName`, `ModelName`, candidate source, relation ordering, and the closed reasoning contract. This keeps upstream independent from scanner symbols and parser/compiler structures.

## Why this is wiring

The compiler still owns materialization of a `ModelName` into `OriginModelSymbol` and `ResourceModelBinding`. That is downstream representation work. Semantic selection is upstream.

The dependency is therefore:

```text
upstream semantic authority
        |
        v
UpstreamWiringInterface
        |
        v
compiler materialization
```

No downstream graph/IR/CLI layer should reconstruct Resource -> Model semantics.

## Remaining frontier

The same separation should be applied to request dataflow and controller policy. Do not add another generic interface wrapper unless a concrete semantic ownership boundary requires it.
