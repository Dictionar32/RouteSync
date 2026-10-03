# Phase 384 — Declarative Control Authority

Phase 384 elevates control semantics above source-language branching.

## Research synthesis

The design draws on complementary ideas rather than cloning any one system:

- Tree-sitter remains a syntax transport layer; its concrete syntax tree is not the semantic authority. citeturn0search3turn0search4
- CodeQL and Souffle demonstrate relational/Datalog-style semantic querying over facts and rules. citeturn0search24turn0search10
- MLIR demonstrates a multi-level IR that can carry higher-level dataflow and progressively lower it. citeturn0search20
- K demonstrates executable configuration/state rewriting with rules and guards. citeturn0search0
- e-graphs/egglog combine equality saturation with relational reasoning, making non-destructive rewrite closure a useful semantic layer. citeturn0search19turn1search11
- JastAdd/CRAG demonstrates declarative circular attributes and fixed-point evaluation for recursive semantic dependencies. citeturn1search5turn1search10
- Differential Dataflow and Datafrog show incremental/monotone relational closure and recursive Datalog evaluation. citeturn1search8turn1search17
- SMT-LIB provides a standardized solver boundary for satisfiability and theory reasoning; Crux illustrates symbolic reasoning as an assurance layer. citeturn1search0turn1search20
- CompCert establishes the stronger verification target: semantic preservation must be stated and checked, not assumed. citeturn0search1
- Flix adds a useful type/effect perspective for making semantic effects explicit rather than implicit in host control flow. citeturn1search2turn1search3

## Canonical semantic model

Control is represented as relations:

`candidate`, `guard`, `transition`, `join`, `recurrence`, `backedge`, `dependence`.

The semantic pipeline is:

`syntax evidence -> semantic facts -> relation closure -> candidate/guard constraints -> fixed point -> rewrite saturation -> canonical projection`.

The host language is not allowed to become the authority for source-level control semantics. `if`, `for`, `while`, `switch`, ternary selection, nullish fallback, sentinel `undefined`/`null`, strict equality, and type assertions are transport implementation details to be progressively removed from semantic authority files.

## Migration policy

1. Parser adapters emit facts/evidence only.
2. Generic solvers consume relations and constraints, never source-control branches.
3. Syntax errors are explicit semantic evidence, not sentinel absence.
4. Ternary semantics are candidate/guard relations, not host conditional selection.
5. Optionality uses Presence/RelationOption/explicit semantic atoms.
6. Equality is represented by semantic relation operators.
7. Recursive semantic dependencies use lattice fixed points or rewrite closure.
8. Legacy imperative implementations are quarantined until their semantic replacement reaches parity.

## Gate

Phase 384 adds `scripts/audit-phase384-declarative-control.cjs`. The gate scans semantic authority roots with the TypeScript AST and reports forbidden constructs per file. Existing Phase 383 canonical files remain the first zero-violation baseline; subsequent migrations expand the zero-violation frontier.
