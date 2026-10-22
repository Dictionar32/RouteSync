# Phase 1480 — PHP Type Atom Judgment Separation

## Trace finding

Phase 1479 centralized atom semantics, but it collapsed two different conditions into `malformed`: (1) invalid atom syntax/name and (2) a valid PHP atom that the current canonical type vocabulary or available declaration context cannot represent. That loss made a downstream `TypeExpression` error indistinguishable from a syntax failure.

## Contract

`PhpTypeAtomJudgment` now has three closed outcomes:

- `resolved`: canonical `TypeExpression` exists.
- `unsupported`: source atom is recognizable, but needs context (`self`, `parent`, `static`) or missing vocabulary (`void`, `null`, `true`, `false`, `iterable`, `resource`, `callable`). It carries a reason code.
- `malformed`: the atom itself is invalid, with `invalid_atom` reason.

The same unsupported outcome propagates through `PhpTypeExpressionJudgment` and `PhpParameterTypeJudgment`. Composition does not silently downgrade an unsupported atom into a syntax error. Runtime consumers still project rejected judgments to the existing `TypeExpression` error node, preserving current downstream AST shape while retaining precise upstream diagnostics until that boundary.

## Wiring

- `phpTypeExpressionAlgebra` propagates unsupported atom judgments through union/intersection/nullable/array composition.
- `phpParameterTypeAlgebra` propagates unsupported judgments through typed AST evidence and nullable evidence.
- `propertyProducer.ts` and `resourceUpstreamExpressionMappings.ts` remain projection-only: they consume a diagnostic and construct the existing error expression rather than classifying PHP type atoms.

## Boundaries

This does not implement contextual resolution. Correctly resolving `self`, `parent`, and `static` still requires class hierarchy/declaration context. Correctly representing `void`, `null`, literal `true`/`false`, `iterable`, and `callable` requires explicit target vocabulary or a documented projection policy. The PHP manual describes version and declaration-position constraints; do not solve these by blindly mapping atoms to ordinary class references.

## Verification

Static audit and focused TypeScript checks are reported separately from Vitest and package build. A passing architecture audit is not a substitute for executing the full test suite.
