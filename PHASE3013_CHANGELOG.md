# Phase 3013 Changelog

- Added `InvocationSemanticKnowledgeAlgebraOperationsInterface` with explicit `analyze`, `analyzeOne`, `callTargetsFor`, and `parameterFlowsFor` operations.
- Replaced bare exported invocation-algebra/projection callables with the typed frozen `invocationSemanticKnowledgeAlgebraOperations` object.
- Migrated the invocation authority to delegate through that object.
- Removed legacy callable aliases from the scanner-facing interprocedural semantic facade.
- Migrated focused route-AST and upstream algebra test call sites to named authority/operation methods.
- Added the operation interface type to the upstream type barrel.
- Structural audit: 16/16 passed. Syntax transpilation: 8 files, 0 diagnostics.
- Typecheck still reports baseline semantic-model typing errors; tests and CLI/Laravel E2E were not run.
- Preserved whitespace-only `collections.ts` and kept deleted relation foundation modules absent.
