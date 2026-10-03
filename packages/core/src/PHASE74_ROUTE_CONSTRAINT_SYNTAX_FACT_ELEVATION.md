# Phase 74 — Route Constraint Syntax Fact Elevation

## Goal

Keep AAT/AST extraction syntactic and move Laravel meaning into the upstream semantic resolver.

## Correct path

```text
RouteDeclarationAst
  -> extractRouteConstraintFactsFromAst()
  -> RouteConstraintFact
       method: where | whereNumber | whereAlpha | whereAlphaNumeric | whereUuid | whereUlid | whereIn
       value / values: raw syntax operands
  -> resolveRouteConstraintFlow()
  -> RouteConstraintContract
       matcher: regex | number | alpha | alpha_numeric | uuid | ulid | in
  -> RouteSemanticFlow
```

The AST adapter no longer converts `whereNumber` into `number` or `whereIn` into `in`.
That Laravel semantic interpretation belongs to the semantic resolver.

## whereIn expressions

Laravel 13 documents both literal values and enum cases:

```php
->whereIn('category', ['movie', 'song', 'painting'])
->whereIn('category', CategoryEnum::cases())
```

The parser therefore preserves a `CategoryEnum::cases()` operand as syntax text. The semantic resolver recognizes that expression and creates the semantic `enum_cases` allowed-value ADT.

## Downstream contract

`RouteSemanticFlow` remains AST-free and only composes already-resolved semantic contracts. No Laravel method names or PHP expression syntax are required downstream.
