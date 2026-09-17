# RouteSync Interface Trace Audit — Phase 69

## Target
Remove `null` from the validation-rule domain interface.

## Repairs
- `ArrayValidationRuleNode.elementType`: `SemanticType | null` -> `ArrayElementType` ADT.
- `DateValidationRuleNode.format`: `DateFormat | null` -> `DateFormatSpecification` ADT.
- `ExistsValidationRuleNode.column`: `ColumnName | null` -> `ValidationDatabaseColumn` ADT.
- `UniqueValidationRuleNode.column`: `ColumnName | null` -> `ValidationDatabaseColumn` ADT.

## Dataflow invariant
Absence is now represented as an explicit domain state, not JavaScript nullability. Downstream consumers can pattern-match the state without guessing what null means.

## Scope
Interface/domain contract only. Producer, constructor, scanner, lowerer, and flow migration are intentionally deferred until the interface pass is complete.
