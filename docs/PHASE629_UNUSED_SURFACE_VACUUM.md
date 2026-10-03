# Phase 629 — Unused Surface Vacuum / Legacy CLI Resolver Boundary

Policy: preserve unused file paths; empty implementation instead of deleting files.

## Confirmed dead surface

The legacy CLI resolver kernel/plugin tree under `packages/cli/src/resolvers/` is not part of the active semantic resolution path. The active path imports `SemanticResolutionKernel` from `@routesync/core`; `packages/cli/src/commands/generate.ts` retains only the active `IntentResolver` dependency from this directory.

The following 17 files were therefore emptied, not deleted:

- `packages/cli/src/resolvers/SemanticResolutionKernel.ts`
- `packages/cli/src/resolvers/index.ts`
- `packages/cli/src/resolvers/types.ts`
- `packages/cli/src/resolvers/plugins/AccessorResolver.ts`
- `packages/cli/src/resolvers/plugins/ExpressionResolver.ts`
- `packages/cli/src/resolvers/plugins/FrameworkRegistryResolver.ts`
- `packages/cli/src/resolvers/plugins/MethodReturnResolver.ts`
- `packages/cli/src/resolvers/plugins/ModelColumnResolver.ts`
- `packages/cli/src/resolvers/plugins/PrimitiveResolver.ts`
- `packages/cli/src/resolvers/plugins/ResourceGraphResolver.ts`
- `packages/cli/src/resolvers/plugins/expression/index.ts`
- `packages/cli/src/resolvers/plugins/expression/literalHandler.ts`
- `packages/cli/src/resolvers/plugins/expression/propertyAccessHandler.ts`
- `packages/cli/src/resolvers/plugins/expression/variableHandler.ts`
- `packages/cli/src/resolvers/plugins/method-return/index.ts`
- `packages/cli/src/resolvers/plugins/method-return/methodCallHandler.ts`
- `packages/cli/src/resolvers/plugins/method-return/resolvedMethodHandler.ts`

The active `IntentResolver.ts` and its `intent/` subtree were preserved because `packages/cli/src/commands/generate.ts` imports them.

## Architectural consequence

This removes a duplicate resolver authority instead of rewriting it procedurally. The canonical semantic resolver remains in `packages/core/src/semantic/**` and its kernel. Future resolver work should move toward:

`scanner facts -> AST/upstream relations -> resolver constraints -> recursive closure/fixed point -> semantic witness -> rewrite/canonical form -> type lowering -> projection`.

## Research basis

MLIR's Dialect Conversion separates conversion targets, rewrite patterns, and optional type conversion; its canonicalizer repeatedly applies patterns toward a fixpoint. Declarative Rewrite Rules and PDLL provide declarative pattern specifications rather than hand-written dispatch boilerplate. Ascent provides Datalog-style logic programs and fixed-point execution.
