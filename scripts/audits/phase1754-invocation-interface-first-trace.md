# Phase 1754 — Invocation interface-first trace

## Findings

1. `InvocationSemanticInput.positionalEvidence` is a required discriminated domain input, not a nullable field.
2. `analyzeInvocationSemanticAlgebra` still supplied `null` to `deriveInvocationJudgment`, contradicting the upstream interface and losing the named evidence disposition.
3. `deriveInvocationJudgment` and `analyzeInvocationJudgmentAlgebra` had default parameters that synthesized `positional-evidence-unproven` internally. The first default also referenced `requestedInvocation` from the wrong scope. This weakened the explicit-input contract and could fail typechecking.
4. `controllerDataflowAnalyzer.ts` consumes the integrated response projection, but still imports `mapResourcePhpAstToUpstream` from `scanner/subscanners/resource`. Subscanner retirement is therefore not complete.

## Change

- Removed implicit defaults from the two single-invocation algebra entry points. Callers must provide `InvocationPositionalEvidenceInput`.
- Batch derivation now supplies an explicit `invocationPositionalEvidenceUnproven(invocation)` judgment for each discovered invocation instead of `null`. This preserves the current conservative semantics: ordered argument identities alone do not prove positional call-form semantics.
- The integrated response projection and Laravel scanner wiring were not moved or duplicated.

## Architecture guidance

Keep the ownership chain: source evidence / typed knowledge → positional evidence judgment → invocation semantic judgment → validated or rejected integrated publication response → scanner projection. Do not let the scanner reconstruct evidence dispositions or silently fill missing semantic inputs. The next migration should replace the Resource subscanner dependency with a canonical upstream interface and migrate all consumers before removing the subscanner.

## Validation boundary

This audit is source inspection plus targeted textual patching. Typecheck, tests, and build were not run in this environment. The ZIP integrity check is separate from TypeScript correctness.
