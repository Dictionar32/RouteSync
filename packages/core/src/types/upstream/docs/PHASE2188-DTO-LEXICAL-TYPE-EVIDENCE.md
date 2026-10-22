# Phase 2188 — DTO lexical type evidence

## Trace finding

The DTO declaration parser previously accepted only a single token for a property type. Class references were projected directly into `TypeExpression.reference` using a short name, while namespace/import context was discarded. Namespaced references such as `App\\Models\\User`, import aliases, and fully-qualified names could not be represented as binding-ready evidence. Union syntax could also be mistaken for a class-like name if token boundaries were not closed.

## Interface-first change

`ResponseDtoPropertyAst` now retains `ResponseDtoPropertyTypeEvidence` alongside the existing canonical `TypeExpression`:

- `php_primitive_property_type` retains supported primitive evidence;
- `php_mixed_property_type` keeps `mixed` explicit;
- `php_class_reference_property_type` retains the source class name, exact lexical context and source token;
- `php_unsupported_property_type_syntax` prevents unsupported syntax from being promoted to a guessed class reference.

The existing `TypeExpression` remains the downstream vocabulary. The new evidence is not a competing type algebra; it preserves the lexical inputs required by the existing PHP class-name authority and DTO binding authority.

## Lexical context ownership

Namespace/import context extraction was consolidated into `lexer/phpClassNameContextParser.ts` and is shared by the existing controller declaration parser and DTO declaration parser. This avoids creating a second interpretation of PHP imports for DTO properties. The helper produces the existing upstream `PhpClassNameResolutionContext`; it does not resolve class identity itself.

## Scope and remaining integration

This phase does not yet invoke `laravelDtoTypeReferenceBindingAuthority` for every DTO property. That authority must be wired only after the complete DTO declaration inventory exists, so bindings can be project-correlated and ambiguity can be judged against the whole inventory. DTO-to-`ResponseValueContract` projection and integrated response consumption remain downstream obligations.

## Verification

A focused regression test covers import aliases, fully-qualified references, nullable references, and unsupported union syntax. Static audit checks the evidence ADT, shared lexical context parser, DTO AST retention, and the absence of a new subscanner/relation/foundation layer. Typecheck, Vitest, and build must still be run in a supported project environment.
