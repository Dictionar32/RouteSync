# Interface Trace Audit Phase 80

## Target
`packages/core/src/types/domain/models.ts`

## Trace
Laravel Eloquent model identity/data → canonical `ParsedModel` → manifest/domain graph → downstream model consumers.

## Finding
`ParsedModel` still represented semantic model/table/property identities as raw `string` values.

## Repair
- `name` and `shortName` → `ModelName`
- `table` → `TableName`
- `primaryKey` → `ColumnName`
- `fillable`, `guarded`, `hidden`, `appends` → `PropertyName[]`

## Boundary rule
These wrappers describe facts already extracted upstream. No generator-specific names were added.

## Scope
Interface only. Producer/consumer migration is intentionally deferred.
