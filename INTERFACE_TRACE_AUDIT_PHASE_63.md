# Interface Trace Audit - Phase 63

## Scope
Interface/ADT only. Producer, scanner, mapper, lowerer, and pipeline flow are intentionally not migrated.

## Trace finding
The Eloquent model boundary still exposed duplicated or raw representations:
- `ParsedCast.targetType: string` duplicated cast identity already represented by `castKind`.
- `ParsedCast.semanticType: PrimitiveKind` compressed semantic information.
- `ParsedAccessor.type: string` and `nullable: boolean` carried PHP syntax instead of resolved semantic meaning.
- `ParsedAccessor.semanticType: PrimitiveKind` compressed semantic information.
- `ParsedRelation.modelName` duplicated `targetModel`.
- `ParsedRelation.isCollection` duplicated `cardinality`.
- `ParsedRelation.foreignKey: string | null` encoded absence/meaning through nullable string state.

## New contract
- Casts use `EloquentCastTarget` ADT and `SemanticType`.
- Accessors expose only canonical property identity and `SemanticType`.
- Relations use `targetModel`, `cardinality`, and `RelationForeignKey` ADT.
- `ModelKeyType` now includes `string` and `ulid`, matching the canonical registry vocabulary.

## Dataflow invariant
Downstream consumers must not infer:
- cast identity from a raw target string,
- accessor nullability from a second boolean,
- relation cardinality from `isCollection`,
- relation target from either of two competing model fields.

Compilation failures in old producers/consumers are expected. They expose migration boundaries and must not be hidden with `any`, fallback defaults, or nullable compatibility fields.
