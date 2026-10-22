# Phase 2199 — Upstream DTO Authority Dependency Closure

## Root cause

Phase 2198 exposed DTO declaration and DTO type-reference authorities through the integrated response dependency contract, but those authorities still captured concrete singleton dependencies internally. That meant the outer pipeline could select a DTO binding authority while the binding authority silently used a different class-name resolver or declaration resolver. The declaration resolver likewise captured the module-level source-identity singleton.

## Interface-first correction

- Added `dependencies` to the existing `LaravelControllerResponseDtoDeclarationResolutionAuthorityInterface`; its source-project comparison now uses the injected `LaravelSourceIdentitySemanticsInterface`.
- Added `dependencies` to the existing `LaravelDtoTypeReferenceBindingAuthorityInterface`; its class-name and declaration resolution now use the exact authorities in that dependency contract.
- Added factories to construct those existing authorities with explicit dependencies while preserving default composition exports for existing consumers.
- Removed duplicate class-name and DTO-declaration authority slots from `LaravelControllerResponseSemanticPipelineDependenciesInterface`. Integrated response resolves response attributes through the same class-name/declaration authorities owned by `dtoTypeReferenceBindingAuthority.dependencies`.
- Removed hidden default source-identity and DTO type-binding selections from internal integrated-pipeline helpers; production callers now supply the selected dependency explicitly.
- Routed the `Sequence` type dependency through its existing upstream `collections` owner rather than importing it directly from `semantic/relations`.
- Composition root binds DTO declaration resolution to the same source-identity semantics instance used by the response semantic authority, and binds the DTO type-reference authority to the selected class-name and declaration authorities.
- Increased the response pipeline contract to version 29, DTO declaration resolution contract to version 4, and DTO type-reference binding contract/runtime executor to version 2.
- Added focused tests for dependency graph coherence and absence of duplicate top-level authority slots.

## Remaining gaps (not claimed closed)

- The DTO declaration result is still associated back to a method response attribute through source-span matching in `projectDtoResponseContracts`. The next upstream improvement should make method ownership part of the declaration-request provenance contract rather than reconstructing the association by lookup.
- The default composition exports remain for compatibility. The production integrated pipeline now consumes the selected dependency graph, but all direct legacy consumers still need a separate call-site audit.
- Full typecheck, Vitest, and package build were not run in this phase.

## Architecture constraint

No `relation`, `foundation`, or subscanner authority layer was introduced. This change evolves existing upstream interfaces and their composition; it does not relocate semantic reasoning to a new file.
