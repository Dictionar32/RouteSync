# Phase 161 — Typed Knowledge/Data-Flow Source Provenance

## Principle

RouteSync treats typed Knowledge/Data-Flow as the semantic source of truth. Tree-sitter/PHP syntax is evidence only. `Map` is a derived index, never the semantic authority.

## Trace

```text
examples/ecommerce-shop-source
  -> ControllerScanner(fullPath)
  -> ControllerDeclarationAst
  -> ControllerMethodAst
  -> ControllerBodyAst
  -> ControllerDataflowAst
  -> KnowledgeFlowGraph
  -> semantic consumers
```

## Elevated knowledge

- `===`, `!==`, `==`, `!=`, `<`, `>`, `<=`, `>=` -> `ComparisonKnowledge`
- `if` / `elseif` / `else` -> `BranchKnowledge`
- `while`, `foreach`, `for` -> `IterationKnowledge`
- `switch`, case/default, fall-through -> `SelectionKnowledge`
- `try/catch/finally` -> `ExceptionKnowledge`
- `return` / `throw` -> `TransitionKnowledge`
- `match` -> `MatchKnowledge`
- ternary -> `ExpressionDecisionKnowledge(ternary)`
- short ternary -> `ExpressionDecisionKnowledge(short_ternary)`
- `??` -> `ExpressionDecisionKnowledge(null_coalesce)`
- `?->` -> `ExpressionDecisionKnowledge(nullsafe_access)`

## Data-flow graph

`KnowledgeFlowEdge` has typed endpoints and semantic relations. The graph no longer emits a synthetic node-to-node chain for statement order, and semantic edges do not point back into a node's own datum fields. Each semantic relation connects distinct knowledge nodes; node ordering is traversal mechanics only.

## Provenance

`ControllerScanner` passes the actual `fullPath` into the declaration/method/body/analyzer/knowledge producer chain. `<php-source>` remains only as a compatibility default for direct parser callers that do not provide a file path; it is not used by the canonical project scanner path.

## Official language evidence

PHP documents `switch` as evaluating the switch expression once, comparing it against cases, supporting `default`, and continuing into following cases when `break` is absent. PHP also documents the broader control-structure vocabulary (`if`, `while`, `for`, `foreach`, `switch`, `match`, `return`, `throw`, etc.).

Tree-sitter documents named fields and query patterns as syntax-tree analysis facilities. RouteSync therefore elevates their output into semantic Knowledge/Data-Flow rather than treating Tree-sitter node kinds as the semantic model.

Laravel routing remains a domain knowledge layer: route groups merge middleware and `where` constraints, while prefixes/names are composed. These semantics remain typed facts above syntax.

## Validation

- `knowledgeFlowModel.ts` + `controlFlowKnowledgeProducer.ts`: targeted TypeScript validation passes with no diagnostics in those files.
- Controller provenance chain files: targeted TypeScript validation passes with no diagnostics in those files.
- Full project `tsc` remains blocked by the checkpoint/environment baseline (`@types/node` / existing unrelated type errors).
- Canonical Laravel source exists at `examples/ecommerce-shop-source` and contains real `if`, `foreach`, `match`, `===`, `!==`, `??`, and nullsafe expressions.
