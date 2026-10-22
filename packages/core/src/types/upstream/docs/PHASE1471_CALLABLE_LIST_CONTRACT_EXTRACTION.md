# Phase 1471 — Callable List Contract Extraction

## Boundary

`ScannerCallableListInterface` exposes typed closed judgments for callable list partitioning and closure-capture interpretation. `scannerCallableListAlgebra` delegates delimiter-aware partitioning to `ScannerTokenStructureInterface`; it owns empty-element validation and the capture `& VARIABLE` relation. Runtime only maps resolved token evidence into `PhpArgument` and `PhpClosureCapture` AST values.

## Migrated paths

- `parseArguments()` no longer maintains its own recursive delimiter-depth cursor. It consumes `resolveList()` and projects each evidence part through `parseArgument()`.
- `parseCaptures()` obtains the parenthesized source through the shared delimiter judgment, consumes `resolveCaptures()`, and projects typed capture evidence.
- The upstream barrel exports both interface and algebra.

## Deliberate remaining frontier

`parseParameters()` still projects variable tokens into the existing intentionally limited `PhpParameter` shape. Its parameter grammar (type, default, reference, variadic, attributes) should be migrated as a separate contract rather than inferred from this list-only phase. Other runtime uses of `splitTopLevel()` and delimiter index adapters remain until each consumer is rewired.

## Verification status

The phase audit checks the ownership boundary and wiring statically. Focused TypeScript checking and Vitest execution must be reported separately; a passing static audit is not a substitute for a complete build.
