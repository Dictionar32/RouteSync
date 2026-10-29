# Phase2954 — Invocation Judgment-Owned Source Identity Operation

## Scope

This phase continues the upstream CLI manifest trace through source discovery, semantic invocation judgments, inventory correspondence, and the terminal manifest judgment.

## Trace

`controllerInvocationManifestBuilder.build(input)` → CLI composition authority → source discovery and source-document reads → `LaravelControllerInvocationSemanticJudgmentAuthority.judge(input)` → judgment-owned `relateSourceFileIdentity(candidate)` → `SourceFileIdentityRelationJudgment.continueWith(...)` → inventory correspondence judgment → manifest terminal judgment.

## Root issue

The inventory correspondence authority compared `judgment.sourceFile` to a candidate source directly through `laravelSourceIdentitySemantics`. The invocation judgment itself was a data-only ADT, so the consumer had to know how to derive the source-identity relation.

## Change

- Added `relateSourceFileIdentity(candidate)` to the common invocation-judgment contract.
- The operation delegates to the existing canonical `laravelSourceIdentitySemantics.relateSourceFiles` rule. It does not create a duplicate identity authority.
- The invocation judgment authority attaches the operation to each outcome variant.
- Inventory correspondence now obtains the relation through the judgment's operation and follows the relation through its existing `continueWith` operation.
- Bumped invocation judgment contract version from 2 to 3 and semantic contract metadata version from 15 to 16.
- Added focused coverage for same-identity and different-identity follow-up judgments.
- Updated the Phase2952 structural audit to expect the new judgment-owned operation.
- Updated the Phase2947 audit to locate canonicalization failure evidence in its current upstream contract owner, following the Phase2951 contract migration.
- Kept `packages/core/src/types/upstream/collections.ts` empty.

## Verification

- Phase2947 structural audit: 10/10 passed.
- Phase2948 structural audit: 10/10 passed.
- Phase2950 structural audit: 13/13 passed.
- Phase2951 structural audit: 11/11 passed.
- Phase2952 structural audit: 11/11 passed.
- Phase2953 structural audit: 11/11 passed.
- Phase2954 structural audit: 9/9 passed.
- TypeScript syntax transpilation: 5 changed TypeScript files, zero syntax diagnostics.
- `package.json` JSON parsing: passed.
- `collections.ts`: 0 bytes.
- Focused Vitest was not run because the workspace does not contain the Vitest executable.
- Full typecheck, full test suite, build, and CLI end-to-end were not run.

## Remaining limits

This phase gives the invocation judgment a domain operation for relating its source identity. Inventory correspondence still uses local filtering/counting, and its `continueWith` handlers still map the relation into a boolean predicate. This phase does not claim to eliminate all primitive reasoning or all exported function declarations repository-wide. A future change should only replace the remaining correspondence logic after inspecting existing upstream inventory contracts and avoiding duplicate authorities.
