# Phase 335 — Relational Semantic Authority: Match, Constraint, Rewrite, Fixed Point

## Objective

Phase 335 raises the previous `if/for/while/switch/map/filter/reduce/flatMap`
eradication into a stricter semantic-authority contract. The forbidden surface now
also includes implementation-level `??`, JavaScript `undefined`, JavaScript `null`,
`===`/`!==`, and TypeScript `as` assertions in the relational compiler authority.

The rule is semantic, not lexical:

```text
source syntax
  -> syntax evidence relations
  -> typed semantic facts
  -> candidates / guards / requirements / exclusions
  -> constraint solving
  -> match / rewrite saturation
  -> monotone closure / fixed point
  -> provenance + witness
  -> lowering
```

Source-language constructs remain data. PHP `if`, `for`, `while`, `switch`, ternary,
`??`, `null`, and comparison operators are syntax evidence and must not be confused
with implementation control flow.

## External synthesis

### Soufflé / CodeQL

Relations are sets of typed tuples and rules are Horn-style derivations. Soufflé
can choose indexes and synthesize efficient execution from the declarative program;
CodeQL defines QL over named relations with Datalog-style stratified semantics.
These support RouteSync's fact/rule authority and query planning boundary.

### JastAdd / reference attribute grammars

Circular attributes provide declarative equations for analyses that require
fixed-point iteration. Convergence depends on suitable lattices, bottom values,
and monotone equations. This is the model for recursive parser/semantic
attributes that cannot safely be flattened into visitor-local state.

### MLIR PDL/PDLL

Patterns have explicit match and rewrite roles and are themselves representable
as an IR. RouteSync should therefore represent parser/semantic alternatives as
match constraints and rewrite candidates rather than host-language dispatch.

### egglog / e-graphs

egglog combines Datalog with equality saturation, incremental execution,
congruence closure, lattice analyses, and term extraction. RouteSync should use
the same separation: relation closure discovers valid facts; equality/rewrite
saturation normalizes equivalent semantic terms; extraction chooses a canonical
lowering witness.

### K / rewriting logic

K demonstrates executable semantics through rewrite rules over structured
configurations. RouteSync's transition/join/recurrence/backedge relations are
its equivalent semantic state, but remain typed relations rather than an embedded
host-language interpreter.

### Rosette / SMT / SeaHorn / Alive2

Solver-aided systems are most useful after semantic facts have been exposed:
constraints, equivalence obligations, path feasibility, and refinement checks.
They should not become parser dispatch mechanisms.

### CompCert / WebAssembly validation

CompCert provides a reference point for semantic preservation and proof-carrying
translation. WebAssembly validation is a useful model for declaratively specified
validity constraints from which an execution algorithm can be derived.

## Forbidden implementation surface

The strict authority audit rejects:

- `if`, `for`, `for-in`, `for-of`, `while`, `do-while`, `switch`
- `.map()`, `.filter()`, `.reduce()`, `.flatMap()`
- `??`
- JavaScript `undefined`
- JavaScript `null`
- `===`, `!==`
- TypeScript `as` assertions

The audit is AST-based for constructs where TypeScript exposes an AST node. It is
not a grep rule and therefore does not confuse comments or source-language string
literals with implementation constructs.

## Replacement algebra

| Legacy implementation idiom | Canonical replacement |
|---|---|
| `if/else` dispatch | candidate relation + guard/requirement relation + solver selection |
| `for/while` traversal | recursive relation closure / relation fold |
| `switch` constructor dispatch | typed constructor relation/catalog |
| `.map()` | relation projection |
| `.filter()` | relation selection |
| `.reduce()` | relation fold / lattice join |
| `.flatMap()` | relation expansion |
| `undefined` / `null` absence | `RelationOption.none` / typed absence witness |
| `??` | option relation + fallback rule |
| `===` / `!==` | typed relation equality / semantic equivalence |
| `as` | ADT narrowing, pattern relation, or typed witness |
| ternary implementation dispatch | guarded candidate/rewrite relation |

## Parser/query migration

`astClassifier.ts`, `queryProducer.ts`, route adapters, parser helpers, and legacy
cursor APIs are not to be mechanically transformed. Their guards encode
continuation semantics. Each guard must first become a relation rule with an
explicit continuation/output relation.

A parser step therefore becomes conceptually:

```text
cursor_fact
+ syntax_fact
+ guard_fact
+ continuation_fact
--------------------------------
=> candidate_fact
=> next_cursor_fact
```

A failed candidate is represented as absence or an exclusion fact. It is never
represented by an accidental JavaScript sentinel.

## Ternary / conditional syntax

PHP ternary remains a syntax fact. Its semantic meaning is represented as:

```text
condition(node, C)
branch(node, true, T)
branch(node, false, F)
requires(node, C)
requires(node, not C)
produces(node, T)
produces(node, F)
```

The solver derives compatible branch types and a resulting semantic value. No
host-language ternary operator is required to choose the semantic branch.

## `null`, `undefined`, and `??`

There are two different concepts that must not be conflated:

1. PHP's source-level `null`, which is legitimate syntax evidence and must survive
   as a tagged semantic atom.
2. JavaScript/TypeScript `null`/`undefined`, which are implementation sentinels and
   are forbidden at the semantic authority boundary.

A PHP null literal is therefore represented as a domain value such as
`SemanticAtom { kind: 'php_null' }`, not JavaScript `null`.

Optional parser results use `RelationOption<T>` and provenance-bearing absence
witnesses. Null-coalescing semantics are expressed as a relation rule over
presence and fallback candidates.

## Fixed-point contract

Recursive semantic equations must declare:

- seed / bottom value;
- monotone transfer or rewrite relation;
- convergence/equality relation;
- provenance of newly derived facts;
- non-convergence status when the bound is reached.

A bounded loop that merely stops after N rounds is not a successful semantic
fixed point. It must report `converged = false`.

## Equality saturation boundary

Datalog closure and equality saturation solve different problems:

```text
Datalog / relations:
  derive which facts hold

Equality saturation:
  derive which semantic terms are equivalent

Extraction:
  choose a canonical term subject to cost / policy constraints
```

Combining these layers avoids encoding normalization policy as imperative
conditionals.

## Migration order from Phase 334

1. Migrate `TokenCursor` consumers to `CursorWitness` and remove legacy sentinel getters.
2. Convert `syntaxRange` and route declaration/resource parsers to witness-only APIs.
3. Replace `astClassifier` guard chains with syntax-evidence candidate relations.
4. Replace `queryProducer` operation dispatch with query-operation rule relations.
5. Replace remaining adapter optional APIs with `RelationOption`.
6. Represent PHP null as a tagged semantic atom and remove implementation `null`.
7. Remove `as` assertions through ADT witnesses and typed catalogs.
8. Introduce rewrite/equality-saturation normalization for semantic alternatives.
9. Add strict audit to CI and require zero violations for the semantic authority roots.

## Phase 335 status

This phase establishes the strict audit and the target algebra. It intentionally
keeps the remaining migration visible rather than deleting active modules merely
to make the audit pass. The next implementation phases must reduce the measured
violation set by replacing semantic contracts, not by hiding constructs in helpers.
