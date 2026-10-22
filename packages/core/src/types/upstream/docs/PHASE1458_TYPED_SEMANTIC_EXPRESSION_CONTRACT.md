# Phase 1458 — Typed semantic expression contract

## Source trace

The previous candidate contract represented expression candidate identity with string literals and the semantic decision contract represented rule identity and precedence with strings and numeric priorities. Candidate evidence for `instanceof` retained the operator token but discarded the already-computed `before/operator/after` partition. The AST runtime then searched for the same top-level operator again.

## Changes

- Replaced expression candidate identities with a closed vocabulary of `unique symbol` identities. Lexical spellings remain at the source-observation boundary because PHP token text is source evidence, not semantic identity.
- Extended candidate evidence to carry `TokenOccurrenceEvidence`, including complete source partitions.
- Changed semantic rule identity to symbol identity and replaced numeric priorities with an explicit precedence relation.
- Made the decision algebra validate duplicate identities, unknown/self/duplicate precedence edges, and cyclic or ambiguous precedence before running derivations.
- Wired the `instanceof` AST rule to consume the partition from candidate evidence instead of performing another top-level search.
- Added focused tests and a static audit for the contract boundary.

## Remaining migration frontier

Assignment candidate evidence now carries all top-level assignment occurrences, and the expression-AST path passes those occurrences into assignment-parts algebra. The algebra prefers those partitions over the locator. Statement-level `classifyAssignment()` still reaches `parseAssignmentParts()` without candidate evidence and retains the structural locator fallback. `match` arm `=>` and `as` operator paths also need per-consumer tracing before runtime helpers can be reduced.

## Verification

The static audit is designed to run without the package dependency tree. A full TypeScript build and Vitest run are not claimed here because the workspace does not contain the project's local dependencies; the available global TypeScript compiler is older than the configured target and cannot load the configured Node/Vitest type libraries.
