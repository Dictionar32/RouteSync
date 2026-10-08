# Phase 804 — Route Group Argument Fold Frontier

## Frontier

The local DTS build reached `routeDeclarationParser.ts` after the Phase 803 route-group upstream cutover. The remaining failure was not a missing semantic fact; it was an incorrect invocation of the canonical `relationVariantFold` interface.

The parser called `relationVariantFold` with five arguments while the canonical relation primitive accepts four:

1. value
2. selected variant kind
3. rest/absent branch
4. selected/present branch

The fifth callback caused the selected callback to become an extra argument and left its `pattern` parameter implicitly `any`.

## Model elevation

`routeDeclarationParser.ts` now consumes `RouteConstraintArgument` directly from `core/types/upstream/routeConstraints` and projects the closed upstream ADT to `RouteConstraintArgumentAst` through the canonical relation fold.

The semantic authority remains:

```text
Laravel syntax evidence
  -> RouteConstraintSyntaxFact
  -> core/types/upstream/RouteConstraintArgument
  -> RouteGroupConstraintFact
  -> RouteDeclarationAst projection
```

No parser-local duplicate constraint argument algebra was introduced.

## Validation

Static Phase 804 audit:

```text
allPass: true
```

Full `npm run build` is not claimed in the sandbox because the workspace snapshot does not contain the local `tsup` installation. The authoritative validation is the user's local DTS build.
