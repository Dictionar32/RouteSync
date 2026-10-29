# Phase 3055 Changelog

- Moved canonical semantic data-flow validation into `core/src/types/upstream/semanticDataflowKnowledgeValidation.ts`.
- Added explicit validation operation interface and closed outcome/violation ADTs.
- Replaced validator identity string-key matching with typed `KnowledgeId` identity witnesses and `semanticKnowledgeIdOperations.same`.
- Kept scanner-only closure/relation projection fields in the PHP compatibility facade without copying them into upstream canonical types.
- Added audit script `audit:phase3055-upstream-validation-domain-ownership`.
- Confirmed upstream module strict typecheck and phase regression audits.
- Remaining frontend dependency-closure TypeScript failures and unrun E2E tests are documented in the phase audit; no claim of full runtime cleanliness.
