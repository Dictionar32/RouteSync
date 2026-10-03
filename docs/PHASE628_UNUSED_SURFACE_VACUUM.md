# Phase 628 — Unused Surface Vacuum

## Policy

Unused files are **preserved as paths and emptied**, never deleted.

## Evidence

The following production TypeScript files had no production consumer/reference after excluding tests and self-reference. No path export/import reference was found in `packages` for their basenames.

- `packages/cli/src/parsers/OpenApiParser.ts`
- `packages/cli/src/parsers/PHPRouteParser.ts`
- `packages/cli/src/parsers/php/ast/offsetCatamorphism.ts`
- `packages/core/src/compiler/domain/common/ArtifactContract.ts`
- `packages/core/src/compiler/ir/StructuredContractIRBuilder.ts`
- `packages/core/src/compiler/ir/StructuredResponseIRBuilder.ts`
- `packages/core/src/compiler/scanner/descriptors/route/routeResponses.ts`
- `packages/core/src/types/semantic/parsedAstTypes.ts`
- `packages/core/src/types/upstream/routeBindingResolution.ts`
- `packages/core/src/types/upstream/routeMissing.ts`

## Architecture direction

This vacuum is only dead-surface removal. Active semantic authority remains subject to migration toward:

`source facts -> semantic relations -> constraints -> recursive closure/fixed point -> solver/rewrite -> lowering -> projection`

The cleanup must not erase source-language AST vocabulary such as PHP `null`, `??`, ternary, or source-level `any` when those are semantic facts rather than host-language implementation mechanisms.
