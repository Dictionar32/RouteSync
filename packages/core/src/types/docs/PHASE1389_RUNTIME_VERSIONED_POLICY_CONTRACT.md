# Phase 1389 — Runtime executes a versioned upstream policy contract

## Ownership path

`SemanticDataflowQueryPolicyIntent` is declared at the source-project boundary. The upstream manifest builder resolves producer-domain intent into `SemanticDataflowQueryPolicyContract`. The manifest/flow/projection layers carry that contract without reclassifying facts. Runtime validates and executes the closed contract only.

## Contract evolution

- `contractVersion: 1` versions this contract independently of package and manifest versions.
- `selectedFacts`, `sourceFacts`, and `sinkFacts` are checked against the canonical closed judgment before execution.
- Fact membership uses a canonical semantic key, not JavaScript object reference equality, so serialized/reconstructed facts can still match.
- `additionalFlowSteps` and `barrierNodes` are explicit contract capabilities. The upstream materializer closes omitted intent values to empty collections; Runtime does not invent policy defaults.
- Multiple contracts matching the same judgment are rejected as ambiguous rather than silently taking the first one.
- Unsupported contract versions and invalid fact subsets fail closed.

## Validation

Run `npm run audit:phase1389-runtime-executes-versioned-policy-contract` alongside the Phase 1386–1388 audits. The source-only audit validates architectural boundaries; it is not a substitute for TypeScript compilation or integration tests.
