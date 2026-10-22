# Phase2465 — Eloquent Relation Upstream Authority

## Scope

Move the Eloquent relation method vocabulary out of `compiler/scanner/subscanners/model` and into the existing upstream type/authority layer. Reuse `EloquentRelationDescriptor` and `EloquentRelationType`; do not add a second relation result vocabulary.

## Changes

- Added `EloquentRelationMethodAuthorityInterface` and a closed recognition judgment.
- Added `eloquentRelationMethodAuthority`, exported as `export const ...: EloquentRelationMethodAuthorityInterface`.
- Moved the 11 supported Eloquent relation method descriptors to the upstream authority.
- Updated `eloquentProducer.ts` to consume the upstream authority.
- Deleted `subscanners/model/eloquentRelationVocabulary.ts`.
- Exported the contract and authority through the upstream barrel.

## Verification

Run:

- `npm run audit:phase2465-eloquent-relation-upstream-authority`
- `npm run smoke:phase2465-eloquent-relation-upstream-authority`

This phase does not claim all model subscanners or all `semantic/relations` imports have been retired. `eloquentProducer.ts` and other model helpers still contain separate relation-algebra dependencies that require individual ownership traces.

## Remaining direct relation dependencies in model subscanners

The current snapshot still has direct `semantic/relations` imports in these eight files:

- `columnInferrer.ts`
- `eloquentProducer.ts`
- `memberPropertiesParser.ts`
- `memberRelationsParser.ts`
- `modelCanonical.ts`
- `modelParser.ts`
- `propertyProducer.ts`
- `semanticTypeCanonical.ts`

The new authority and contract have no direct relation/foundation imports. The migration does not claim transitive CLI closure or full retirement of the model subscanner directory.

## Executed checks

- Phase2465 static audit: 10/10
- Phase2465 runtime smoke: 13/13
- Phase2464 accessor authority audit: 11/11
- Phase2463 cast authority audit: 11/11
- Phase2462 accessor/cast boundary audit: 10/10
- Phase2459 Model Scanner interface-first audit: 11/11
- TypeScript syntax transpilation of the three changed TypeScript files: 3/3
- `package.json` parse: passed

Full project typecheck, Vitest, package build, and CLI end-to-end were not run in this workspace. Syntax transpilation and scoped audits are not substitutes for those checks.
