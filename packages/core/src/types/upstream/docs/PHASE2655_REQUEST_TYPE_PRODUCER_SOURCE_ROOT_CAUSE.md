# Phase 2655 — RequestType producer: source-level root cause and correct evolution path

## Result

The blocking defect is **not** a missing `export` of an interface. The canonical interface and contract already exist and are exported. The missing source edge is a concrete semantic producer and an independent complete-law verifier. Adding another `export const ...: Interface` wrapper around the assembler would only repackage the missing capabilities and would not repair the source problem.

## Canonical path that already exists

```text
Laravel/PHP route source
  → AST / RouteSemanticFlow / ResourceAst / RequestAst
  → CLI manifest composition authority
  → source project identity + source document identity + source inventory closure
  → RequestTypeDerivationInput
  → requestTypeDerivationSemanticInputPreparation.prepare(input)
      → requestTypeDerivationSourceEvidenceInventory.inventory(input)
          → canonicalRouteIdentity / canonicalResourceIdentity / canonicalRequestIdentity
          → canonical route/resource/request occurrence keys and locations
      → request resolution inventory + resource resolution inventory
      → explicit request/resource assessments
  → RequestTypeDerivationSemanticReasoningInterface.infer(preparedInput)  [MISSING CONCRETE PRODUCER]
  → closed RequestTypeDerivationJudgment ADT + source receipts + contribution receipts + closure ledger
  → RequestTypeDerivationProofVerificationInterface.verify(inference)   [MISSING INDEPENDENT COMPLETE-LAW VERIFIER]
  → decision → authority-integrity gate → authority assessment
  → RequestTypeDerivationSemanticPipelineInterface.derive(input)
  → authority-backed manifest projection
```

## Source-level findings

1. `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` owns the canonical AST-facing input types, source evidence references, identity/occurrence keys, judgment ADT (`derived | incomplete | conflict | invalid_input`), proof/receipt/closure types, 34 required law IDs, and reasoning/verifier/decision/authority/composition interfaces.
2. `packages/core/src/types/upstream/index.ts` exports the canonical interface; `packages/core/src/index.ts` exposes the public core API. A duplicate interface or second contract version would split authority instead of fixing the missing implementation.
3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSourceEvidenceInventory.ts` implements the existing inventory/identity contract. `requestTypeDerivationSemanticInputPreparation.ts` composes that inventory with request/resource resolution ledgers. These operations are real implementations, but they stop before semantic judgment production by design.
4. `requestTypeDerivationSemanticPipelineAssembler.ts` wires supplied capabilities in the correct order and enforces contract identity. `requestTypeDerivationProductionComposition.ts` only assembles supplied capabilities and exposes a fail-closed resolution; the separate `requestTypeDerivationSemanticComposition.ts` exports a concrete composition, but the verifier still returns `verification_incomplete` until all 34 canonical laws have independent checks.
5. `packages/cli/src/standaloneCompositionLoader.ts` requires the host module named by `ROUTESYNC_UPSTREAM_COMPOSITION_MODULE`. The executable cannot run a source scan without a concrete semantic composition. `scan` and `sync` correctly reject an absent assembled pipeline before manifest source acquisition.
6. The legacy RequestType array derivation does not carry the canonical judgment ADT, source disposition receipts, contribution transitions, closure ledger, or independently verified coverage. It must not be promoted to `derived` by wrapping its output.

## Required implementation order

1. **Reasoning producer** — add a semantic implementation under `packages/core/src/compiler/semantic/request-type-derivation/` whose exported operation is typed against `RequestTypeDerivationSemanticReasoningInterface`. Follow the repository pattern `export const requestTypeDerivationSemanticReasoning: RequestTypeDerivationSemanticReasoningInterface = Object.freeze({ infer })`. It must consume the prepared packet and preserve the exact input/preparation packet; it must emit a real closed judgment, not a projection of `RequestType[]`.
2. **Proof construction** — the same semantic result must produce source dispositions for every route/resource/request, request/resource resolution relations, group contributions, before/after transitions, conflict/unresolved ledgers, and a closure that reconciles every source and group output. Identity must be derived from the canonical inventory, not reconstructed in CLI or scanner.
3. **Independent verifier** — implement an operation typed as `RequestTypeDerivationProofVerificationInterface`. It must check every member of `REQUEST_TYPE_DERIVATION_LAW_IDS` against the source input and proof witnesses, return typed counterexamples on the first violated obligation (or a well-defined failure ledger), and return `kind: 'valid'` only after checking complete law coverage. Never copy producer assertions into `verifiedLaws` without checking the witnesses.
4. **Composition** — implement the existing decision, authority, and integrity capability contracts using the exact `requestTypeDerivationContract` singleton, then export one `requestTypeDerivationSemanticPipelineComposition` value from a real semantic composition module. The CLI loader can then load it without adding a second authority path.
5. **End-to-end tests** — test derived, incomplete, conflict, invalid input, exact-vs-normalized request resolution, duplicate identity with distinct occurrences, reused source coordinates, and evidence/input mismatch. Assert that manifest projection is reachable only after a valid complete-law verification and accepted authority integrity result.

## Explicit non-solutions

- Do not add an empty or fabricated `export const ...: Interface` just to satisfy a grep audit.
- Do not mark the 34 law IDs as verified with a literal object.
- Do not wrap legacy `RequestType[]` in a `derived` judgment.
- Do not move semantic classification into CLI, manifest projection, AST scanning, or the subscanner.
- Do not call the structural audit a successful end-to-end CLI test.

## Verification boundary

The CLI/manifest path and the source inventory/identity path can be structurally traced. Full semantic closure remains blocked until the concrete reasoning producer and independent verifier exist. A structural audit should pass while explicitly reporting this blocker; it must not convert absence into a success claim.
