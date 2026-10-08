# Phase 520 — Resource Binding Relational Cutover

## Scope

Production scanner surfaces migrated:

- `packages/core/src/compiler/scanner/subscanners/resource/resourceBindingTraversalBuilder.ts`
- `packages/core/src/compiler/scanner/subscanners/model/memberPropertiesParser.ts`

## Architecture

The binding traversal path now follows:

`scanner evidence -> root/member/method relations -> RelationOption witnesses -> recursive traversal fold -> canonical traversal model`

The model-property scanner now follows:

`property evidence -> candidate relation -> typed presence witness -> relation option fold -> canonical model property state`

## Key changes

- traversal state uses `RelationOption` rather than optional state;
- missing traversal reasons are relation witnesses;
- member/method traversal is accumulated by recursive relation fold;
- model resolution is a relation refinement;
- scalar/relation property dispatch is a relation-selected handler catalog;
- projection acceptance/rejection is represented as relation refinement;
- variable-root expansion remains recursive and cycle-aware;
- model-property candidates are declarative relation records;
- string/boolean/property-array extraction uses relation witnesses and folds;
- no semantic authority is delegated to host-language branch constructs.

## Audit

`node scripts/audit-phase520-resource-binding-relational-frontier.cjs`

All forbidden surface counters are zero and `closedSurfaceClean` is true.

Full repository typecheck is intentionally not claimed because the workspace environment does not provide the baseline `node` and `vitest/globals` type definitions required by the repository configuration.
