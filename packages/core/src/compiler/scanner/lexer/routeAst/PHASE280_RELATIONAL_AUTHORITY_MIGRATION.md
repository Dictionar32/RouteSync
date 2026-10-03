# Phase 280 — Relational Authority Migration

RouteSync's canonical semantic layer is now relation-first.

## Authority boundary

```text
source syntax
  -> syntax/evidence projection
  -> canonical semantic relations
  -> relation schemas + declarative rewrites
  -> constraint calculus
  -> fixed-point solver
  -> proof-carrying closure
  -> target lowering
```

Concrete PHP statement spellings are evidence vocabulary only. They are not
canonical semantic node kinds or semantic control authorities.

## Removed from canonical semantic consumers

The production semantic layer no longer imports or evaluates the historical
`semanticRuleEngine`. Object identity and interprocedural call-target analysis
now express their domain deductions as relation seeds plus declarative rewrite
rules and execute them through `semanticRelationSolver`.

Finite semantic classifications such as assignment effects and data-flow roles
remain declarative knowledge registries; they do not require a second rule
interpreter.

## Control ontology

The canonical semantic model does not define semantic nodes for source control
spellings such as conditional/iteration constructs. Their meaning is projected
as relations including `condition`, `candidate`, `requires`, `excludes`,
`depends`, `reaches`, and `recurs`.

Historical control-rule infrastructure is retained only under `legacy/` for
migration/reference and is outside the canonical semantic authority.

## Important distinction

The implementation of a generic solver may use ordinary TypeScript control
flow internally. The architectural ban applies to semantic representation and
domain authority, not to the machine executing the solver itself.
