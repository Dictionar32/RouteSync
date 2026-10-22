# Phase2173 — Interface-First Positive DTO Judgment Closure

## Scope

This phase changes upstream type contracts only. It does not wire the Laravel scanner, add a subscanner, or move semantic reasoning into runtime.

## Defect found

The previous `response_dto_declaration_resolved` variant accepted the broad `LaravelDtoDeclarationSourceEvidence` type. That type permits `classIdentity: dto_class_identity_unresolved`, so a nominally positive resolution judgment could still carry unresolved class identity. The same positive branch also accepted an incomplete inventory or blocked requested class-name resolution through its broad request type.

## Contract correction

- `LaravelDtoDeclarationResolvedSourceEvidence` narrows declaration evidence to `dto_class_identity_resolved`.
- `LaravelControllerResponseDtoDeclarationResolvedInput` requires a complete inventory and a `php_class_name_resolved` request.
- Both `resolved` and `ambiguous` outcomes require that narrowed input and resolved declaration evidence.
- `unresolved` continues to retain the broad input so incomplete inventory and blocked lexical resolution remain explicit outcomes.

## Architectural boundary

The DTO declaration judgment remains separate from `ResponseContract` production. Existing invocation semantic ownership is unchanged. The response runtime executor remains a delegate and must forward the authority's exact closed judgment. No `relation`, `foundation`, or new subscanner layer was introduced.

## Trace status

The interface now excludes three invalid positive states at the type level: unresolved declaration identity, incomplete discovery inventory, and unresolved requested class identity. The producer and integrated response pipeline have not yet been migrated to emit/consume this narrowed judgment. No build or typecheck was run.
