# Interface Trace Fix — Validation Boundary — 2026-09-20

## Baseline
`RouteSync.zip` uploaded by the user on 2026-09-20.

## Fixed boundary
Laravel validation source → ValidationRuleNode → RouteValidationRuleEntry → RouteValidationRuleSet → RequestField / ValidationFieldNode.

## Changes
- Removed syntax-oriented `RouteValidationRuleEntry.structure`.
- Added `sourceField` for exact source provenance.
- Added `ValidationFieldLocation` with root / collection-element semantics.
- Added recursive `ValidationFieldShape` and `ValidationFieldProperty`.
- Preserved `semanticType`, `presence`, and validation rules at the entry boundary.
- Added semantic type and presence to all `ValidationFieldNode` variants.
- Removed `inferParentPresence()`.
- Route validation tree no longer reads `entry.structure`.
- Controller/FormRequest consumers continue to consume the same `RouteValidationRuleEntry` vocabulary.

## Verification
- No remaining `.structure` references in the validation descriptor/domain files.
- No remaining `inferParentPresence` reference.
- TypeScript diagnostics filtered to the changed validation files: zero errors.
- Full checkpoint TypeScript check still has pre-existing unrelated errors (dependency/configuration and other compiler domains).

## Remaining next boundary
Request identity still contains name-normalization matching in `FormRequestScanner` and `actionValidationExtractor`. That is the next upstream interface to raise before declaring the complete request flow downstream-pure.
