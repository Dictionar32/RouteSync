# Phase 1473 — Callable Parameter Type Contract

## Migration objective

Remove the silent loss of parameter type evidence between source tokens and `PhpParameter` AST projection.

## Ownership flow

`Source token evidence → CallableParameterTypeEvidence → scannerCallableListAlgebra.resolveParameters → closed parameter judgment → runtime AST projection`.

## Changes

- `CallableParameterTypeEvidence<Token>` now distinguishes absent, supported primitive, named, and nullable types.
- `scannerCallableListAlgebra` classifies type evidence before a parameter judgment can resolve.
- `parseParameters()` projects the judgment into `PhpParameterTypeAst` rather than hard-coding every parameter type as absent.
- Unsupported union/intersection syntax fails closed rather than silently discarding the source type.
- Named type tokens are preserved as source evidence and joined only at the AST boundary.

## Scope and limitations

This phase supports the current AST vocabulary: primitive (`string`, `int`, `float`, `bool`, `mixed`, `array`), named, and nullable types. It deliberately does not claim support for union/intersection, callable, `static`, `self`, `parent`, DNF, or builtin types not represented by `PhpParameterTypeAst`. Those need an explicit type-algebra and AST vocabulary extension before projection.

Default-value expression classification remains an AST projection concern. Full package build and Vitest must be run in an environment with project dependencies installed.
