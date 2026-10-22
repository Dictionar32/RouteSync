# Phase 2169 — Interface-first DTO declaration judgment

## Interface review before wiring

Phase 2168 correctly propagates the existing `DtoAst` inventory through the Laravel controller scanner and integrated-response evidence production. That proves transport and ownership, not semantic resolution. The response pipeline explicitly still lacks `resolved_response_attribute_descriptor` and `response_dto_declaration` evidence.

## New upstream contract

`laravelControllerResponseDtoDeclarationInterface.ts` defines a project-scoped DTO inventory, the resolution request, and a closed judgment ADT:

- `response_dto_declaration_resolved`: exactly one typed declaration and its source identity are retained;
- `response_dto_declaration_unresolved`: project mismatch, absent declaration, or incomplete inventory remains explicit;
- `response_dto_declaration_ambiguous`: two or more candidates remain ambiguous rather than selecting by filename or short name.

The contract deliberately does not manufacture `ResponseContract`. Resolving a declaration and deriving its response-field semantics are separate judgments with different evidence requirements.

## Trace and ownership boundaries

`scanDtoAsts` currently returns `readonly DtoAst[]` without a project-scoped completeness witness. `laravelSourceAstPipeline.ts` supplies that array to the controller scan, and the existing integrated response carries it as context. The current evidence producer still reports the DTO declaration and resolved response descriptor as missing. Therefore the next wiring step must first upgrade the DTO inventory producer to issue the typed project-scoped inventory; it must not fabricate the witness at the controller call site.

Invocation semantics remain owned by the existing upstream invocation judgment/inventory authorities. The invocation runtime executor remains a delegate. The integrated response must preserve the invocation judgment and distinguish `not_connected`, source-binding rejection, blocked, and complete outcomes. CLI composition remains discovery/wiring/projection only.

## Explicit non-goals

- No new relation/foundation layer.
- No new response subscanner.
- No parallel semantic authority that duplicates the existing response judgment authority.
- No removal of the legacy response derivation before the new declaration and descriptor evidence is actually produced and consumed.
- No claim of successful build/typecheck/test from this interface-only change.

## Required next sequence

1. Give the existing DTO scan output a project-bound inventory receipt and uniqueness/completeness judgment.
2. Implement the declaration-resolution authority against that receipt, using typed `ClassName` identity and exact source provenance.
3. Derive response contract fields from the resolved `DtoAst` through the existing response semantic contract.
4. Add `response_dto_declaration` and `resolved_response_attribute_descriptor` to the existing response evidence producer, preserving unresolved/ambiguous outcomes.
5. Wire the existing integrated response authority and runtime executor to consume that judgment without reclassification.
6. Retire legacy response derivation only after coverage and parity tests prove the new path is complete.
