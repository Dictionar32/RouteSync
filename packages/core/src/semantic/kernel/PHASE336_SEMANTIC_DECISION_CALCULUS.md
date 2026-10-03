# Phase 336 — Semantic Decision Calculus

## Objective

Raise the Phase 335 relational authority from a collection of primitives into a
single semantic calculus capable of representing selection, dependency,
transition, rewrite, and recursive closure without making source-language
control constructs part of the semantic ontology.

## Research synthesis

The design is informed by several complementary systems:

- Souffle / CodeQL: typed relations, Horn rules, stratified relational semantics.
- JastAdd: circular attributes, monotone lattices, declarative fixed points.
- MLIR PDL/PDLL: explicit match/rewrite separation and declarative rewrite patterns.
- egglog: Datalog plus equality saturation, congruence and lattice-oriented reasoning.
- K / Maude: configuration/state rewriting and rewrite-logic semantics.
- Flix: relational constraints plus lattice semantics.
- Datafrog / Differential Dataflow / DDlog: recursive and incremental relational closure.
- Spoofax / Statix: declarative syntax and name/type relations.
- WebAssembly: declarative validation constraints separated from executable behavior.
- CompCert / Alive2 / SMT / SeaHorn / Rosette: refinement obligations and solver-backed proof layers.

These systems should not be collapsed into one implementation. RouteSync takes
specific ideas from each layer: relations as ontology, equations as semantics,
rewrites as normalization, lattices as convergence, and SMT/proof systems as
obligation checkers.

## Calculus

```text
syntax evidence
    |
    v
PredicateWitness
CandidateWitness
Dependency
Transition
Rewrite
    |
    v
DecisionRelation
    |
    +--> candidate derivation
    +--> transition derivation
    +--> rewrite derivation
    |
    v
least fixed point over a join-semilattice
    |
    v
DerivedDecision + provenance/witness
```

The canonical semantic vocabulary is deliberately independent of:

```text
if / else
for / foreach
while / do-while
switch
map / filter / reduce / flatMap
undefined / null / ??
=== / !==
as
ternary syntax
```

Those constructs may still occur in source syntax evidence. They must not be
used as semantic ontology or semantic dispatch mechanisms.

## Important distinction

The calculus does **not** claim that a compiler implementation can contain no
branching machine instructions. A solver, parser runtime, or generated code
must eventually execute algorithms. The invariant is stronger and more useful:
semantic meaning is represented by relations/rules/equations, and the host
algorithm is an implementation of those semantics rather than their definition.

## Replacement laws

| Source construct | Semantic representation |
|---|---|
| conditional branch | predicate + guarded candidates |
| loop / iteration | recursive relation + fixed point |
| switch / match | constructor-indexed candidates |
| map | relation projection |
| filter | relation selection |
| reduce | lattice/join accumulation |
| flatMap | relation expansion |
| optional value | presence witness relation |
| null coalescing | presence relation + fallback rule |
| strict equality | equality relation |
| type assertion | typed witness/refinement relation |
| ternary | guarded candidates + rewrite |
| syntax error | evidence relation + failed obligation |

## Migration frontier

The Phase 335 audit shows the largest remaining semantic surfaces are:

1. `compiler/scanner/subscanners/queryProducer.ts`
2. `compiler/scanner/lexer/astClassifier.ts`
3. provider/controller/resource/request canonical producers
4. controller method/body parsers
5. `compiler/scanner/lexer/routeAst/tokenCursor.ts`
6. syntax error and expression classification paths

Migration must proceed by semantic contract, not text substitution. In
particular, a host-language `if` replaced by `booleanCase`, a host `.map`
replaced by `relationProject`, or a host `for` replaced by recursion is not by
itself a semantic elevation. The relation/equation being evaluated must become
the authority, with the traversal mechanism remaining an implementation detail.

## Exit criteria

Phase 336 is complete only when:

1. parser adapters emit evidence relations rather than semantic decisions;
2. generic solvers consume typed relations and obligations;
3. ternary/null-coalescing/type-refinement are represented as candidate/guard/
   witness relations;
4. recursive semantics use an explicit monotone closure contract;
5. rewrite normalization is represented as data, not host dispatch;
6. absence never crosses the semantic boundary as a host sentinel;
7. equality is represented by the canonical equality relation;
8. strict audit can distinguish semantic ontology from implementation machinery;
9. each migration retains a witness/provenance path back to syntax evidence.
