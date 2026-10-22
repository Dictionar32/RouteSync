# RouteSync Phase 2487 — Resource Binary Operator Authority

## Audit and trace

The Resource expression mapper imported `scanner/subscanners/resource/resourceExpressionOperator.ts`. That file performed a PHP-operator-to-semantic-operator decision and depended on `semantic/relations` for a simple table lookup. The mapper is used by Resource binders/producers, so the operator decision was on a production path.

## Repair

- Added `ResourceBinaryOperatorMappingOperationInterface` under `types/upstream`.
- Added `compiler/semantic/resourceBinaryOperatorAuthority.ts`, exposing `resourceBinaryOperatorMapping` as an interface-typed `export const`.
- Made the mapping catalog exhaustive over `PhpBinaryOperator['kind']`.
- Added `unknown` to the semantic operator value union and explicitly map unsupported PHP operators (`exponentiation`, `logical_xor`, bitwise operators, shifts) to `unknown`, rather than silently asserting a value outside the declared union.
- Rewired `resourceAstExpressionMapper.ts` to consume the authority operation.
- Deleted the old `resourceExpressionOperator.ts` subscanner module after replacing its consumer.
- Exported the contract from upstream and the public core entry point.

## Verification boundary

The Phase2487 audit checks contract ownership, exhaustive operator coverage, production wiring, legacy-module retirement, and absence of relation/foundation imports from the new authority/contract. It does not prove the entire Resource scanner is relation-free. The mapper, field producer, producer, binder, resolver, and source-evidence scanner still have other outstanding `semantic/relations` imports. Full typecheck, build, Vitest, and end-to-end CLI are not claimed as passing.

## References

- TypeScript Handbook, interfaces and structural contracts: https://www.typescriptlang.org/docs/handbook/2/objects.html
- Laravel 13 Eloquent API Resources: https://github.com/laravel/docs/blob/13.x/eloquent-resources.md
