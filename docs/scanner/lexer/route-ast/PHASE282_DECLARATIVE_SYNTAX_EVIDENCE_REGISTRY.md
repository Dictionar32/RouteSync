# Phase 282 — Declarative Syntax Evidence Registry

RouteSync now separates concrete PHP grammar dispatch from semantic projection more sharply.

```text
PHP parser AST
    ↓
syntax-evidence registry        ← only boundary that knows concrete statement spellings
    ↓
neutral semantic evidence
    ↓
typed semantic relations
    ↓
declarative relation program
    ↓
constraint / rewrite solver
    ↓
fixed-point semantic closure
    ↓
proof-carrying lowering
```

## Authority rule

`phpAstStatementSyntaxEvidenceRegistry.ts` is the isolated syntax authority. It may recognize concrete parser statement kinds because its job is to translate parser evidence into the semantic projection contract.

`phpAstSemanticKnowledgeDataFlowAdapter.ts` no longer imports or dispatches through `matchPhpStatement`. It consumes the registry contract and emits facts/relations. The canonical semantic ontology contains no source-level statement constructs.

The semantic authority remains:

- typed relations
- declarative relation schemas/rules
- constraint calculus
- relation solver/fixed point
- relation-level rewrite engine
- proof-carrying semantic closure

The implementation may use ordinary programming constructs internally to execute the solver. What is eliminated is construct-specific semantic authority, not the existence of control syntax in the implementation language.

## Concrete syntax boundary

Concrete spellings such as PHP conditional/iteration/selection statement kinds are deliberately confined to the syntax-evidence registry. They are evidence categories, not semantic nodes.

This is the boundary needed to go beyond AST/CFG-centric modeling: syntax identifies evidence; the semantic layer derives meaning as relations and lets the solver/rewrite system close that meaning.
