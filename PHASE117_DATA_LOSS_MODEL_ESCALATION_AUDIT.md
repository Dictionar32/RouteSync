# Phase 117 — Data-loss / model-escalation audit

## Scope

This phase continues from Phase 116. The audit targets:

- `??`, nullish fallback, and accidental absence-to-value conversion;
- positional arithmetic and token indices such as `i + 1`, `i + 123`, `[0]`, `[1]`;
- `indexOf` / `findIndex` as positional knowledge;
- `slice(..., -1)` and equivalent stack/index manipulation outside the intended navigation boundary;
- ternary expressions that encode Laravel syntax meaning;
- `if` / `switch` / `while` that store syntax/domain knowledge instead of executing generic traversal;
- data-loss caused by first-element selection or replacement instead of accumulation.

## Model escalation

`routeSyntaxModel.ts` was tightened again:

- group constraint extraction is selected by a declarative constraint-policy catalog;
- group pending facts are selected through a strategy catalog instead of semantic branching;
- route invocation recognition is represented as a typed syntax relation;
- route-group transitions remain a declarative operation catalog (`push`, `pop`, `retain`);
- constraint accumulation remains append-only;
- route method/resource/middleware/constraint vocabularies remain catalogs rather than parser branches.

## Traversal boundary

Token positional arithmetic remains confined to `TokenCursor`. Delimiter stack transitions remain confined to `delimiterNavigation`. `SyntaxRange` owns bounded traversal loops. Consumer parsers do not calculate token positions.

The remaining `while` loops in `TokenCursor` and `SyntaxRange` are traversal mechanics. The remaining top-level parser loop is generic source scanning. They are not repositories of Laravel semantic knowledge.

## Audit result

Targeted scan of `routeAst`:

- nullish coalescing `??`: 0
- positional `[0]` / `[1]`: 0
- `indexOf` / `findIndex`: 0
- raw `+1/+2/+123` token arithmetic outside navigation: 0
- `at(0/-1)` outside navigation: 0
- semantic ternary in `routeSyntaxModel`: 0
- `if` / `switch` in `routeSyntaxModel`: 0
- `while` in `routeSyntaxModel`: 0
- TypeScript transpilation of `routeAst`: PASS

Optional TypeScript syntax (`foo?: T`, optional chaining `foo?.bar`) and the `?` inside the route-binding regex are not nullish operators and are therefore not data-loss findings.

## External architecture check

Tree-sitter explicitly recommends named fields instead of positional child access and exposes named navigation relations. Laravel 13 documents nested route groups as merged attributes and resource middleware as action-scoped declarations. The current model follows those principles by keeping semantic relations in typed facts/catalogs and traversal mechanics in navigation primitives.
