# Phase 655 — AST SSOT Judgment ADT and semantic frontier

## Objective

Elevate the AST interface from a parameterized semantic wrapper to a **closed AST judgment algebra** that is the single source of truth for canonical AST semantics.

## Model

`AstJudgment` is now the closed union over `AstSemanticSchemaKind`. `SemanticAstNode<K>` and `CanonicalAstNode<K>` are narrowing projections over that union, not separate semantic schemas.

Every judgment carries the same explicit facets:

- identity
- semantic term
- source evidence
- provenance
- constraints
- dependencies
- semantic relations
- derivation/proof
- resolution status
- diagnostics

This makes syntax failure, ambiguity, derivation and semantic dependencies first-class data rather than host-language control paths.

## Parser adapter elevation

`parsePhpMethodOrThrow` was removed. `parsePhpMethod` remains an option-valued parser relation, and the anonymous-class classifier consumes the relation through `relationOptionFold`. Parser failure therefore remains a relation result instead of an exception-based semantic path.

## Research trace

The model follows several established ideas without copying any one system: MLIR PDLL provides declarative matching/rewrite patterns; MLIR canonicalization applies rewrite patterns iteratively toward a fixpoint and requires semantic preservation; CRAG combines reference attributes with circular fixed-point evaluation; Tree-sitter supplies concrete syntax evidence rather than serving as the semantic model. citeturn0search2turn0search6turn0search0

Laravel remains the source ecosystem. Its routing model supplies route groups, controllers, middleware, model binding and related route semantics that RouteSync should capture as source facts before semantic closure and target projection.

## Remaining frontier

The largest lexical/architectural frontier remains scanner/resolver construction, especially:

1. resource route-group classification
2. resource binding traversal/origin/path
3. request raw-type conversion
4. controller error detection
5. model descriptor construction
6. route security
7. field assembly
8. AST syntax evidence
9. AST/upstream expression canonicalization
10. semantic type lowering

Lexical counts are diagnostic only. PHP syntax such as ternary/coalesce/`if`/`switch` is retained as source evidence. The prohibition is against using host TypeScript control flow, host absence, collections or casts as the semantic authority.
