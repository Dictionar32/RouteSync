# Phase 300 — Declarative Syntax Relational Runtime

Phase 300 extends the relational authority boundary through syntax navigation and syntax/evidence production.

## Scope

The execution surface audited by the phase is:

- relational sequence runtime;
- syntax grammar;
- token cursor/navigation;
- delimiter navigation;
- syntax facts;
- statement syntax-evidence registry;
- expression syntax-evidence registry;
- semantic parser adapter;
- generic relation solver;
- constraint calculus;
- rewrite engine;
- closure engine.

## Model

```text
Concrete PHP Syntax
        |
        v
Syntax Evidence
        |
        v
Typed Syntax Relations
        |
        v
Typed Semantic Relations
        |
        +--> Constraints
        +--> Rewrite Rules
        |
        v
Executable Relational IR
        |
        v
Indexed Relation Store
        |
        v
Fixed Point / Closure
        |
        v
Proof-Carrying Semantic Artifact
```

Concrete source constructs are evidence vocabulary only. The semantic ontology does not contain control nodes for conditionals, repetition, dispatch, or branching.

## Ternary source expressions

PHP ternary, short-ternary, null-coalescing, and match-shaped alternatives remain represented through neutral relational evidence:

```text
condition
candidate
requires
excludes
permits
```

They are not represented by a semantic choice/branch/repetition node.

## Host execution vocabulary audit

AST-level audit over the Phase 300 target surface rejects:

```text
if
for
while
switch
.map()
.filter()
.reduce()
.flatMap()
```

Result:

```text
PHASE300-DECLARATIVE-SYNTAX-AUDIT-PASS
```

The audit is AST-based rather than grep-based, so comments and string literals do not create false positives.

## Design reference

The design follows the useful intersection of relational Datalog/fixed-point systems and declarative rewrite systems. egglog combines Datalog, incremental execution, lattice reasoning, rewriting, and equality saturation; Flix provides first-class relational/lattice fixpoints; MLIR PDL/PDLL represents matching constraints and rewrites declaratively. These systems are used as architectural references, not as dependencies of RouteSync.
