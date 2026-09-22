# Interface Trace Audit — Phase 68

## Target
`packages/core/src/types/domain/validationRules.ts`

## Trace finding
Validation rule contracts still exposed naked semantic primitives:

- array `elementType: string | null`
- date `format: string | null`
- min/max/between numeric constraints as raw `number`
- `in` values as `string | number`
- database `table`/`column` as raw strings
- custom rule identity and parameters as raw strings
- registry classification duplicated semantic meaning through three booleans

These fields allowed downstream consumers to receive data without knowing what the value represented. A string could be a table, column, date format, or rule name. TypeScript was technically satisfied while the domain contract remained weak. Humanity has once again discovered that `string` is not a semantic model.

## Interface repair
Introduced semantic value objects:

- `TableName`
- `DateFormat`
- `ValidationConstraintValue`
- `ValidationParameter`
- `ValidationRuleName`

Updated the validation ADT to carry those qualified values and `SemanticType` for array element contracts.

Removed redundant registry flags:

- `isTypeAssertion`
- `isConstraint`
- `isModifier`

`category` remains the canonical classification source.

## Deliberately not changed
This phase is interface-first. Parser/factory call sites and downstream flow are intentionally not migrated. The resulting compile failures are expected contract breakage and identify the next producer/consumer migration boundary.
