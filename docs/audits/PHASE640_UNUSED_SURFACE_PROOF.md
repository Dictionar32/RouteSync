# Phase 640 — Unused Surface Proof / Conservative Vacuum

## Scope

Production TypeScript surface under `packages/**` was checked for non-empty backup/legacy/debug/scratch artifacts and for import reachability. Existing zero-byte compatibility paths remain preserved; no source path is deleted.

## Result

No additional non-empty production file was proven dead strongly enough to vacuum in this phase.

Already-vacuumed paths verified at 0 bytes:

- `packages/cli/src/generators/CompilerBridge.ts.backup`
- `packages/core/src/types/upstream/response.ts.before-interface-response`
- `packages/sdk/test-resolve-reviews.ts`
- `packages/sdk/src/generator/index.ts`
- `packages/sdk/src/generator/reactQueryEmitter.ts`
- `packages/sdk/src/generator/routeModuleBuilder.ts`
- `packages/sdk/src/generator/zodEmitter.ts`
- `packages/sdk/src/emitter/TSPrinter.ts`
- `packages/sdk/src/emitter/ZodToTSEmitIR.ts`
- `packages/sdk/src/emitter/zod-converter/astToZodCode.ts`
- `packages/sdk/src/emitter/zod-converter/index.ts`
- `packages/sdk/src/emitter/zod-converter/moduleConverter.ts`
- `packages/sdk/src/emitter/zod-converter/types.ts`

`legacyResolver.ts` and `legacyConverter.ts` were deliberately retained because active import/use chains exist.

## Architecture frontier

Dead-surface vacuum is separated from semantic migration. Active scanner/lexer, AST/upstream, graph resolver, analysis, and semantic type lowering must be transformed rather than emptied unless their authority is demonstrably replaced and their old path becomes unreachable.

Target architecture:

source evidence → relations → constraints → recursive closure/fixed point → witness/provenance → rewrite rules → canonical Route IR → target dialect lowering → Next.js.

## Research basis

MLIR canonicalization applies registered rewrite patterns iteratively to a fixpoint or bounded rewrite limit; its pattern infrastructure is also used for conversion and transformation. MLIR declarative rewrites specify source patterns, constraints, and result patterns separately from generated implementation boilerplate.

Soufflé computes mutually recursive relation SCCs to a fixpoint. egglog combines equality-saturation rewrites with Datalog-style relations and e-class analyses.

## Verification

- No file deletion performed.
- Existing zero-byte legacy/backup surfaces remain paths in the tree.
- No new production dead file was emptied without evidence.
