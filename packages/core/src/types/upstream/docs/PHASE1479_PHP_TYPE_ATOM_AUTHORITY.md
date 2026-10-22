# Phase 1479 — PHP Type Atom Authority

## Trace finding

Phase 1478 consolidated primitive meanings between parameter evidence and raw property type expressions, but the shared authority was still the full `phpTypeExpressionAlgebra`. A parameter's typed primitive evidence therefore called a grammar parser merely to interpret one atom. Atom semantics were not represented as an independently addressable contract.

## Contract and algebra

- `PhpTypeAtomEvidence` carries one source atom.
- `PhpTypeAtomJudgment` is closed: `resolved` with a canonical `TypeExpression`, or `malformed` with source and diagnostic.
- `phpTypeAtomAlgebra` owns primitive mappings, built-in vocabulary already supported by the IR (`mixed`, `never`, `object`), and named class reference validation.
- Contextual or unsupported atoms (`void`, `null`, `true`, `false`, `iterable`, `resource`, `callable`, `self`, `parent`, `static`) fail closed until the semantic vocabulary/context can represent them correctly.

## Wiring changes

`phpTypeExpressionAlgebra` retains grammar composition (union, intersection, nullable and DNF checks) but delegates atom resolution to `phpTypeAtomAlgebra`. `phpParameterTypeAlgebra` delegates primitive evidence directly to the same atom algebra instead of invoking the whole expression parser. The public upstream barrel exports the new contract and algebra.

## Verification

- Static architecture audit: 7/7 passed.
- Regression tests added for canonical atom mappings, cross-consumer equality, fail-closed contextual atoms, and qualified class names.
- Vitest and package build not run: workspace has no `node_modules` and no local Vitest executable.
- The presence of a global TypeScript compiler does not by itself establish a successful full-project check; report only the checks actually run.

## Boundary

This phase centralizes atom semantics; it does not claim complete PHP-version-aware validation of declarations or name resolution. Those require context such as declaration site, PHP version, import aliases, and class hierarchy. Grammar and contextual validation must remain explicit upstream judgments rather than scanner-local guesses.
