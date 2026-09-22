# Phase Error Repair 10 — TypeExpression Vocabulary

## Root
Two meanings of `TypeExpression` existed:
- `types/ir/nominalVocabulary.ts`: branded `string`
- `types/upstream/typeVocabulary.ts`: closed semantic ADT

The upstream ADT is now the SSOT. `nominalVocabulary.ts` re-exports the upstream `TypeExpression`; the branded-string definition and `createTypeExpression()` were removed.

## Additional boundary repair
Text fields were not allowed to masquerade as type expressions. Added explicit upstream value objects:
- `DescriptionText`
- `GeneratorName`
- `GenerationTimestamp`

Updated IR contracts for descriptions/generator metadata and path-parameter description construction.

## Verification
Targeted search confirms there is no `createTypeExpression` remaining.
The remaining TypeExpression-related diagnostics are consumer migrations where old code expects `string`, plus unrelated existing model/property issues. No legacy branded-string TypeExpression was restored.

## Next root candidates
1. `FieldTypeResolver` / `legacyConverter` string-based description boundary
2. `SemanticTypeResolvers` format boundary
3. model canonical property semantic-value mismatch

## Principle
Do not reintroduce a free `string` TypeExpression merely to make downstream compile. Consumers must consume the canonical upstream TypeExpression ADT or use the correct semantic value object for text.
