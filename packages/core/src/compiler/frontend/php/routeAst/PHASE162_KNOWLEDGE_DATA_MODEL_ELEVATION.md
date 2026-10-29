# Phase 162 — Knowledge/Data-Flow Model Elevation

## Architectural decision

RouteSync now treats typed Knowledge/Data-Flow as the semantic source of truth.
Tree-sitter/PHP syntax is evidence used by producers; parser control-flow is construction mechanics only.

The semantic model must not encode `if`, `while`, `switch`, `===`, or `!==` as its ontology.
Those constructs are elevated into typed facts and semantic relations.

## Model

```text
Syntax evidence
    -> typed facts
    -> Knowledge
    -> Data-flow relations
    -> semantic consumers
```

The graph no longer emits a synthetic `node[n] -> node[n+1]` transition. Traversal order is not semantic data-flow. Semantic edges must connect distinct knowledge nodes; node-local datum lookups are not data-flow.

### Semantic relations

The graph uses relations such as:

- `depends_on`
- `derived_from`
- `satisfies` / `does_not_satisfy`
- `matches` / `does_not_match`
- `reenters`
- `continues_to`
- `terminates`
- `produces` / `consumes`
- `returns` / `throws` / `catches`
- `invokes` / `accesses` / `assigns`

Syntax-specific relations such as `true_branch`, `false_branch`, `case`, `repeat`, and `match_arm` are not part of the semantic vocabulary.

## Operator elevation

Comparison operators are represented by `ComparisonOperator` data and the immutable `COMPARISON_OPERATOR_KNOWLEDGE` catalog. `COMPARISON_OPERATOR_INDEX` is only a derived lookup index.

This means `===` and `!==` become operator facts with provenance rather than producer control-flow cases that define the model.

## Control constructs

- `if` / alternatives -> `BranchKnowledge` + `satisfies` relations
- `while` / `foreach` / `for` -> `IterationKnowledge` + `reenters` / `does_not_satisfy`
- `switch` -> `SelectionKnowledge` + `matches` / `does_not_match` / `continues_to`
- `match` -> `MatchKnowledge` + `matches`
- `try/catch/finally` -> `ExceptionKnowledge` + `catches` / `executes_finally`
- `return` / `throw` -> `TransitionKnowledge` + `returns` / `throws`
- ternary / short ternary / `??` / nullsafe -> expression decision facts

The names remain as typed semantic categories because they describe knowledge, not parser node mechanics.

## Source provenance

Every elevated fact retains `KnowledgeSource`. The canonical scanner path should pass the actual source path; `<php-source>` is only a direct-call compatibility default.

## Derived indexes

`Map` instances are allowed only as derived indexes over immutable knowledge catalogs. They are never the semantic source of truth.

## Beyond Tree-sitter boundary

`knowledgeFlowModel.ts` intentionally does not import `PhpAstValue`, `PhpBlock`, `PhpStatement`, Tree-sitter nodes, or parser-specific identifiers. Those types are producer-side evidence payloads only. The semantic model is generic over value/block/clause payloads and preserves source provenance separately.

Legacy `KnowledgeTransition`/`KnowledgeIteration` helpers now live in `knowledgeFlowCompatibility.ts` and are retained only for migration. They are not part of the semantic source-of-truth model.
