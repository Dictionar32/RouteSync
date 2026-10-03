# Phase 714 — Bound AST Canonical Relation Cutover

## Closed boundary

`BoundRelationNode.relationType` now carries the canonical `EloquentRelationType` ADT from `types/upstream/modelVocabulary.ts` directly.

The bound AST no longer owns a second `BoundRelationKind` vocabulary and no longer performs a string/object conversion through `toBoundRelationKind`.

The semantic path is therefore:

`Laravel relation evidence -> canonical upstream EloquentRelationType -> BoundRelationNode -> target semantic projection`

No compatibility alias is retained for the removed relation vocabulary.

## Validation

The Phase 714 audits verify:

- the bound AST consumes the canonical Eloquent relation ADT;
- the factory preserves the canonical relation witness without conversion;
- the duplicate relation vocabulary and conversion adapter are absent;
- the bound AST surface contains no host control-flow constructs, collection combinators, host absence sentinels, strict equality, `as unknown`, `any`, or `new`.

The diagnostic trace/suggestion audit remains green from Phase 709, and the request/domain, route-security, resolver-graph, and bound-AST audits remain green.

## Architectural direction

This cutover follows the declarative compiler direction used by typed validation systems and rewrite-based IRs: semantic validity is expressed by closed judgments and relation/rewrite rules, while execution is delegated to a solver/closure engine. WebAssembly's specification explicitly separates declarative typing constraints from the validation algorithm; MLIR exposes declarative rewrite patterns; K and Maude model semantics through rewrite rules; Soufflé models derivation as Datalog relations and Horn clauses; and CompCert states compiler correctness as a semantic-preservation relation between source and target ASTs.

RouteSync applies the same separation to Laravel routing/resource evidence and Next.js target projection: parser output is evidence, canonical ADTs are semantic authority, relation catalogs express inference, and fixed-point/rewrite closure computes derived judgments.
