# Phase 3086 Changelog

- Converted `createPhpQualifiedClassName` from a standalone exported arrow function to `phpQualifiedClassNameFactory: PhpQualifiedClassNameFactoryInterface`.
- Added the explicit `create` domain operation and froze the factory object.
- Migrated direct call sites and the root core export to the operation object.
- Added `scripts/audits/audit-phase3086-repository-wide-export-interface-migration.cjs` and npm script `audit:phase3086-repository-wide-export-interface-migration`.
- Added a repository-wide declaration inventory covering `.ts` and `.tsx` under `packages/`.
- Preserved the deleted relation-foundation boundary and the one-newline `collections.ts` invariant.
- Recorded that the repository-wide conversion remains incomplete: 520 exported function declarations and 335 exported arrow constants remain in the scanned source set.
