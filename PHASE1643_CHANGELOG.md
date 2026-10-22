# Phase 1643 Changelog — Invocation Target Ambiguity

- Advanced `InvocationSemanticContract` from version 3 to version 4.
- Added interface-owned `invocation-target-ambiguity` rule and `callable_target_ambiguous` obligation with candidate identities.
- Deduplicated repeated invocation/callable identity witnesses before ambiguity assessment.
- Applied ambiguity closure policy to both aggregate and one-invocation semantic judgments.
- Added an ambiguity rule-trace entry; missing evidence, unresolved target, and ambiguous target remain distinct states.
- Updated contract regression expectations and added a regression case with two candidates plus duplicate evidence.
- Updated the prior dependency-slice audit to assert contract version 4 and repaired the stale authority binding audit to match the current implementation.
- Scanner remains a thin facade; runtime executor remains a pure call to the upstream authority.

Verification: 46/46 checks across six architecture audits pass. Full TypeScript compilation and Vitest were not verified: root `node_modules` is absent, and the available global TypeScript 5.8.3 cannot satisfy the repository's configured target/lib or find `node` and `vitest/globals` type definitions.
