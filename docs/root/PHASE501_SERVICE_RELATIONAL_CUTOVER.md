# Phase 501 — Service Relational Cutover

## Objective

Move `scanner/subscanners/serviceAstCanonical.ts` from syntax-directed imperative control toward the canonical RouteSync model:

`scanner evidence -> relation facts -> candidate/requirement resolution -> recursive closure -> semantic value -> fixed-point/rewrite authority`

## Research basis

Phase 501 uses the same higher-level ideas validated against current declarative compiler/analysis systems:

- MLIR PDLL represents matching and rewriting declaratively and separates match from rewrite.
- MLIR PDL represents rewrite patterns as a transformable high-level representation.
- MLIR declarative rewrite rules encode source/result DAG patterns instead of hand-written traversal control.
- Flix exposes fixed-point computation over constraints on relations.
- Rascal-style analysis architecture motivates facts/enrichment/closure before semantic decisions.

## Changes

`serviceAstCanonical.ts` was cut over to:

- expression-child relation catalogs instead of expression `switch` traversal;
- recursive relation traversal for arguments, objects, arrays, match arms and closures;
- relation lookup for parameter-model resolution;
- relation candidate/requirement selection for assignment targets and for clauses;
- statement-expression relation catalog;
- recursive source-statement expression closure;
- return-flow relation catalog plus recursive sequence closure;
- semantic result aggregation through recursive semantic-value closure;
- relation projection/expansion for dependency facts;
- fixed-point method/result construction retained as the semantic convergence boundary;
- parser method discovery through relation-gated token evidence;
- no absence sentinel based on `undefined`.

## Closed-surface audit

Command:

`npm run audit:scanner-lexer:phase501`

Result:

`closedSurfaceClean: true`

The Phase 501 closed set is clean for `if`, `for`, `while`, `switch`, `map`, `filter`, `reduce`, `flatMap`, `undefined`, `??`, `null`, `===`, `as unknown`, `||`, `&&`, `.trim()`, `.slice()`, and ternary syntax.

## Remaining frontier

1. `subscanners/controller/controllerDataflowContract.ts` — 88
2. `subscanners/serviceSourceStatements.ts` — 75
3. `subscanners/form-request/canonicalValidationRuleEntry.ts` — 70
4. `subscanners/form-request/validationFieldAssembler.ts` — 68
5. `descriptors/request/controllerExpressionContract.ts` — 61
6. `subscanners/resource/resourceFieldProducer.ts` — 61
7. `descriptors/validation/validationRuleEntry.ts` — 57
8. `descriptors/manifest/resourceRouteGroupDescriptor.ts` — 54
9. `subscanners/controller/responseAttributeScanner.ts` — 54
10. `subscanners/resource/resourceUpstreamExpressionCanonical.ts` — 54

## Validation limitation

Repository-wide TypeScript checking remains blocked by the environment because the configured `node` and `vitest/globals` type definitions are unavailable. The modified file was syntax-transpiled successfully with the installed TypeScript compiler, and the Phase 501 relational frontier audit is clean.
