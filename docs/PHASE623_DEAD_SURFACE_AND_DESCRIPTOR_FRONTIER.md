# Phase 623 — Dead Surface + Descriptor Frontier Vacuum

## Scope

This phase uses dependency/consumer evidence rather than textual token deletion.

### Removed unconsumed surfaces

- `packages/cli/src/generators/response-analysis-helper.ts`
- `packages/cli/src/generators/semantic/context/manifestNormalizer.ts`
- `packages/cli/src/generators/semantic/resource-field/fieldMapBuilder.ts`
- `packages/core/src/compiler/generators/contract-generation/ResponseStructureBuilder.ts`
- `packages/core/src/types/domain/routeEntityDescriptor.ts`
- `packages/core/src/types/domain/modelEntityDescriptor.ts`
- `packages/cli/src/generators/utils/RouteEndpointDescriptor.ts`
- `packages/cli/src/generators/utils/RoutePathDescriptor.ts`
- `packages/cli/src/generators/utils/ManifestDescriptor.ts`

Tests whose only purpose was exercising those deleted legacy surfaces were removed as well.

## Semantic rule

A PHP/Laravel token such as `??`, `null`, `ternary`, or `any` is retained when it is source-language vocabulary or AST data. The target of this phase is host-language implementation authority: branching, mutable lookup state, legacy descriptor construction, and dead compatibility surfaces.

The intended architecture remains:

Laravel source → AST facts → semantic relations → constraints → recursive closure/fixed point → rewrite/lowering → Next.js projection.

## Verification

- No direct references remain to the deleted files/symbols checked by this phase.
- Production `class *Descriptor` count is reduced, but descriptor elimination is not complete.
- Global TypeScript compilation remains blocked by missing ambient definitions for `node` and `vitest/globals` in the workspace environment.
