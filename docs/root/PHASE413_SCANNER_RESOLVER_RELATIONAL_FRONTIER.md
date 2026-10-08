# Phase 413 — Scanner/Resolver Relational Authority Frontier

## Goal

Move the remaining scanner/lexer and resolver semantic authority away from host-language
control flow and sentinel optionality into declarative semantic relations, candidate
witnesses, solver/rewrite dispatch, explicit presence/option ADTs, and fixed-point closure.

## Research basis

- MLIR PDLL separates declarative matching from rewrite and represents rewrite patterns as
  a first-class abstraction rather than hand-written dispatch.
- MLIR PDL represents matcher/rewrite structure as IR, making the rewrite mechanism itself
  inspectable and transformable.
- Soufflé treats semantic facts as typed relations rather than imperative collections.
- egglog combines equality saturation with Datalog, giving a useful model for combining
  equivalence closure with relational rule evaluation.
- Spoofax separates declarative syntax/static semantics from generated implementation.

## RouteSync consequence

The remaining scanner/lexer leaks are not to be solved by mechanically replacing `if` with
ternary expressions or `for` with recursion. The authority must move to:

1. typed semantic relations;
2. `RelationOption` / explicit presence for absence;
3. candidate sets + requirements/exclusions/dependencies;
4. relational dispatch and rewrite candidates;
5. fixed-point closure for recursive semantic evidence;
6. canonical projections emitted only after the relation solver reaches a witness.

## Phase 412 correction

The experimental `queryEvidenceProducer` catalog patch was reverted here because it mixed
`RelationOption` values with legacy optional property access (`descriptor?.…`) and therefore
was not a sound authority migration. `relationLookup` itself remains in the kernel as the
safe primitive for catalog-to-relation lookup.

## Current scanner frontier (exact lexical audit, production `.ts`, tests excluded)

The largest remaining semantic-authority surfaces are:

- `queryEvidenceProducer.ts`: legacy `undefined` sentinel flow remains the dominant breach.
- `astClassifierEvidence.ts`: control/operator/positional traversal remains mixed with the
  relational layer.
- `controllerAstCanonical.ts`: host `if`, equality, disjunction/conjunction and collection
  projection remain.
- `providerAstCanonical.ts`: host branching/loops/equality remain.
- `migrationProducer.ts`: candidate dispatch has started, but traversal and sentinel flow remain.
- `resourceFieldProducer.ts` / `resourceProducer.ts`: switch + collection pipelines remain.
- `ResourceScanner.ts`: traversal is partly relational but host control/equality remains.
- `serviceAstCanonical.ts`: recursive traversal still contains host control constructs.
- `resourceBinder.ts`: binding decisions remain partly imperative.

## Enforcement rule

No new scanner/resolver semantic authority may introduce the banned host constructs:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`,
`null`, `===`, `as unknown`, `||`, `trim`, `&&`, positional `index + N`.

Legacy occurrences are migration debt, not an architectural license.
