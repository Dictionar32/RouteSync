# Phase 3001 Changelog

- Added `InvocationSemanticRuntimeExecutorFactoryInterface` to the canonical upstream invocation judgment interface.
- Replaced exported parameterized factory `createInvocationSemanticRuntimeExecutor` with frozen interface-typed `invocationSemanticRuntimeExecutorFactory`.
- Made `ChannelKind` an actionable upstream ADT with exhaustive `continueWith(...)` and `requiresAuthentication()` operations.
- Moved public/private/presence projection out of the route lowerer primitive equality checks and into `ChannelKind.continueWith(...)`.
- Removed the active channel producer dependency on deleted relation foundation modules without restoring those modules; the duplicate `ChannelDefinition.requiresAuthentication` field was removed so channel kind remains the single semantic owner.
- Kept the executor as pure delegation to the exact individual and batch authorities.
- Updated tests to use the domain factory operation and added a focused Phase 3001 test.
- Added a repeatable structural audit and npm script.
- Traced upstream schema evidence through route lowering, CLI manifest generation, serialization, and persistence; documented that the field-by-field bridge to the separate invocation manifest remains unproven.
- Kept `core/src/types/upstream/collections.ts` empty and did not restore removed relation-foundation modules.
- Syntax check: 9 changed TypeScript files, 0 syntax diagnostics. A targeted `tsc --noEmit` attempt is blocked by existing workspace errors from missing deleted relation modules and unrelated legacy type errors; Vitest and CLI E2E remain unrun because `node_modules` is absent.
