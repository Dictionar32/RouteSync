# Phase 93 — Interface-First Domain Vocabulary Trace

## Objective
Move semantic/domain interfaces away from free primitive fields before changing downstream implementations.

## Trace findings
- `modelEntityDefinition.ts` carried `name/type/nullable` as independent primitives.
- `manifestIrTypes.ts` carried semantic identity as free `string`, plus nullable/optional/validation booleans.
- `resolvedSemanticTypes.ts` duplicated semantic state with `isBound`, `collection`, and nullable/optional flags.
- `endpointIrTypes.ts` carried resource/model/controller/action/path identifiers as free strings and optional transport flags.
- `resourceIrTypes.ts` carried resource/model/property/source identities as free strings and optional semantic fields.
- `nominalVocabulary.ts` existed but covered only a small subset of the domain vocabulary.

## Changes
- Expanded canonical nominal vocabulary: ModelName, ResourceName, ResponseTypeName, PropertyName, RouteName, RoutePath, ControllerName, ActionName, SourceFilePath, SourceLineNumber, TypeExpression, CodeExpression, DescriptionText, etc.
- Converted core IR/domain contracts to consume those domain atoms.
- Replaced `ResolvedSemanticType` boolean state with closed semantic states where the meaning is domain state, not a flag.
- Added explicit semantic cardinality for resource values.
- Removed optional semantic metadata from the touched IR contracts.
- Kept raw primitives only where they are transport/source-boundary data or literal values.

## Important validation note
This phase is intentionally interface-first. The Phase 92 archive did not contain the repository root `tsconfig.json`, so a full repository build cannot be claimed from this archive. The next phase must repair constructors/factories/adapters that still produce raw strings for the new nominal contracts.

## Next boundary
`raw scanner/source data -> constructor/factory -> nominal domain ADT -> semantic IR -> lowerer`

No lowerer should be modified to compensate for an incomplete interface.
