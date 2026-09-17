# Interface Trace Audit — Phase 66

## Scope

Interface-only repair of `semanticCollections.ts`. No producer, scanner, lowerer, generator, or runtime flow was migrated in this phase.

## Trace

`Laravel model column / relation semantics` → `ModelFieldInfo` / `ModelRelationInfo` → semantic collection maps → downstream consumers.

Previous contracts allowed naked semantic primitives:

- `ModelFieldInfo.type: string`
- `ModelFieldInfo.nullable: boolean`
- `ModelFieldEntry.column: string`
- `ModelRelationInfo.type: string`
- `ModelRelationInfo.model: string`
- `ModelRelationEntry.relationName: string`

These fields carried meaning without carrying the vocabulary that gives the value its meaning. That is the free-data boundary.

## Phase 66 repair

The contracts now require:

- `SemanticType` for field type semantics.
- `Nullability` for field nullability semantics.
- `ColumnName` for column identity.
- `EloquentRelationType` for relation kind.
- `ModelName` for relation target identity.
- `RelationName` for relation identity.

Existing collection implementation and call sites were intentionally not migrated. Compile failures caused by this tightening are expected and expose the exact producer/consumer boundaries that must be repaired next.

## Invariant

A semantic collection entry must no longer be constructible with an unqualified string/boolean for these six semantic dimensions.

## Next boundary

After the interface is accepted, migrate the producer/origin boundary first. Do not add conversion logic inside lowerers or consumers.
