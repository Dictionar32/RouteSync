# Phase 3068 changelog

- Removed `PhpSourceInvocationSemanticPipelineHandlers<Result>` and `continueWith<Result>` from the whole-file PHP semantic pipeline result ADT.
- Added producer-owned `integrateWithControllerSourceBinding(sourceBinding)` operation for complete and blocked results.
- Moved complete/blocked integration outcome construction to the producer authority.
- Migrated the integration consumer to the domain operation.
- Replaced source-binding continuation with `toPipelineCompositionEvidence()` and composition-evidence continuation with `toControllerInvocationIntegrationResult()`.
- Preserved the exact pipeline result, source binding, source identity judgment, and invocation batch.
- Added Phase 3068 audit and npm script; Phase 3067 and Phase 3062 regression audits are chained.
- Did not restore deleted relation foundation modules or alter the protected one-byte `collections.ts` file.
