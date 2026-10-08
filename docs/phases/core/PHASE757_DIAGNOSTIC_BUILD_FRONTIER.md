# Phase 757 — Diagnostic Build Frontier to Canonical Semantic Model

## Immediate build frontier

The DTS build errors at `validationRuleSet.ts` and `RouteSemanticFlowFactory.ts` were treated as model-boundary failures, not patched with assertions.

### Validation rule model

- The relation accumulator is explicitly a `RelationIndex<PropertyName, RootValidationField>`.
- `ValidationFieldShape` variant selection follows the closed ADT: collection is handled as the exact collection variant; scalar/object remain the residual algebra.
- `RequestFieldRequirement` construction has an explicit closed return type through the relation variant solver.
- `ObjectPropertyOrigin` is constructed through a typed semantic witness instead of `as const`.
- Array/object validation nodes are produced from the canonical shape and semantic-type variants.

### Route invalidation model

`RouteCacheInvalidationDescriptor` is not allowed to leak into `RouteCapabilityContract`. The descriptor is normalized once into the canonical upstream `RouteCacheInvalidation` ADT by a relation-backed sequence constructor. The factory boundary therefore consumes the new descriptor representation and the contract retains only the canonical semantic representation.

## Parsed descriptor authority

No production reference to `ParsedDescriptor` or `parsedDescriptor` remains. The following legacy reservoirs remain intentionally empty:

- `types/semantic/parsedAstAlgebra.ts`
- `types/semantic/parsedAstTypes.ts`
- `types/semantic/__archive__/parsedAstAlgebra.ts`
- `types/semantic/__archive__/parsedAstTypes.ts`
- `types/domain/semanticResolutionLegacyAdapter.ts`

## Research alignment

The target architecture is aligned with declarative compiler systems: MLIR separates pattern matching from rewriting; WebAssembly specifies validation as typed declarative judgments; and the RouteSync semantic kernel uses relation facts, closed ADTs, solver/fixed-point evaluation, and rewrite projections rather than host-language fallback state.

The scanner/lexer remains a source-evidence boundary. PHP constructs such as `if`, `for`, `switch`, `null`, and `??` may exist as source-language evidence, but semantic implementation must not use those constructs as host control-flow or host absence mechanisms.

## Remaining frontier

The strict relational audit still reports legacy leakage in the wider scanner/lexer/resolver graph. Those are the next migrations: AST/upstream mapping, resolver graph closure, data-flow analysis, and semantic type lowering. They should be migrated by replacing implementation mechanisms with closed relation judgments, not by mechanically deleting syntax that is itself PHP source evidence.
