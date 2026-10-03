# Phase 339 — Declarative Syntax Relations

Phase 339 extends the semantic decision calculus toward the syntax boundary.

## Research synthesis

- MLIR PDLL/PDL separates declarative matching from rewriting and represents the pattern infrastructure itself as an intermediate representation. See MLIR PDLL and PDL documentation.
- Soufflé treats relations as typed tuple sets with declared domains and constraints.
- Flix exposes fixpoint computation directly over relational and lattice constraints.
- The resulting RouteSync architecture therefore treats syntax classification and navigation as evidence-producing relations rather than imperative dispatch authorities.

## Authority rule

The semantic decision engine must not expose source-language control constructs as its semantic vocabulary. A candidate is admitted by requirements, exclusions and dependencies; a witness is the result of relation solving.

`relationResolve` remains an implementation primitive below the authority boundary. It is not used by the canonical decision engine.

## Migration frontier

The next authority migration targets `TokenCursor`, `astClassifier` and `queryProducer`. Their public compatibility surfaces still contain legacy absence sentinels and host-language dispatch. They must move toward `CursorPresence`, syntax facts, candidate catalogs, rewrite rules and typed witnesses without changing source-language meaning.
