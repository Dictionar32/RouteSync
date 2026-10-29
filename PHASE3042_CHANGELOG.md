# Phase 3042 Changelog

- Added canonical typed `SemanticFactVisitor<R>` and interface-backed `semanticFactOperations.continueWith`.
- Covered all 37 current `SemanticFact` variants with an exhaustive visitor and `never` check.
- Migrated mod/ref fact assessment to the visitor so its consumer no longer owns a discriminant `switch`.
- Added Phase 3042 audit and report, plus the npm audit script.
- Preserved source identity, unresolved mod/ref status, the CLI manifest interface path, deleted relation-foundation constraint, and one-newline `collections.ts` invariant.
