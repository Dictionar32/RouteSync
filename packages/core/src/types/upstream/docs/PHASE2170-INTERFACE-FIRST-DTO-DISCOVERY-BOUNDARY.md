# Phase 2170 — Interface-first DTO discovery boundary

## Scope

This phase changes the upstream type contract only. It does not wire the DTO inventory producer, replace the legacy response-attribute resolver, or modify runtime execution.

## Contract correction

The prior interface called its completeness witness project-wide even though `scanDtoAsts` currently scans only `app/Http/DTOs`. That was a semantic overclaim: an inventory scoped to one directory cannot prove discovery of every DTO declaration in the Laravel project.

The revised interface therefore:

- names the scan boundary explicitly as `app/Http/DTOs`;
- retains the project root and discovered source-file identities in a discovery receipt;
- distinguishes a complete scoped scan from an incomplete scan with a discriminated union;
- makes missing roots, unreadable files, and parse failures explicit blockers rather than allowing them to masquerade as a successful empty inventory;
- keeps declaration resolution as a separate closed semantic judgment, with resolved, unresolved, and ambiguous outcomes;
- does not promote declaration resolution into a response contract or response semantic product.

## Required follow-up before wiring

1. Update the existing DTO discovery producer to return the new complete/incomplete inventory ADT and collect discovered source-file identities.
2. Ensure directory existence, read failures, and parse failures are represented by the incomplete arm.
3. Implement the declaration-resolution authority against typed class identity only; do not fall back to short-name/path guessing.
4. Route the existing integrated response semantic authority through the closed judgment.
5. Remove the legacy resolver only after focused tests demonstrate parity and explicit blocker behavior.

## Verification

No build or typecheck is claimed for this phase. The repository's full build was not run. The change is intentionally interface-first and is not yet wired to the scanner runtime.
