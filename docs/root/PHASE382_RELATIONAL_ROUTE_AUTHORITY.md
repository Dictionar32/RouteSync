# Phase 382 — Relational Route Authority

Phase 382 extends the relational semantic authority from the parser/solver core into the route semantic layer.

## Scope

Canonical authority surfaces:

- semantic relation solver
- syntax-error relation core
- parser adapter relations
- ternary semantic handler
- route binding AST adapter
- route constraint AST adapter
- route resource AST adapter
- route middleware AST adapter
- route binding semantic resolver
- route resource semantic resolver
- route middleware resolver
- route semantic-flow composer
- ResourceModelResolver
- controller resource dataflow aggregation
- resource two-pass relation resolver

## Architectural change

The route layer now treats absence, candidate selection, filtering, projection and resource propagation as explicit relations/ADTs. Array methods are no longer semantic authorities in these surfaces. Resource resolution is a prioritized relation fold, while middleware and constraint extraction use relational projection/selection. Resource nesting and propagation remain monotone data transformations.

The intended semantic shape is:

`syntax evidence -> facts -> candidate relations -> constraints -> derivations -> fixed point -> canonical contract`

This follows the same architectural direction as declarative rewrite systems and relational rule engines: MLIR separates match from rewrite patterns; Souffle represents computation as relations and Horn rules; K represents semantic transitions as rewrite rules; egglog combines equality saturation with Datalog.

## Gate

TypeScript AST audit over the 15 authority files must report zero occurrences of:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `!==`, `as`, `unknown`.

Transpile-only validation is used because the checkpoint environment lacks the external `node` and `vitest/globals` type-definition packages required by the repository-wide TypeScript configuration.
