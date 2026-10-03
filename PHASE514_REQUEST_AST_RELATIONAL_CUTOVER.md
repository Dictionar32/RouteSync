# Phase 514 — Request AST Relational Cutover

## Scope

Target:
`packages/core/src/compiler/scanner/subscanners/requestAstCanonical.ts`

The request AST boundary is moved toward a declarative relation pipeline:

```text
source request evidence
  -> relation projection
  -> semantic candidate dispatch
  -> recursive sequence construction
  -> relation-gated requirement/type resolution
  -> canonical request field
  -> RequestAst
```

## Cutover

- sequence construction uses recursive relation closure rather than collection reduction
- property path construction uses relation selection/projection
- presence vocabulary is a semantic relation lookup
- nullable field typing is relation-gated
- meaning/type visitors use declarative visitor relations
- wildcard request targets use relation-gated text projection
- validation rule construction uses a typed relation handler catalog
- file validation constraints use relation projection
- request requirements use relation predicates and explicit semantic alternatives
- request authorization uses a relation gate
- request field aggregation uses relation projection

## Audit

`npm run audit:scanner-lexer:phase514`

`closedSurfaceClean: true`

All target forbidden categories are zero:

`if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `trim`, `slice`, `never`, ternary.

## Syntax validation

TypeScript `transpileModule` diagnostics for the target: `0`.

A standalone `tsc` invocation still exposes existing repository-wide type graph incompatibilities plus some type-shape mismatches at this boundary; therefore this phase does not claim full repository typecheck success.

## Frontier

Largest remaining scanner/resolver surfaces after this cutover:

1. `controllerActionContract.ts`
2. `validationRuleSet.ts`
3. `propertyProducer.ts`
4. `RouteScanner.ts`
5. `typeDeriverUtils.ts`
6. `FormRequestScanner.ts`
7. `resourceProducer.ts`
8. `memberPropertiesParser.ts`

The lexer/route-AST test fixtures are excluded from production authority decisions and remain audit noise for the production scanner frontier.
