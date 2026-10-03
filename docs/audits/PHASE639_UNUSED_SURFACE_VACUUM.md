# Phase 639 — Unused Surface Vacuum

## Scope
Conservative unused-surface vacuum following the RouteSync rule: unused files are **emptied, never deleted**.

## Change
- `packages/cli/src/generators/CompilerBridge.ts.backup` was a non-empty backup artifact with no active repository references.
- The file was truncated to 0 bytes.
- The path is preserved.

## Safety boundary
Active compatibility/resolution files were not vacuumed merely because their names contain `legacy`; they remain in the import graph.
Source-language vocabulary (`null`, `??`, ternary, route `any`, etc.) is not treated as dead host-language implementation solely by token matching.

## Research basis
MLIR canonicalization iteratively applies rewrite patterns until a fixpoint (or bounded rewrite limit), and declarative rewrite rules express the essence of a transformation without host-language boilerplate. Souffle computes mutually recursive relation SCCs together until a fixpoint. Egglog combines equality saturation with Datalog-style relations/rules.

## Validation
- backup artifact: 0 bytes
- no file deletion performed
