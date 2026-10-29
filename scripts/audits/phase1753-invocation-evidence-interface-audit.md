# Phase 1753 — Invocation Evidence Interface Audit

## Scope

Interface-first review of invocation positional-argument evidence and the Laravel scanner's integrated invocation response path.

## Trace findings

1. `types/upstream/invocationSemanticJudgmentInterface.ts` used `InvocationPositionalArgumentEvidence | null` for input and `null` in multiple binding outcomes. This conflated distinct semantic states: evidence not established, evidence not required, and evidence not assessable because target resolution was blocked.
2. `types/upstream/invocationSemanticAlgebraInterface.ts` repeated the nullable representation as `InvocationArgumentFormEvidence`.
3. `types/upstream/invocationSemanticJudgmentAuthority.ts` normalized input with `?? null`, hiding whether callers had supplied a semantically meaningful state.
4. The static invocation contract in `invocationSemanticPipelineInterface.ts` also used `null` for no-evidence outcomes despite already having a typed positional-evidence result model.
5. `compiler/frontend/php/controllerDataflowAnalyzer.ts` already receives the integrated response from the upstream composition and projects its analysis while retaining the original response. That path remains wiring/projection; it is not the right owner for evidence classification.
6. Scanner retirement is not complete: a source scan still finds 53 references/import lines containing `subscanners` under `core/src/compiler/scanner`. The Resource subscanner import in `controllerDataflowAnalyzer.ts` remains a migration dependency and must be removed only after its upstream-owned contract/adapter is in place.

## Contract changes

- Replaced nullable positional-evidence input with the discriminated `InvocationPositionalEvidenceInput` union: `positional-evidence-established` or `positional-evidence-unproven` with a typed obligation.
- Added `InvocationPositionalEvidenceDisposition` for judgment outcomes: established, unproven, not required, or not assessable with a correlated target status.
- Updated binding judgments and algebra inputs to carry named semantic outcomes instead of `null`.
- Removed the `?? null` fallback from the authority boundary.
- Reused the existing static positional-evidence result model and added explicit not-required/not-assessable outcomes for static binding contracts.
- Updated affected invocation tests to provide tagged evidence judgments.

## Verification and limits

- Source scan: no `positionalEvidence: null`, `InvocationPositionalArgumentEvidence | null`, or `positionalEvidence ??` patterns remain under `packages/core/src`.
- This phase did not run TypeScript, Vitest, or the package build. Type-level correctness therefore still requires verification in the user's supported Arch Linux workspace.
- This phase does not claim subscanner retirement is complete; the 53 remaining references are an explicit next migration target.
