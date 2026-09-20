# Phase 176 — Trace / Suggest / Fix / Retrace

## Focus
Elevate relation-load target interface so path and selection semantics are carried upstream and invalid empty paths are not represented as valid empty relations.

## Trace findings
Previous relation-load boundary still represented semantic data as raw strings:
- target path was `string`
- selection properties were `string[]`
- downstream still split relation path and converted property names
- empty relation path could resolve to `path: []`

## Changes
`packages/core/src/types/domain/resourceQueryOperation.ts`

- `ResourceRelationLoadSelectionParts.properties` now carries `PropertyName[]`.
- `ResourceRelationLoadTargetParts.path_only` and `path_with_selection.path` now carry `RelationName[]`.
- Added `ResourceRelationLoadTargetParts.invalid { reason: 'empty_path' }`.
- `ResourceRelationLoadTargetResolution` now preserves `empty_path | empty_selection`.
- Added `matchResourceRelationLoadSelectionParts`.
- `matchResourceRelationLoadTargetParts` is exhaustive over valid/invalid target shape.
- `parseResourceRelationLoadTargetParts` performs syntax translation at the origin boundary and rejects an empty semantic path.
- `parseResourceRelationLoadTarget` now consumes already-semantic path/property values instead of re-splitting/reclassifying them.

## Resulting flow
raw relation-load syntax
→ target syntax ADT
→ `RelationName[]` + `PropertyName[]`
→ `ResourceRelationLoadTarget`
→ downstream

No downstream consumer needs to infer relation path or property-selection meaning from raw strings.

## Validation
Command:
`npx tsc -p tsconfig.phase87.33.narrow.json --noEmit`

Result: only the pre-existing environment blocker remains:
`packages/core/src/compiler/utils/Hash.ts(4,28): TS2307 Cannot find module 'crypto' or its corresponding type declarations.`

No new TypeScript errors from Phase 176.
