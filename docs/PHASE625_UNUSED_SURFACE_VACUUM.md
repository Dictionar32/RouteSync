# Phase 625 — Unused Surface Vacuum

## Goal

Continue the RouteSync declarative compiler migration without deleting paths. A production TypeScript surface is emptied only when repository evidence shows that it has no active consumer.

## External architectural basis

The direction follows compiler architectures where legality, conversion, canonicalization, and rewrite patterns are explicit semantic machinery rather than scattered host-language control flow. MLIR documents conversion targets, rewrite patterns, optional type conversion, and iterative canonicalization toward a fixpoint. Ascent exposes relations/rules and fixed-point evaluation; egglog combines equality saturation with Datalog-style reasoning.

## Change

`packages/core/src/types/emitTypes.ts` was verified to have no production TypeScript import/reference beyond its own declaration and was therefore emptied rather than deleted.

The path remains available for future migration compatibility, but it no longer contributes an independent semantic/type authority.

## Preservation policy

- deleted files: 0
- emptied files: preserve path, zero-byte implementation
- source vocabulary such as PHP `??`, `null`, ternary, or route vocabulary `any` is not treated as dead merely because the token occurs in source models/ASTs
- host-language implementation constructs are candidates only when they act as semantic control-flow/state authority

## Remaining frontier

The next substantive work should target active scanner/lexer, graph resolver, AST/upstream mapping, analysis, and semantic type-lowering consumers. Those surfaces must be migrated through relation/fact/rule/closure/rewrite authority before being emptied.
