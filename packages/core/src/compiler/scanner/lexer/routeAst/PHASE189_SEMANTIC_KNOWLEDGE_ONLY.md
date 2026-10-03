# Phase 189 — Semantic Knowledge Only

## Architectural correction

RouteSync canonical semantic knowledge is now produced only through `SemanticKnowledgeDataFlow`.

The previous `controlFlowKnowledgeProducer`, `knowledgeFlowModel`, compatibility graph, and control-flow façade were removed from the source tree. They were a second semantic ontology and allowed parser statement forms to remain disguised as knowledge.

## Canonical boundary

```text
parser / lexer / language service / framework model / inference
                    │
                    ▼
             evidence adapter
                    │
                    ▼
       Semantic Knowledge Data Model
                    │
                    ▼
             typed Data Flow
                    │
                    ▼
       optional derived indexes / graphs
                    │
                    ▼
          optional interpreter/runtime
```

The semantic model is parser-neutral. The current PHP AST adapter is one evidence adapter, not the ontology.

## Raised meanings

| Source evidence | Canonical semantic knowledge |
|---|---|
| `if` | `choice` + `predicate` + `outcome` |
| `while` | `repetition` + `predicate` + `body` |
| `for` | `repetition` + initialization/predicate/update/body data |
| `foreach` | `repetition` + iterable/binding/body data |
| `switch` | `choice` + `match` + `predicate` + `outcome` |
| `match` | `choice` + strict `match` + `predicate` + `outcome` |
| `===` | `operator(identical)` + `comparison` |
| `!==` | `operator(not_identical)` + `comparison` |
| arithmetic/logical/bitwise/string operators | typed `binary-operation` / `unary-operation` |
| `return` | `emission(result)` |
| `throw` | `emission(exception)` |
| `try/catch/finally` | `exception` + `exception-handler` facts |

The source spelling is provenance/evidence. It is not the semantic identity.

## Data-flow invariant

Canonical flow contains only:

- `dependency`
- `value-flow`

with typed semantic roles such as `predicate`, `operand_left`, `subject`, `candidate`, `body`, `iterable`, `binding`, `target`, and `emitted_value`.

No sequential execution relation is canonical. No `successor`, `predecessor`, `reenters`, `branches_to`, `executes`, `terminator`, or `returns_to` relation exists in the semantic model.

`Map`/`Set` may only be used as derived indexes or validation structures. `facts[]` and `dataFlow[]` are the source of truth.

## Identity correction

Semantic knowledge identities no longer use syntax-shaped roles such as `statement`, `expression`, or `assignment-target`.

Identity roles are semantic fact roles plus the explicit semantic `reference` role. Generic expression-derived knowledge uses the semantic `value` role and its fact `kind` carries the actual meaning.

## External evidence

Tree-sitter documents its output as a concrete syntax tree whose nodes correspond to grammar symbols; its query system matches syntax-tree node types and fields. That makes it suitable as evidence, but not sufficient as RouteSync's semantic ontology.

MLIR similarly distinguishes graph-like semantic structures from control-flow regions; graph regions do not require control-flow edges. This supports keeping the canonical model data/graph-oriented and deriving execution semantics separately.

RDF's abstract data model also treats the graph model as fundamental and concrete serializations as secondary representations. RouteSync is not RDF, but the separation between semantic data and representation is the useful architectural analogy.
