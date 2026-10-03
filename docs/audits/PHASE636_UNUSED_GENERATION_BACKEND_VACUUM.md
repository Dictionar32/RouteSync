# Phase 636 — Unused SDK Generation Backend Vacuum

## Scope

The legacy second SDK generation backend documented as unused was vacuumed without deleting its file paths.

The current compiler generation path is owned by `@routesync/cli`; the SDK package remains the runtime DSL. The old SDK generator/emitter backend is not called by the active `scan`/`sync` path and is explicitly documented as unused in the repository architecture/backlog.

## Vacuumed paths

- `packages/sdk/src/generator.ts`
- `packages/sdk/src/generator/index.ts`
- `packages/sdk/src/generator/routeModuleBuilder.ts`
- `packages/sdk/src/generator/zodEmitter.ts`
- `packages/sdk/src/generator/reactQueryEmitter.ts`
- `packages/sdk/src/emitter/TSPrinter.ts`
- `packages/sdk/src/emitter/ZodToTSEmitIR.ts`
- `packages/sdk/src/emitter/zod-converter/moduleConverter.ts`
- `packages/sdk/src/emitter/zod-converter/astToZodCode.ts`
- `packages/sdk/src/emitter/zod-converter/types.ts`
- `packages/sdk/src/emitter/zod-converter/index.ts`

All paths remain present and are exactly 0 bytes.

The corresponding obsolete public exports were removed from `packages/sdk/src/index.ts` so empty modules are not part of the active SDK surface.

## Safety boundary

This vacuum is intentionally limited to the generation backend. Runtime SDK modules (`defineApi`, endpoint/resource/service runtime, client, hooks, mappers, schema) remain intact.

No source-language Laravel/PHP vocabulary was removed merely because it contains words such as `any`, `null`, or `??`; those can be legitimate source evidence. The semantic-authority cleanup remains a separate relational migration.

## Research basis

The next architecture frontier follows declarative rewrite and canonicalization systems: MLIR's canonicalizer repeatedly applies registered patterns toward fixpoint, while declarative rewrite rules describe the transformation without imperative boilerplate. K defines executable semantics through configurations and rewrite rules. These principles support keeping RouteSync semantic authority in relations and rewrite rules rather than duplicate host-language generation backends.
