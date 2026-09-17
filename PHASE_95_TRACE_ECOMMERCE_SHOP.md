# Phase 95 — ecommerce_shop Upstream Interface Integrity

## Objective
Trace the Laravel `ecommerce_shop` data path again and repair the domain interfaces before changing lowerers. The invariant is: every semantic fact discovered upstream keeps its domain meaning downstream.

## Trace

```text
Laravel PHP / AST
  ↓
scanner descriptors
  ↓
ParsedModel / ParsedRelation / ParsedCast / ParsedAccessor
  ↓
semantic binding
  ↓
RouteManifest / IR
  ↓
pure lowerers
```

For the known `ecommerce_shop` register flow, the source route is `POST /register` and the controller response is explicitly identified as `RegisterResponse` by the Laravel response attribute. The runtime `data: null` value is a field value, not a response identity.

## Findings

1. `ParsedModel` had domain names in value-object form, but its descriptor implementation still exposed raw strings.
2. `ParsedRelation` used raw `string` identities and `string | null` for foreign keys. That made relation meaning dependent on downstream interpretation.
3. `ParsedAccessor` exposed a primitive semantic type and duplicated `type`/`nullable` information.
4. `ParsedCast` exposed raw column/type strings while the canonical domain already has `ColumnName` and `CastTypeName`.
5. `ScannedObjectProperty` accepted a second nullable channel even though `SemanticType` already carries nullability.
6. The graph and semantic consumers still expected the old relation string representation.
7. Existing response/pagination interfaces still contain unrelated legacy primitive channels. Those are now isolated as the next interface-first boundary rather than silently being erased.

## Repairs

### Model
`ParsedModel` implementation now constructs:
- `ModelName`
- `TableName`
- `ColumnName`
- `PropertyName[]`
- `ModelKeySemanticType`

### Relation
`ParsedRelation` now carries:
- `RelationName`
- `sourceModel: ModelName`
- `targetModel: ModelName`
- closed `RelationForeignKey` (`convention | explicit`)
- canonical cardinality

The old `modelName` duplicate is no longer the semantic carrier.

### Cast
`ParsedCast` now carries `ColumnName`, `CastTypeName`, and the canonical `SemanticType`.

### Accessor
`ParsedAccessor` now carries `MethodName`, `PropertyName`, and canonical `SemanticType`. The implementation converts the scanner primitive result at the boundary.

### Object property
`ScannedObjectProperty.create()` no longer accepts `nullable` as an independent semantic input. Nullability comes from `SemanticType`.

## Data-integrity rule
No AST/resource/model information was intentionally collapsed into `string`, `unknown`, or a fake primitive merely to make the interface easier. Raw strings remain only at scanner construction boundaries where they are immediately converted into domain values.

## Verification

Focused TypeScript checking of the changed model/relation/accessor/cast files no longer reports errors originating in those changed files. The repository still has pre-existing interface graph errors in response shapes, validation rules, request exports, and legacy route aggregation. The repository has no root `package.json`/root `tsconfig.json` in this basis, so a full workspace build is not claimed.

## Next boundary
The next interface-first trace should repair the **response/pagination contract family**. In particular, `ResponseDataKey`, `ResponseMetaKey`, `EnvelopeTypeName`, polymorphic relation descriptors, and paginated envelope descriptors currently mix domain value objects with raw strings. That is the remaining major semantic leak before lowerers can be made genuinely pure.
