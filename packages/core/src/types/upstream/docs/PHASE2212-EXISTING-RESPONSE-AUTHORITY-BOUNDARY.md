# Phase 2212 — Existing Response Authority Boundary

## Trace result

The previous action-judgment obligation named `upstream_response_descriptor_semantic_judgment` as the target owner. That target implied a new/parallel descriptor authority even though the repository already has `LaravelControllerResponseSemanticPipelineInterface`, `LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface`, and `LaravelDtoResponseContractProjectionAuthorityInterface`.

The production path still calls `resolveControllerActionContract()` and `resolveResponseAttributeAst()`. That resolver still resolves DTO files through filesystem/name fallback, reads declarations, and merges observed return fields. The integrated response pipeline separately resolves the attribute's qualified DTO identity from the closed project inventory, binds DTO property class references, and projects resolved declarations into `ResponseContract` judgments. Those are distinct products and cannot be silently treated as a completed compatibility `ResponseDescriptor`.

## Change

- Evolved `LaravelControllerActionDerivationOwnershipObligation` to target `existing_laravel_controller_response_semantic_pipeline`.
- Named the existing semantic owner explicitly as `LaravelControllerResponseSemanticPipelineInterface`.
- Declared the required existing products: `response_dto_declaration_resolution_judgment` and `response_dto_contract_projection_judgment`.
- Marked the legacy descriptor as a compatibility projection, not response semantic authority.
- Advanced the existing action judgment contract to version 23 and synchronized the composition-root contract.
- Added regression checks to prevent a future contract from proposing a duplicate response-descriptor authority.

## Still open

This phase does **not** retire `resolveResponseAttributeAst()` or claim DTO descriptor parity. The existing pipeline's source-correlated DTO judgments are available, but the legacy action descriptor path still executes before/alongside integrated response composition. The next implementation must establish an explicit projection from the existing closed response products to any compatibility descriptor consumers need, preserve the exact method/DTO ownership correlation, and prove parity before removing the legacy resolver.

Other traced gaps remain unchanged: `scanControllerAction()` is still the action production path; resource-binding publication still crosses the legacy action adapter; channel classification still lacks authoritative client-subscription evidence; and `semantic/relations` uses remain for call-by-call tracing. No `semantic/foundation`, replacement relation layer, parallel response authority, or new subscanner was introduced.

## Validation scope

Regression tests were added but Vitest/full typecheck/package build were not run in this environment. Syntax transpilation, structural assertions, and ZIP integrity are checked separately; these do not substitute for the full test suite.
