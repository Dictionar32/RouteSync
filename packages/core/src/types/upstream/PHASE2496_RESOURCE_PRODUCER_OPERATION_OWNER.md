# Phase 2496 — Resource Producer Operation Ownership

## Trace result

The existing upstream `ResourceProducerInterface` already defines the producer's public operation contract. The canonical `laravelResourceScanner` and the Resource binder both consumed the implementation from `compiler/scanner/subscanners/resourceProducer.ts`; this made a subscanner the implementation owner even though its consumers are production boundaries.

## Change

- Reused the existing upstream `ResourceProducerInterface`; no duplicate interface was introduced.
- Established `compiler/scanner/operations/resourceProducer.ts` as the implementation owner for the existing producer operation.
- Rewired both `laravelResourceScanner.ts` and `binders/resource/resourceBinder.ts` to that operation owner.
- Removed the old `subscanners/resourceProducer.ts` module so production imports cannot keep treating it as the owner.
- Kept the public operation explicitly typed as `export const resourceProducer: ResourceProducerContract = Object.freeze(...)`.

## What this does not claim

This is an ownership/wiring correction, not completion of the entire Resource interface-first migration. The operation implementation still imports `semantic/relations` and calls the Resource field producer and property producer under `subscanners`. Those are real remaining debts; this phase does not claim relation-free execution, subscanner retirement across all Resource operations, or full semantic decisions moved upstream. The next root-cause change must model the producer's output judgments in the existing upstream contract/authority and make the operation consume those judgments, rather than merely translating relation combinators into local conditionals.

## Verification

Run `node scripts/audits/audit-phase2496-resource-producer-operation-owner.cjs`. This structural audit checks the owner, existing interface usage, and both active consumer paths. It does not replace package typecheck, Vitest, build, or CLI integration tests.
