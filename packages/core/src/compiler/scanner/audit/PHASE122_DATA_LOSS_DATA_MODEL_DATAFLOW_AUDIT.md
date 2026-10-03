# Phase 122 — Data-loss / Data-model / Data-flow audit

Principle: **Naikkan pengetahuan menjadi data model; jangan menurunkan pengetahuan menjadi control flow.**

## Scope
All non-test TypeScript under `packages/core/src/compiler/scanner`; audit implementation files excluded.

## Current counts
- `??`: **0**
- `ternary`: **8**
- `undefined`: **142**
- `null`: **0**
- `Record`: **30**
- `cast as`: **167**
- `if`: **48**
- `switch`: **0**
- `while`: **16**
- `strict equality`: **125**
- `positional arithmetic`: **13**

## Interpretation
- `??` and ternary are expression semantics. They must become explicit Expression ADT relations, never be lowered into parser control flow.
- `i + 123` / `i - 123` are acceptable only inside syntax navigation. They are a data-loss boundary if they cross into semantic AST meaning.
- `if` / `switch` / `while` are not automatically data loss. Generic traversal is allowed; Laravel meaning must be represented by facts/catalogs/ADT.
- `undefined` is the dominant remaining transport-level absence representation. Existing `Presence<T>` is the target semantic representation.
- `null` in source syntax must survive as an explicit expression datum; `null` used as an implementation sentinel should not leak into semantic ADTs.
- `Record<...>` is acceptable only for genuinely open lookup tables. Finite Laravel vocabularies should use closed catalogs.
- `as` is an evidence boundary. Replace semantic casts with typed constructors/refinements that carry source evidence.
- Equality checks must be classified by role: syntax recognition/navigation is different from semantic classification.

## Evidence samples
### ternary
- `lexer/routeAst/tokenCursor.ts` (1)
- `lexer/routeAst/routeSyntaxModel.ts` (3)
- `lexer/routeAst/routeBindingDeclarationAst.ts` (1)
- `lexer/routeAst/routeResourceDeclarationParser.ts` (1)
- `semantic/route/routeBindingAstAdapter.ts` (1)
- `semantic/route/routeConstraintKnowledgeCatalog.ts` (1)
### undefined
- `lexer/routeAst/syntaxRange.ts` (5)
- `lexer/routeAst/delimiterNavigation.ts` (13)
- `lexer/routeAst/routeResourceDeclarationAst.ts` (7)
- `lexer/routeAst/tokenCursor.ts` (28)
- `lexer/routeAst/syntaxNavigation.ts` (15)
- `lexer/routeAst/routeSyntaxModel.ts` (44)
- `lexer/routeAst/routeBindingDeclarationAst.ts` (2)
- `lexer/routeAst/routeDeclarationAst.ts` (4)
### Record
- `lexer/routeAst/delimiterNavigation.ts` (2)
- `lexer/routeAst/routeResourceDeclarationAst.ts` (1)
- `lexer/routeAst/tokenCursor.ts` (2)
- `lexer/routeAst/routeSyntaxModel.ts` (17)
- `semantic/route/routeMissingSemanticResolver.ts` (1)
- `semantic/route/routeBindingKnowledgeCatalog.ts` (2)
- `semantic/route/routeResourceSemanticResolver.ts` (1)
- `semantic/route/routeGroupSemanticResolver.ts` (1)
### cast as
- `lexer/routeAst/routeResourceDeclarationAst.ts` (5)
- `lexer/routeAst/tokenCursor.ts` (4)
- `lexer/routeAst/syntaxNavigation.ts` (6)
- `lexer/routeAst/routeSyntaxModel.ts` (12)
- `lexer/routeAst/routeDeclarationAst.ts` (8)
- `lexer/routeAst/routeDeclarationParser.ts` (2)
- `lexer/routeAst/routeResourceDeclarationParser.ts` (2)
- `semantic/route/routeBindingResolutionResolver.ts` (17)
### if
- `lexer/routeAst/syntaxRange.ts` (6)
- `lexer/routeAst/delimiterNavigation.ts` (5)
- `lexer/routeAst/tokenCursor.ts` (25)
- `lexer/routeAst/routeDeclarationParser.ts` (3)
- `lexer/routeAst/routeResourceDeclarationParser.ts` (9)
### while
- `lexer/routeAst/syntaxRange.ts` (5)
- `lexer/routeAst/tokenCursor.ts` (9)
- `lexer/routeAst/routeDeclarationParser.ts` (1)
- `lexer/routeAst/routeResourceDeclarationParser.ts` (1)
### strict equality
- `lexer/routeAst/syntaxRange.ts` (7)
- `lexer/routeAst/delimiterNavigation.ts` (9)
- `lexer/routeAst/tokenCursor.ts` (25)
- `lexer/routeAst/syntaxNavigation.ts` (1)
- `lexer/routeAst/routeSyntaxModel.ts` (45)
- `lexer/routeAst/routeBindingDeclarationAst.ts` (1)
- `lexer/routeAst/routeDeclarationParser.ts` (10)
- `lexer/routeAst/routeResourceDeclarationParser.ts` (22)
### positional arithmetic
- `lexer/routeAst/delimiterNavigation.ts` (2)
- `lexer/routeAst/tokenCursor.ts` (7)
- `lexer/routeAst/routeBindingDeclarationAst.ts` (2)
- `semantic/route/routeBindingAstAdapter.ts` (1)
- `semantic/route/routeConstraintKnowledgeCatalog.ts` (1)

## Data-flow target

```text
Laravel source
  ↓
syntax producer
  ↓
AST datum + provenance
  ↓
Presence / Expression / Relation ADT
  ↓
semantic fact / catalog
  ↓
data-flow edge
  ↓
consumer
```

## Route-specific flow already represented

| Source datum | Producer | Model | Consumer |
|---|---|---|---|
| Route declaration | routeDeclarationParser | RouteDeclarationAst | route semantic adapters |
| Group attributes | routeGroupState model | RouteGroupFact | routeGroupSemanticResolver |
| Constraints | routeConstraintFact | RouteConstraintFact | RouteConstraintContract |
| Resource middleware | routeResourceDeclarationParser | RouteResourceMiddlewareFact | resource semantic flow |
| Target method set | routeTargetMethodSet | RouteTargetMethodSet | route semantic flow |
| URI binding | parseRouteBindingDeclarations | RouteBindingDeclarationAst | binding resolver |

## Next implementation order
1. Replace AST optional transport with `Presence<T>` at the first stable model boundary.
2. Replace parallel constraint `value` / `values` with an explicit argument-shape ADT where mutually exclusive.
3. Replace finite `Record` catalogs with closed catalog data.
4. Replace semantic `as` assertions with evidence-carrying constructors/refinements.
5. Preserve source provenance through every AST → fact → data-flow edge.
6. Apply the same audit to Model → Property → Expression → Assignment → Eloquent/query.
