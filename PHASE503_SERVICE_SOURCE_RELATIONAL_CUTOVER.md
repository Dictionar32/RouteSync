# Phase 503 — Service Source Statements Relational Cutover

## Objective

Move `serviceSourceStatements.ts` out of imperative parser/resolver authority and into the RouteSync semantic relation pipeline:

`scanner evidence -> relation facts -> candidate/option relations -> recursive closure -> semantic value -> rewrite/consumer`

The source statement layer remains an adapter from PHP AST evidence into canonical semantic relations; it no longer owns control-flow selection through host-language branch constructs.

## Research synthesis

The cutover follows the strongest reusable ideas found beyond the previously surveyed systems:

- MLIR PDLL/PDL represents matching and rewriting declaratively, with explicit matcher and rewrite phases. The PDL dialect itself represents rewrite patterns as IR, making pattern matching transformable and inspectable. See MLIR PDLL/PDL documentation.
- Statix treats static semantics as constraint solving and models name binding through scope graphs: scopes, labeled edges, declarations, and queries form a relational semantic substrate.
- Flix provides fixed-point computation over constraints on relations and first-class constraints, directly supporting recursive closure as semantic authority.
- egglog combines relational/Datalog-style deduction with equality saturation and explicit saturation schedules, useful for a later RouteSync rewrite/equivalence layer.

## Phase 503 changes

### `serviceSourceStatements.ts`

Reworked the boundary to use:

- relation-gated statement classification instead of imperative dispatch;
- relation projection for statement and catch-handler construction;
- recursive sequence construction instead of reduction;
- explicit relation options for semantic absence;
- relation-based environment lookup;
- recursive binding closure for destructured assignment targets;
- relation-gated expression classification;
- relation-derived model/property/relation resolution;
- recursive semantic expression resolution;
- relation-based builtin result classification;
- relation-gated conditional/recurrence/cast semantics;
- relational parameter-environment construction.

## Closed-surface audit

The Phase 503 scanner/lexer audit closes:

`subscanners/serviceSourceStatements.ts`

and reports zero occurrences of the targeted constructs:

- `if`
- `for`
- `while`
- `switch`
- `map`
- `filter`
- `reduce`
- `flatMap`
- `undefined`
- `??`
- `null`
- `===`
- `as unknown`
- `||`
- `&&`
- `trim`
- `slice`
- ternary operator

The target file also passes TypeScript syntax transpilation with zero diagnostics.

## Next frontier

The largest remaining scanner/lexer/resolver surfaces after this cutover are:

1. `subscanners/form-request/canonicalValidationRuleEntry.ts`
2. `subscanners/form-request/validationFieldAssembler.ts`
3. `descriptors/request/controllerExpressionContract.ts`
4. `subscanners/resource/resourceFieldProducer.ts`
5. `descriptors/validation/validationRuleEntry.ts`
6. `descriptors/manifest/resourceRouteGroupDescriptor.ts`
7. `subscanners/controller/responseAttributeScanner.ts`
8. `subscanners/resource/resourceUpstreamExpressionCanonical.ts`

The next semantic priority is the form-request validation cluster, because it contains multiple independent syntax-driven decision surfaces that can be consolidated into a shared validation-rule relation catalog and candidate solver.

## Validation

```text
npm run audit:scanner-lexer:phase503
```

Repository-wide typecheck is not claimed as passing when the environment lacks the repository's `node` and `vitest/globals` type definitions.
