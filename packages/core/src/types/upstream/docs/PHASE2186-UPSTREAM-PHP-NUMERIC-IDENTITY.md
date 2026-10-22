# Phase 2186 — Preserve PHP Numeric Type Identity Upstream

## Trace finding

The Phase 2185 trace found that the existing upstream type atom authority and response DTO parser both lowered PHP `int` and `float` to the same `PrimitiveVocabulary` variant, `number`. That made a later response-contract projection unable to distinguish `whole_number` from `decimal_number` without guessing.

## Interface-first correction

The existing `PrimitiveVocabulary` is evolved with `integer` and `decimal` variants. This preserves the source-level distinction in the existing `TypeExpression` ADT instead of creating a parallel PHP-only type representation.

The following existing producers now preserve the distinction:

- `phpTypeAtomAlgebra`: `int` → `integer`, `float` → `decimal`.
- `responseDtoDeclarationParser`: DTO property types retain `integer` versus `decimal`.
- `attributeProducer`: constructor parameter types retain `integer` versus `decimal`.
- `typeExpressionSemanticRelations` and `typeExpressionSemanticType`: both new variants lower to the target-neutral numeric primitive when a generic semantic type is required.
- `responseDtoReader`: response contracts map `integer` → `whole_number` and `decimal` → `decimal_number`.

The existing `number` primitive remains available for older evidence whose source distinction is already absent. It is not reclassified as either integer or decimal by the new response mapping.

## Contract version

`LaravelDtoResponseValueProjectionContract` and its runtime-executor interface are advanced to version 2 because the upstream vocabulary now preserves additional source semantics.

## Verification boundary

The static audit checks the vocabulary, all identified producer paths, generic semantic lowering, response DTO contract mapping, and the regression test. A Vitest regression test was added for a DTO with `int`, `float`, `string`, and `bool` properties. The test has not been executed in this environment; TypeScript typecheck and build were not run.

No `relation`, `foundation`, or subscanner layer was added. No new runtime semantic authority was introduced.
