# Phase 3014 Changelog

- Added `unprovenPositionalEvidenceFor` to `InvocationSemanticKnowledgeAlgebraOperationsInterface` as an explicitly typed domain operation.
- Converted the old standalone exported `invocationPositionalEvidenceUnproven` callable into a private implementation owned by `invocationSemanticKnowledgeAlgebraOperations`.
- Migrated the invocation judgment authority and focused upstream / route-AST tests to call the named operation.
- Kept the batch algebra implementation local to its owner; it calls the private implementation directly instead of dispatching through its public facade.
- Structural audit: 12/12 passed.
- TypeScript syntax transpilation: 5 files, 0 syntax diagnostics.
- Targeted strict TypeScript check for the three production modules passed with exit code 0.
- Unit tests and Laravel CLI end-to-end were not run.
- Preserved whitespace-only `collections.ts`; deleted relation foundation modules remain absent.
