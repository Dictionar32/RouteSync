# Phase 2189 — DTO Property Reference Binding Integration

## Trace finding

Phase 2188 retained `DtoPropertyTypeEvidence` and lexical namespace/import context in the canonical DTO AST, and Phase 2187 supplied `laravelDtoTypeReferenceBindingAuthority`. However, the existing integrated response pipeline only bound the controller response attribute's class name to a DTO declaration. It did not consume class-reference evidence on properties of that resolved DTO.

That left an ownership gap: a response DTO could be resolved while a property such as `public AccountDto $account` remained an unbound short class name.

## Changes

- The existing integrated response composition now traverses the canonical properties of each resolved response DTO.
- Every `dto_property_class_reference_type_evidence` is passed to the existing `laravelDtoTypeReferenceBindingAuthority`, using the original source name, lexical context, project identity, complete DTO inventory, and property source span.
- Each binding is retained as `LaravelDtoPropertyTypeReferenceBindingEvidence`, including the resolved owning declaration and exact canonical property.
- Property binding judgments are carried as distinct project-context evidence; DTO files are not mislabeled as controller-local source evidence.
- Any unresolved property class reference blocks integrated response completion with `response_dto_property_type_reference_unresolved` while retaining the evidence.
- The existing response authority remains the owner of response judgment. Its contract version and the existing integrated pipeline contract version are incremented.
- The existing runtime executor remains a transparent delegate. No new response authority, invocation authority, relation/foundation layer, or subscanner is introduced.

## Boundaries not claimed as complete

Property reference binding is not DTO field projection. This phase does not produce `ResponseValueContract` or `ResponseContract`, and does not claim to map arrays, unions, intersections, generics, unsupported syntax, or `mixed` into response values. Those still require the existing DTO response-value projection contract to be implemented and consumed.

## Verification

A focused regression test was added for a DTO property import alias resolving to another declaration in the same complete inventory. A static audit checks that the existing binding authority is consumed by the integrated pipeline and that unresolved binding blocks response completion. TypeScript typecheck, Vitest, and build were not run in this environment.
