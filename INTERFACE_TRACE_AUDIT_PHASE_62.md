# Interface Trace Audit Phase 62

## Target
Laravel AST -> high-model Eloquent contracts, interface-only.

## Fixed
- ParsedModel key semantic is a closed ModelKeySemanticType ADT.
- ParsedColumn no longer carries raw SQL type string or nullable boolean in the high model.
- ParsedColumn carries DatabaseColumnType + Nullability + SemanticType.
- ParsedResource no longer carries baseModel/modelName nullable identity fields; it carries ModelBinding.
- Unsupported database types use a closed reason ADT instead of arbitrary unknown/string payloads.

## Deliberately not changed
Producer/scanner flow, adapters, lowerers and consumers are not migrated in this phase. Compile failures from old producers are expected and identify the next migration boundary.

## Ecommerce-shop invariant
A Laravel model column must arrive downstream as an explicit database/semantic contract. A missing model binding is represented as `unbound`, not `null`; response DTO identity remains separate from Eloquent model identity.
