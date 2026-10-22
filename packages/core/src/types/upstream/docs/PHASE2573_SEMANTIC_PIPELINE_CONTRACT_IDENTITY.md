# Phase 2573 — Semantic Pipeline Contract Identity

## Root cause

The CLI's pipeline-resolution ADT previously distinguished only supplied vs missing composition. A caller could supply a `RequestTypeDerivationSemanticPipelineInterface` whose `contract` was a separately constructed but structurally compatible object. The assembler binds reasoning, verifier, decision, and authority to one exact contract instance, but the CLI consumer boundary did not require that instance to be the canonical upstream `requestTypeDerivationContract`.

## Change

- Extended the existing resolution ADT with `semantic_contract_identity_mismatch`; no duplicate contract/interface was introduced.
- The existing resolver now exposes a pipeline only when `pipeline.contract === requestTypeDerivationContract`.
- A mismatch returns expected/supplied contract evidence as data. It does not infer, repair, or substitute a pipeline.
- `scan` and `sync` continue to fail closed before project identity/source acquisition for unavailable pipelines, and their diagnostic now includes canonical contract binding.
- No legacy solver fallback was added.

## Boundary

This closes a contract-identity gap in the CLI composition boundary. It does **not** implement the missing production semantic reasoning producer or independent verifier for all 32 derivation laws. The CLI remains intentionally unusable without a real production composition; wrapping legacy `RequestType[]` output as a verified judgment remains prohibited.

## Validation

`audit:phase2573-semantic-pipeline-contract-identity` checks the ADT, exact canonical identity check, fail-closed CLI ordering, and syntax transpilation. Full typecheck, package build, Vitest, and CLI E2E require the repository's supported dependency environment and are not claimed by this audit.
