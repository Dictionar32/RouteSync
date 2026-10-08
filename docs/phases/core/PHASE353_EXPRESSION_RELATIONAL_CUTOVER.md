# Phase 353 — Expression Relational Cutover

The semantic expression boundary now treats operator dispatch and literal typing as relations.

## Authority

- binary operator/type catalogs are typed relations;
- operator lookup uses relation option witnesses;
- binary metadata uses discriminated relation refinement;
- null-coalesce selection is a relation query over scalar witnesses;
- literal classification is a relation over runtime type evidence;
- PHP `null` is represented by `SemanticNullAtom`; host-language absence remains `Presence`.

## Forbidden host constructs

The authority surface audited by `audit-semantic-authority-phase353.cjs` contains no:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `===`, `!==`, or `as`.

The semantic spelling `kind: 'null'` is a tagged PHP value, not a host-language null sentinel.

## Research alignment

The design follows the same separation found in declarative rewrite systems: relations establish matches and constraints; the rewrite/solver layer derives consequences. MLIR DRR/PDLL explicitly models source matching and result rewriting, while Soufflé models computation as typed relations and rules.
