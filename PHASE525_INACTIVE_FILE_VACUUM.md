# Phase 525 — Inactive File Vacuum

## Goal

Remove inactive semantic/scanner/resolver authority from the production source surface without deleting paths that may still be referenced by tooling. Files proven inactive by repository-wide textual basename reference analysis were emptied in place.

## Rule

A non-test, non-archive TypeScript file is treated as an inactive-file candidate when:

- it is not a package/domain `index.ts` entrypoint;
- it is non-empty;
- its basename has no textual reference anywhere under `packages/core/src`;
- therefore no source/test import or explicit path reference was found.

The file path is preserved and its contents are emptied rather than deleted, avoiding accidental path-level breakage while removing obsolete semantic authority.

## Vacuumed surfaces

The vacuum included obsolete semantic relation scaffolds, legacy resolver/adaptor surfaces, old constraint-program facades, inactive scanner helpers, superseded resource-binding builders/resolvers, and unused domain vocabulary.

Notably vacuumed inactive resource-binding authority from the earlier migration frontier:

- `resourceBindingTraversalBuilder.ts`
- `resourceBindingPathBuilder.ts`
- `resourceBindingProvenanceBuilder.ts`
- `resourceBindingOriginResolver.ts`

These were not part of the active import graph despite being present as historical migration artifacts.

## Validation

- Phase 525 inactive-file audit: clean; no non-test/non-archive inactive candidates remain non-empty.
- Phase 522 audit: clean.
- Phase 523 audit: clean.
- Phase 524 audit: clean.
- No test files were vacuumed.
- No package `index.ts` entrypoint was vacuumed.

## Architecture consequence

The production surface now has less dormant semantic authority competing with the canonical relation/solver/rewrite path:

`scanner/lexer evidence -> semantic relations -> candidate/witness -> closure/fixed point -> solver -> canonical authority -> rewrite/saturation`

The next work should therefore target active scanner/lexer/resolver files, not resurrect or patch the vacuumed legacy modules.
