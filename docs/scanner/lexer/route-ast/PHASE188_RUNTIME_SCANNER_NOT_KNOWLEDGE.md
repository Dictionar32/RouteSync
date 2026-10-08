# Phase 188 — Runtime Scanner Is Not Semantic Knowledge

The syntax scanner is an implementation mechanism, not a semantic knowledge model.

## Rule

`syntaxScan` may contain loops, state, cursor advancement, and termination because those are runtime mechanics required to consume syntax evidence.

It must not expose those mechanics as semantic facts such as `knowledgeIteration`, `knowledgeTransition`, `reenters`, `successor`, or other control-flow relations.

## Canonical boundary

```text
source
  -> parser/evidence
  -> semantic evidence adapter
  -> typed knowledge
  -> typed data-flow
  -> optional derived execution/interpreter
```

The scanner therefore returns `SyntaxScan<T>` and keeps its loop private. It does not construct or export a `KnowledgeIteration` graph.

The legacy `knowledgeFlowModel` is no longer exported from the routeAst public index. It remains only as migration/test material until historical consumers are migrated.
