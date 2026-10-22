# Phase 1562 — Interface-first request-type proof closure

## Scope

This phase extends the upstream contract only. Scanner wiring and runtime executor remain byte-for-byte unchanged so the semantic model can be strengthened before any consumer migration.

## Trace findings

### Upstream contract

`packages/core/src/types/upstream/requestTypeDerivationInterface.ts` already expresses source evidence, exact/normalized request resolution, route/resource/request receipts, action/response contribution receipts, conflicts, closure, a judgment, and `derive`/`verify` authority methods.

The remaining proof gap was that `RequestTypeGroupReceipt` recorded only `resultIdentity`. Identity cannot attest the actual `actions` and `response` emitted by a group. A judgment could therefore contain a group result whose details diverged from the proof while retaining the same identity.

### Scanner consumer

`packages/core/src/compiler/scanner/subscanners/request-deriver/groupAggregator.ts` currently owns semantic decisions in scanner code:

- `lookupRequest` uses `relationFirstOption` across exact and lower-case keys, so it selects a first matching key rather than representing exact-vs-normalized ambiguity as a semantic conflict.
- `requestValue` returns an empty option on a miss; `aggregateRequestTypeGroups` silently skips that route rather than returning an unresolved receipt.
- resource and request indexes add aliases into string-keyed indexes without an explicit duplicate-identity judgment.
- route grouping uses a lower-cased resource name string directly.
- the fold merges actions and response in the scanner; those decisions are not accompanied by proof receipts.
- only `no_request` is excluded in the fold; framework-owned request binding is not separately represented in the output contract there.

`packages/core/src/compiler/scanner/subscanners/RequestTypeDeriver.ts` returns `readonly RequestType[]` only. It does not expose a closed judgment, proof, closure status, or verifier result to downstream consumers.

### Runtime executor

`packages/core/src/compiler/semantic/type-derivation/semanticTypeDerivationRuntimeExecutor.ts` remains unchanged in this phase. It must not be migrated until an authority implementation can produce and verify the complete contract.

## Phase 1562 model change

- `RequestTypeGroupReceipt.result` now records the complete `RequestType` output, not just its identity.
- Added the semantic law `group_receipt_matches_judgment_output`.
- Added verification failure `group_output_mismatch` so an authority/verifier can reject output/proof divergence.
- Static audit checks the new proof obligation alongside the prior source-domain, request-binding, contribution, and closure obligations.

## Validation

- `node scripts/audits/audit-phase1562-request-type-output-proof-closure.cjs`: 14/14 static checks pass.
- This is not an authority implementation, scanner migration, runtime migration, full type-check, or full build. The previous focused TypeScript check was blocked by diagnostics in imported modules (35 diagnostics; zero directly in the changed interface).

## Architectural next steps

1. Implement the upstream authority against this interface and make `verify` independently check source inventory, identity uniqueness, route dispositions, contribution receipts, group outputs, relations, and closure.
2. Test exact-match precedence, normalized ambiguity, duplicate resource identity, framework-request exclusion, action replacement/retention, response retention, and output-proof mismatch.
3. Wire `RequestTypeDeriver` to consume the authority judgment and project only after the judgment is closed or return the explicit incomplete/conflict state.
4. Simplify `groupAggregator.ts` only after its semantic decisions are authority-owned.
5. Migrate the runtime executor last, to execution/delegation over the verified contract.
