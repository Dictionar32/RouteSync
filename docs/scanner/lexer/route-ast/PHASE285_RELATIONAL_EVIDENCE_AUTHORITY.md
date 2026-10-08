# Phase 285 — Relational Evidence Authority

Phase 285 tightens the source-to-semantics boundary.

## Authority model

```text
source grammar
    -> syntax evidence registry
    -> neutral semantic anchors
    -> typed semantic relations
    -> declarative relation program
    -> constraint solver
    -> relation rewrite engine
    -> fixed-point closure
    -> proof-carrying semantic artifact
```

The semantic adapter no longer creates or carries a `statementKnowledge` intermediate. The syntax evidence registry emits semantic anchors as a collection; the adapter only composes those anchors into scope membership and canonical relations.

Concrete PHP grammar spellings remain isolated to the syntax evidence registry because that registry is the parser/evidence boundary. They are not part of the semantic ontology, relation program, solver, rewrite engine, or lowering boundary.

The canonical semantic layer therefore does not model source control constructs as semantic concepts. Conditional, recurrence, iteration, and dispatch evidence are reduced to neutral relations such as `condition`, `candidate`, `requires`, `depends_on`, `produces`, `consumes`, `precedes`, `reaches`, `recurs`, and `converges`.

## External design evidence

The design is informed by several families of compiler and formal-language systems:

- CiaoPP demonstrates abstract interpretation as a reusable analysis/transformation layer rather than source-construct-specific reasoning.
- Spoofax/Stratego separates rewrite rules from the strategies that apply them, which supports a clean rule/engine boundary.
- CIRCT separates a canonical IR from frontend/backend paths and exposes formal verification as a separate problem layer.
- Lean-MLIR demonstrates mechanically checked semantic-preserving rewrites over SSA IR.
- Cranelift demonstrates a typed SSA IR as a lowering representation, but its conventional basic-block control model is intentionally not adopted as RouteSync's semantic authority.

## Validation

- Targeted core TypeScript compilation passes.
- Declarative semantic program smoke test passes.
- Construct-free parser-adapter test passes.
- Relational adapter-boundary test passes.
- `statementKnowledge` no longer exists in RouteAst production code.
- Concrete source statement spellings occur only in `phpAstStatementSyntaxEvidenceRegistry.ts` among RouteAst production files.
- No `legacy/` tree or `semanticRuleEngine` implementation remains.
