# Phase 408 — Scanner/Resolver Relational Conjunction + String Normalization

## Objective

Continue the semantic-authority migration from host-language control/operators toward declarative semantic relations and solver/rewrite boundaries.

## Changes

- Added `relationAll` to the semantic relation kernel.
- Added `relationTrim` as a relation-level string normalization primitive; scanner code no longer calls `.trim()` directly.
- Refactored `relationAny`/`relationEqual` so the new relation primitives do not reintroduce `&&`, `===`, or ternary control into the kernel.
- `queryEvidenceProducer.ts` now represents host conjunctions through `relationAll` and equality through `relationEqual`.
- Removed the remaining ternary expression in `relationCount` in favor of `relationGate`.
- Scanner route constraint, route security, type derivation, model property, validation, and route-knowledge code now uses `relationTrim` instead of direct `.trim()` calls.

## Boundary model

```text
source evidence
    -> semantic relation facts
    -> candidate / requirements
    -> relationAll / relationAny / relationGate
    -> solver / rewrite witness
    -> canonical semantic value
```

Source-language vocabulary such as AST tags (`if`, `for`, etc.) is not treated as host-language control-flow leakage. The audit distinguishes vocabulary data from executable semantic authority.

## Research basis

MLIR PDLL explicitly models declarative pattern matching and rewriting with constraints and separate match/rewrite sections. PDL represents the pattern matcher and rewrite as IR, allowing the pattern infrastructure itself to be transformed and verified. MLIR DRR similarly specifies source patterns, result patterns, and additional constraints declaratively.

JastAdd documents circular attributes as declarative fixed-point computations: equations iterate to a fixed point under finite-height/monotonic conditions. egglog combines equality saturation with Datalog, providing a useful reference point for the RouteSync candidate/rewrite direction.

References:
- https://mlir.llvm.org/docs/PDLL/
- https://mlir.llvm.org/docs/Dialects/PDLOps/
- https://mlir.llvm.org/docs/DeclarativeRewrites/
- https://jastadd.cs.lth.se/web/documentation/reference-manual.php
- https://github.com/egraphs-good/egglog

## Validation

- Changed TypeScript files passed `transpileModule` syntax validation.
- Scanner `.trim()` audit: 0 direct calls.
- Semantic relation kernel target audit: 0 occurrences of the requested forbidden operators/forms.
- Repository-wide `tsc --noEmit` remains environment-blocked by missing `node` and `vitest/globals` type definitions; this is not represented as a repository type-clean claim.

## Next frontier

The largest remaining semantic-authority leak is `queryEvidenceProducer.ts` optionality: approximately 401 `undefined` sentinel occurrences remain. The next migration should convert those return/value boundaries to `RelationOption` and feed them through candidate/requirement solving rather than introducing another sentinel representation.
