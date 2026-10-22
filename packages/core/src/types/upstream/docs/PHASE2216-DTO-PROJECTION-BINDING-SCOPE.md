# Phase 2216 — DTO Projection Binding Scope

## Trace finding

The integrated response pipeline already owns DTO declaration resolution, class-reference property binding, and DTO-to-`ResponseContract` projection. During projection it supplied the full project-context property-binding inventory to each resolved response DTO projection request. The existing projection authority defensively filtered bindings again by the exact `ownerDeclaration` and `property` identity, so unrelated bindings were not currently used to produce a field. However, the upstream call boundary still passed cross-declaration evidence into each projection request and relied on the downstream implementation to filter it.

## Change

`projectDtoResponseContracts` now scopes `propertyTypeReferenceBindings` to bindings whose `ownerDeclaration` is the exact resolved declaration for the projection request before calling the existing `LaravelDtoResponseContractProjectionAuthorityInterface`.

The existing `LaravelControllerResponseSemanticPipelineContract` now explicitly declares `dtoProjectionBindingScopeRule`. Pipeline contract version advances from 30 to 31 across interface, runtime factory, and contract. The existing phase-2212 regression test is updated to the current pipeline and action-contract versions.

## Authority boundary

- `LaravelDtoTypeReferenceBindingAuthorityInterface` remains the owner of property-reference binding judgments.
- `LaravelDtoResponseContractProjectionAuthorityInterface` remains the owner of DTO-to-`ResponseContract` judgment.
- `LaravelControllerResponseSemanticPipelineInterface` owns composition and scoping of each projection's inputs.
- The scanner and runtime executor do not classify DTO properties or reconstruct response meaning.

No new authority, `semantic/foundation`, replacement relation layer, or subscanner is added.

## Remaining gaps

- `scanControllerAction` / `resolveControllerActionContract` remain active in the legacy action path.
- Action-level response compatibility projection still needs exact method/source correlation and parity tests before the legacy response descriptor can be retired.
- Resource-binding publication still crosses the legacy action adapter.
- Channel client-subscription evidence and `semantic/relations` call-site closure remain open.
- Full typecheck, full Vitest, and package build are not claimed by this phase.
