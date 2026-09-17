# INTERFACE TRACE AUDIT PHASE 67

## Target
`packages/core/src/types/domain/responseShapes.ts`

## Trace finding
The response-shape domain still carried semantic information as naked primitives:
- response cardinality and pagination were string fields;
- response envelope keys were plain strings;
- envelope type identity was a plain string;
- polymorphic relation columns and target identity were plain strings;
- `isCollection`, `hasPageLinks`, and `isCursorBased` duplicated facts already encoded by closed discriminators.

## Interface-only repair
Introduced semantic value objects:
- `ResponseDataKey`
- `ResponseMetaKey`
- `ResponseLinksKey`
- `EnvelopeTypeName`

Updated response-shape contracts to consume semantic values and explicit cardinality.
Removed redundant derived booleans from pagination/polymorphic contracts.

## Deliberately deferred
No scanner, resolver, constructor flow, lowerer, generator, or consumer was migrated in this phase. Existing construction sites may therefore fail type-check until a later producer migration phase. This is intentional: the tightened interface exposes the missing upstream contract instead of manufacturing a fallback.

## Rule
No downstream reclassification. No fallback identity. No semantic `string`/`boolean` field where the domain already has a closed vocabulary or value object.
