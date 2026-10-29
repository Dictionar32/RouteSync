# Phase 274 — Construct-Free Semantic Adapter Boundary

## Purpose

Phase 274 moves concrete PHP statement dispatch out of
`phpAstSemanticKnowledgeDataFlowAdapter.ts`.

The semantic adapter now consumes a generic `projectPhpStatementSyntaxEvidence(...)`
boundary. Concrete parser spellings remain confined to the syntax/evidence
projector, where they are translated into neutral semantic facts and relations.

## Boundary

```text
PHP parser evidence
       |
       v
phpAstStatementSyntaxEvidenceRegistry
       |
       | neutral semantic facts + dependency/value relations
       v
phpAstSemanticKnowledgeDataFlowAdapter
       |
       v
canonical semantic relations
       |
       v
solver / proof-carrying closure
       |
       v
rewrite / saturation
       |
       v
compilation artifact
```

The semantic adapter itself contains none of these concrete statement names:

- `if_statement`
- `foreach_statement`
- `for_statement`
- `while_statement`
- `switch_statement`
- `controlRelations`
- `semanticControl*`

## Why this is a higher boundary

Tree-sitter-style parser output is evidence: a concrete syntax tree directly
represents grammar constructs. CodeQL similarly separates its semantic data-flow
graph from AST syntax. RouteSync follows that separation one level further:
the parser-specific projector is evidence acquisition, while semantic truth is
represented only by typed facts, relations, constraints, closure and rewrites.

The relational layer can therefore derive properties such as reachability,
convergence and recurrence without introducing a semantic `while`, `for`, `if`
or `switch` node.

## Verification

- Strict isolated TypeScript compilation passes.
- Phase 273 construct-free semantic regression passes.
- Phase 274 source-boundary audit rejects the forbidden concrete statement names
  in the semantic adapter.

## Remaining deliberate syntax knowledge

`phpAstAlgebra.ts` still knows the complete PHP statement vocabulary. That is
intentional: the parser/evidence layer must recognize source syntax. Phase 274
removes that vocabulary from the **semantic authority boundary**, rather than
pretending the parser no longer has to recognize PHP syntax.

Expression-level semantic `choice` for ternary, null-coalescing and match
expressions remains a separate migration target; it is not caused by the
statement dispatch addressed here.
