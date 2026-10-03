# Phase 528 — Scanner Relational Cutover + Inactive Path Vacuum

Phase 528 continues the scanner/lexer/resolver frontier after the inactive-path cleanup.

## Architecture

The live request-derivation response/group boundary now follows:

`scanner evidence -> semantic relations -> RelationOption/candidate witness -> recursive relation projection/fold -> canonical RequestType`

The two active request-deriver files no longer use the forbidden procedural decision vocabulary. Presence is represented by `RelationOption`, collection traversal by relation projection/fold, and branch selection by `relationGate`.

## Inactive-path vacuum

A production-reference reachability pass over `compiler/scanner` removed 89 unreachable non-test TypeScript implementations, including duplicated route adapter/resolver families, legacy route parser helpers, obsolete cursor authorities, and unused resource-binding resolver helpers. The global inactive-file audit also removed seven non-scanner inactive files surfaced by the Phase 525 rule.

Tests were not deleted or modified; references from tests do not keep production implementations alive.

## Verification

- Phase 525 inactive-file audit: `allCandidatesEmpty=true`.
- Phase 528 target audit: all forbidden-token counts are zero.
- Target `transpileModule` diagnostics: zero.
- Full repository typecheck remains environment-limited by missing `node` and `vitest/globals` type definitions.
