# Phase 2397 — Integrated Response Composition Injection

## Audit and trace

`ControllerDataflowSemanticJudgmentAuthorityInterface` already owned source-correlated dataflow closure and retained both the exact invocation judgment and the integrated-response composition result. However, `controllerDataflowSemanticJudgmentAuthority.ts` imported and called `invocationSemanticIntegratedResponseComposition` directly inside `derive`. The operation was semantically upstream-owned, but the authority's dependency contract did not expose which composition instance governed execution.

## Root cause

The integrated-response composition operation existed as a closed interface and had a factory with explicit dependencies, but the consuming dataflow authority bypassed dependency injection by reaching for the production singleton. This made substitution and identity-level wiring verification impossible at the authority boundary.

## Changes

- Evolved the existing `ControllerDataflowSemanticJudgmentAuthorityInterface` and its contract from version 15 to 16.
- Added `integratedResponseComposition` as an explicit dependency using the existing `InvocationSemanticIntegratedResponseCompositionInterface`.
- Added `createControllerDataflowSemanticJudgmentAuthority`, which binds `derive` to the exact injected composition operation.
- Kept production behavior on the existing canonical `invocationSemanticIntegratedResponseComposition` instance; no duplicate interface or composition implementation was created.
- Updated two historical structural audits whose version assertions directly covered this authority.
- Added `audit-phase2397-integrated-response-composition-injection.cjs`.

## Validation

Run the focused audit and the two updated existing audits from the repository root:

```sh
node scripts/audits/audit-phase2397-integrated-response-composition-injection.cjs
node scripts/audits/test-phase2246-resource-authority-injection.cjs
node scripts/audits/test-phase1942-controller-payload-ambiguity-closure.cjs
```

These are structural audits only. They do not establish full TypeScript type correctness, package build success, Vitest success, or CLI end-to-end correctness.

## Remaining gaps

- The production composition singleton is still the selected default; this phase makes the choice explicit and injectable rather than removing the canonical default.
- Other authorities inside `controllerDataflowSemanticJudgmentAuthority.ts` remain imported as concrete singletons. Their ownership and injection need separate evidence-driven audits; this phase does not claim all dependencies have been closed.
- The invocation judgment → integrated response → runtime executor → manifest → CLI chain has not been executed end-to-end here.
- Route scanner subscanner ownership and `semantic/relations` imports remain open from prior phases.
