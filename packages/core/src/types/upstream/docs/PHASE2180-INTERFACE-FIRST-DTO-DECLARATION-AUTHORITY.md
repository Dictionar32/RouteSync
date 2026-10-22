# Phase 2180 — Interface-First DTO Declaration Authority

## Defect traced

The DTO inventory producer explicitly marked every declaration identity unresolved, even when the source file contained a parseable PHP namespace and class declaration. The DTO declaration resolution authority interface existed as a contract but had no concrete authority or runtime executor wired to it. This meant the positive judgment contract was not executable and inventory evidence could not resolve a requested DTO without a fallback path.

## Changes

- The existing `dtoAstCanonical.ts` scanner derives the declaration's lexical namespace from its own tokens and asks the existing `phpClassNameResolutionAuthority` to qualify `namespace\\<DeclaredClass>`.
- No class identity is inferred from a filename or short-name match. Imports are deliberately not applied to a class declaration's own declared name.
- Added `laravelControllerResponseDtoDeclarationResolutionAuthority`, implementing the existing upstream interface.
- The authority verifies project identity with `laravelSourceIdentitySemantics`, rejects incomplete discovery, requires the requested reference to be resolved, matches only canonical qualified names, and preserves unresolved declaration identities as blockers to uniqueness.
- Added a transparent runtime executor that delegates to the authority's exact `resolve` judgment.
- Exported the existing interface and its implementation through upstream and package public entrypoints.
- Added targeted tests for canonical DTO identity, alias-resolved requested names, provenance retention, and incomplete-inventory closure.

## Deliberate boundary

This phase does not claim the DTO declaration judgment is already consumed by the integrated response pipeline. Controller response-attribute evidence still needs to carry the PHP class-name resolution judgment from the controller lexical context into evidence production, and the existing response authority must then consume the resulting DTO judgment without treating DTO source evidence as controller-file-local evidence. No parallel invocation authority, `relation`/`foundation` layer, or new subscanner was added.

## Verification

The focused Phase 2180 test was added. Build and full typecheck were not run in the assistant environment. Any ZIP integrity check is not a substitute for TypeScript compilation or test execution.
