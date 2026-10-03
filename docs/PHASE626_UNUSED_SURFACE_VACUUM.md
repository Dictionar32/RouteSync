# Phase 626 — Unused Surface Vacuum

This phase preserves legacy file paths and empties only production TypeScript files that were verified to have no production consumer/import authority in the active workspace.

Reference direction: declarative semantic relations, recursive/fixed-point evaluation, pattern rewriting, canonicalization, and explicit lowering. MLIR's dialect conversion separates conversion targets, rewrite patterns, and optional type conversion; its canonicalizer iterates patterns toward a fixpoint. Ascent exposes Datalog-style rules and fixed-point execution.

## Emptied production files

- `packages/cli/src/generators/TypeScriptWriter.ts`
- `packages/cli/src/generators/semantic/FieldTypeMapper.ts`
- `packages/core/src/types/semantic/parsedAstAlgebra.ts`
- `packages/core/src/types/upstream/routeResource.ts`
- `packages/core/src/compiler/contracts.ts`
- `packages/core/src/compiler/formatting/typescript/TSFormatter.ts`
- `packages/core/src/compiler/emitters/typescript/TypeScriptEmitter.ts`
- `packages/core/src/compiler/domain/common/ResourceFieldFlattener.ts`
- `packages/core/src/compiler/domain/common/ResponseFieldFlattener.ts`

## Policy

- No production file was deleted.
- Each listed path remains present and is zero bytes.
- Source-language vocabulary such as PHP `null`, `??`, ternary, or Laravel `any` remains valid when it is part of the source AST/domain vocabulary. The cleanup targets host-language implementation authority, not source syntax.
- Active scanner/lexer, resolver graph, AST/upstream mapping, analysis, and semantic type-lowering surfaces are not emptied merely because they contain prohibited host constructs; they require consumer/authority migration first.
