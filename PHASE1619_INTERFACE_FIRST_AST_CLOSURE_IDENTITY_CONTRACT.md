# Phase 1619 — Interface-First AST Closure Identity Contract

## Boundary

This phase changes only the existing AST semantic interface and its focused closure fixture. It does not migrate scanner wiring, semantic algebra, or runtime executors.

## Contract upgrade

`AstSemanticClosureRequest` now requires a caller-owned `requestIdentity`. Every closure outcome carries canonical snapshot identities for the seed facts, ordered rule set, resulting fact set, and derivation ledger. A successful fixed-point certificate repeats those same identities so consumers can correlate the certificate with the exact closure result instead of trusting only `stableFacts` / `rulesExhausted` booleans.

The identities are deterministic canonical serialization identities, not cryptographic hashes. They provide correlation and mismatch detection; they do not independently establish authenticity against a malicious producer. The closure authority remains responsible for producing the certificate.

## Trace findings

- `packages/core/src/types/upstream/astSemanticInterface.ts` owns `AstSemanticClosureRequest`, `AstSemanticClosure`, `AstSemanticInterface`, and the current closure implementation in the same file.
- Scanner references observed in `packages/core/src/compiler/scanner` use AST semantic terms and facts, while the closure contract itself is primarily exercised by the focused upstream fixture. No scanner or executor file is changed here.
- `requestTypeDerivationInterface.ts` already has a source-bound `RequestTypeDerivationSemanticPipelineInterface`; it is a useful boundary precedent, but it does not replace the AST closure contract.
- The legacy semantic decision algebra incompatibility introduced by Phase 1618 remains outside this interface-only phase.

## Validation status

- Static source audit checks the request identity, snapshot identities, result identities, and certificate correlation fields.
- TypeScript's recursive project graph currently reports numerous pre-existing errors in unrelated domain/upstream files. Phase 1619 must not be represented as a clean full typecheck until those are independently resolved.
- No full build or Vitest suite is claimed as passing.
