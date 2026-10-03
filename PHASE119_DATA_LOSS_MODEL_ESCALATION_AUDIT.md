# Phase 119 — Data-Loss / Syntax-Model Escalation Audit

## Scope

Audit lanjutan terhadap `routeAst` untuk memastikan pengetahuan sintaks Laravel tidak disimpan sebagai positional control flow, serta memastikan absence/fallback tidak menghapus data.

## Implemented

- Removed the remaining conditional expressions from `TokenCursor` and resource parser.
- Encapsulated continuation and delimiter-closing selection as navigation policies.
- Encapsulated cursor presence selection as a syntax-navigation relation helper.
- Removed numeric tuple indexing from group-fact merging.
- Fixed group pending-state data loss: an absent group fact no longer overwrites an already accumulated `prefix`, `namePrefix`, `controller`, `domain`, or `bindingScope` with `undefined`.
- Group constraints remain append-only and preserve `method`, `parameter`, `value`, and all `values`.
- `routeSyntaxModel` remains declarative: no `if`, `while`, `switch`, or conditional expression.

## Static audit results

AST-based scan of `packages/core/src/compiler/scanner/lexer/routeAst`:

- Nullish coalescing (`??`): 0
- Conditional expressions / ternary: 0
- `switch`: 0
- Numeric `[0]` / `[1]` outside navigation primitives: 0
- `indexOf`: 0
- `findIndex`: 0
- Negative `slice` stack manipulation outside model boundary: 0
- Positional `+/-` arithmetic outside navigation primitives: 0
- `null` literals: 0
- Temporary / backup files: 0
- TypeScript transpile of all routeAst files: PASS

`===` / `!==` remain where they express token/state identity or structural presence. They are not used as a positional-navigation mechanism and are therefore not mechanically replaced.

## Remaining control flow

Remaining `if`/`while` occurrences are confined to:

- `TokenCursor`: primitive traversal and delimiter/span scanning.
- `delimiterNavigation`: delimiter-state transition validation.
- `SyntaxRange`: generic bounded traversal.
- `routeDeclarationParser` / `routeResourceDeclarationParser`: structural guards and the generic top-level scanning engine.

These constructs do not encode Laravel method semantics, argument positions, or route-group meaning. Domain knowledge is represented upstream as catalogs, strategies, facts, policies, and transition models.

## External architecture check

Tree-sitter recommends named fields and named-node navigation rather than relying on ordered child positions. Its traversal API separates navigation from syntax structure. Laravel 13 documents nested route-group merging for middleware and `where` conditions and documents route constraints such as `whereIn`. The RouteSync syntax model follows the same separation: navigation owns position; syntax facts own meaning.
