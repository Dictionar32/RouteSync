# Phase 148 — Trace → Suggest → Repair → Re-trace: Resource Assignment ADT

## 1. Flow traced

`ecommerce_shop` → PHP source AST → lexer `PhpAssignmentTarget` → resource expression mapper → `ResourceClosureStatement` → downstream resource processing.

## 2. Finding

The lexer already has an explicit assignment-target variant:

- `variable`
- `variables`
- `property`
- `array_element`

The existing domain `ResourceClosureAssignmentTarget` had only `variable`, `property`, and `array_element`.

The mapper therefore had no semantic destination for `variables` and previously fell through to `array_element`, which is semantic corruption: a multi-variable assignment could be represented as an array-element assignment.

## 3. Interface elevation

The existing canonical domain ADT was enriched rather than introducing a parallel scanner-shaped interface:

```ts
export type ResourceClosureAssignmentTarget =
  | { readonly kind: 'variable'; readonly name: VariableName }
  | { readonly kind: 'variables'; readonly names: readonly VariableName[] }
  | { readonly kind: 'property'; readonly target: ResourceFieldExpression; readonly property: PropertyName }
  | { readonly kind: 'array_element'; readonly target: ResourceFieldExpression; readonly index: ResourceFieldExpression };
```

## 4. Mapper repair

`mapClosureAssignmentTarget()` now preserves the four source meanings explicitly. Property names are also converted through the canonical `PropertyName` value factory instead of passing scanner identifiers downstream.

## 5. Source evidence

`ecommerce_shop` contains real `null` and conditional/coalescing source expressions, while the scanner AST already preserves these as explicit expression variants. Therefore downstream must consume those ADTs rather than rediscovering PHP syntax.

## 6. Re-trace result

### Preserved meaning

- closure statement kind: preserved
- assignment target kind: preserved
- multi-variable assignment: preserved
- property assignment: preserved
- array-element assignment: preserved
- expression variants: preserved by `matchPhpAstValue`
- closure control-flow: preserved by `ResourceClosureStatement`

### Centralized dispatch

`matchPhpAstValue()` and `matchPhpStatement()` are the syntax-boundary catamorphisms. A downstream consumer receives the semantic ADT and does not need to classify raw PHP syntax again.

Their internal `switch` is therefore boundary dispatch, not downstream re-classification.

## 7. Validation

Command:

`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: no new errors. The only reported blocker remains the pre-existing environment/type dependency issue:

`packages/core/src/compiler/utils/Hash.ts(4,28): error TS2307: Cannot find module 'crypto' or its corresponding type declarations.`

## 8. Next semantic audit target

The next useful trace is not another syntax-style rewrite. It is the remaining **semantic rejection boundary**, especially `modelAccessorExpressionMapper.ts` and the resource mapper's null-literal semantic status. Those should be checked against actual `ecommerce_shop` constructs before adding any new abstraction.
