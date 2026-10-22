# Phase2505 — Request producer upstream contract

## Trace

`FormRequestScanner` calls `requestProducer` from `scanner/subscanners/requestProducer.ts`. Before this phase, the implementation file declared its own `RequestProducerInput`, `RequestProducer`, and `RequestProducerResult`; the scanner also imported the result type from that implementation. This made the subscanner file both implementation and contract owner, so the upstream boundary was not authoritative.

## Change

- Introduced `types/upstream/requestProducerInterface.ts` as the named contract owner for input, result, and producer call signatures.
- Typed the existing `requestProducer` adapter with `RequestProducerInterface` using `export const requestProducer: RequestProducerInterface = Object.freeze(...)`.
- Removed duplicate local input/interface/result declarations from the implementation.
- Changed `FormRequestScanner` to import `RequestProducerResult` from the upstream contract.
- Did not move the producer implementation to another file as a substitute for fixing ownership.

## Verification

Run `node scripts/audits/audit-phase2505-request-producer-upstream-contract.cjs`; all 10 structural assertions must pass. Syntax checks are recorded separately in the phase handoff.

## Explicit remaining debt

This is a contract-ownership correction, not a completed subscanner retirement. The contract currently references scanner evidence types (`PhpArrayEntry`, `PhpMethodAst`, `PhpClassPropertyAst`) and `TypeInterner`, so the upstream type layer still has downward type dependencies to untangle by promoting source-evidence types to an appropriate compiler-neutral owner. The producer implementation continues to import `semantic/relations` and remains under `scanner/subscanners`; its semantic decisions have not been migrated in this phase. No claim is made that the Laravel scanner is free of `semantic/relations`, `semantic/foundation`, or subscanners, and no full project typecheck/build/Vitest/CLI integration run was performed.
