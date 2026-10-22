# Phase 2187 — DTO Type Reference Binding

## Trace finding

`TypeExpression.reference` retains a `ClassName`, while DTO declaration resolution already owns canonical PHP class-name and project declaration judgments. Without a composition boundary, consumers can accidentally promote a short class spelling into `ResponseValueContract.named_type` without proving which declaration it denotes.

## Interface-first repair

`LaravelDtoTypeReferenceBindingInterface` describes the closed binding boundary. The authority implementation composes, rather than duplicates, the existing `phpClassNameResolutionAuthority` and `laravelControllerResponseDtoDeclarationResolutionAuthority`.

A positive binding requires both lexical class-name resolution and exactly one canonical declaration in the same source project. Missing lexical context, unresolved declaration, and ambiguity remain explicit unresolved judgments. Every result retains the original property-type source span.

## Boundary

A bound reference is not itself a response value or a response contract. The next stage must consume the bound declaration and then prove a faithful `ResponseValueContract`; unsupported, union, nullable, array, and generic semantics must not be guessed. No new relation/foundation layer or subscanner was introduced. The existing integrated response and invocation semantic authorities remain the owners of their domains.

## Verification

Two regression tests cover alias-to-canonical binding and missing lexical context. They are added but were not executed in this environment. Build and TypeScript typecheck were not run.
