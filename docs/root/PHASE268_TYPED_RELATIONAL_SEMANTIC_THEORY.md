# Phase 268 — Typed Relational Semantic Theory

RouteSync's canonical semantic boundary is now a typed relation theory.

## Principle

Source constructs are evidence. They are not semantic categories.

The canonical semantic API contains relations such as:

- `condition`
- `candidate`
- `requires`
- `permits`
- `excludes`
- `precedes`
- `reaches`
- `converges`
- `recurs`
- `invariant`
- `depends`
- `produces`
- `consumes`
- `transfers`
- `effects`

There is deliberately no canonical relation named `if`, `for`, `while`, `switch`, `choice`, `decision`, `repetition`, `branch`, or `loop`.

## Typed theory

`semanticRelationTheory.ts` gives every relation a signature and every argument a semantic sort. This removes the stringly-typed relation boundary that otherwise allows a legacy control concept to leak into the solver.

The theory validates arity, sorts, and term/value consistency before facts enter the canonical behavior solver.

## Solver stack

```text
syntax evidence
    -> typed semantic relations
    -> constraint calculus
    -> relational fixed point
    -> rewrite saturation
    -> semantic closure
    -> target lowering
```

Souffle contributes the relational/fixed-point idea; cvc5 demonstrates that relations can be treated as mathematical objects including transitive closure and joins; K and Matching Logic demonstrate executable rewrite-based semantics; MLIR and egg contribute declarative and saturation-based rewriting. RouteSync combines these ideas behind a source-construct-free semantic boundary rather than making any source control construct the ontology.

## Legacy control layer

The old `semanticControl*` modules are now quarantined. They remain internally available during migration because existing historical tests and adapters still reference them, but they are no longer exported by `routeAst/index.ts` as part of the canonical semantic API.

The next migration step is to replace the PHP AST adapter's control materialization with direct typed relational evidence. After that, the legacy modules can be deleted instead of merely quarantined.
