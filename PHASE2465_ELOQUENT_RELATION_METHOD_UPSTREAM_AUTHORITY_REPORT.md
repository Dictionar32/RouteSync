# Phase2465 — Eloquent Relation Method Upstream Authority

## Scope

Migrates Laravel Eloquent relation-method classification from the model subscanner into an upstream-owned interface and closed judgment. Reuses `EloquentRelationDescriptor`, `EloquentRelationType`, and the existing model vocabulary rather than creating a parallel relation descriptor model.

## Changes

- Added `EloquentRelationMethodEvidence` and `EloquentRelationMethodJudgment` to upstream `modelVocabulary.ts`.
- Added `EloquentRelationMethodAuthorityInterface` and `eloquentRelationMethodAuthority`.
- Authority classifies the 11 supported Laravel relation methods and owns the foreign-key strategy (`belongs_to`, `direct`, `not_applicable`).
- Removed `subscanners/model/eloquentRelationVocabulary.ts`.
- Rewired `eloquentProducer.ts` to use the upstream authority and removed its direct `semantic/relations` import.
- Corrected class-reference argument detection to inspect `argument.value.kind`; the former check compared the argument wrapper kind to `class_reference`, although argument wrappers are positional/named/unpacked.
- Replaced relation combinator dependencies in this producer with direct typed AST traversal. This is source-syntax extraction/wiring; the relation method semantic judgment is upstream-owned.

## Verification

Run:

- `npm run audit:phase2465-eloquent-relation-method-upstream-authority`
- `npm run smoke:phase2465-eloquent-relation-method-authority`

The smoke test transpiles the upstream authority module and checks all 11 known relation methods plus an unknown method. Full typecheck, package build, Vitest, and CLI integration are not claimed by these focused checks.

## Remaining architecture debt

- Other model subscanner files still import `semantic/relations` directly.
- The transitive expression semantic authority path still requires its own audit.
- This phase does not claim full retirement of model subscanners or complete transitive relation/foundation removal across the CLI.
