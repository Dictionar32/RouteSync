# Interface Trace Audit Phase 83

## Scope
PHP AST ADT boundary only. Parser/scanner factories, lowerers, and generator flow are intentionally not migrated.

## Trace finding
The canonical PHP AST still exposed syntax-role identifiers and operators as free `string` values. Array-entry keys used `string | null`, and offset lookup could not represent a computed PHP offset. AST source presence was optional, and literal payloads used a primitive union containing null.

## Repair
- Added closed AST ADTs for property, class, method, function, variable, and constant names.
- Added closed binary and unary operator sets.
- Added closed PHP cast type.
- Added `ArrayKey` with `implicit` or an explicit `PhpAstNode` expression.
- Changed offset lookup from a string property to a recursive `offset: PhpAstNode`.
- Added explicit `PhpAstSource` presence ADT.
- Reused the existing `BoundLiteralValue` ADT for literal payloads.
- Updated the AST folder contract for recursive offset expressions.

## Invariant
Canonical AST nodes carry syntactically qualified data. Unsupported syntax must use `UnsupportedAstNode` instead of leaking arbitrary identifier/operator data into the AST.

## Deferred
Existing parser/scanner construction still emits legacy shapes. Those usages remain as compile-time migration signals for the later flow phase.
