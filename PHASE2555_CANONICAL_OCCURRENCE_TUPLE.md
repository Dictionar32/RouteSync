# Phase 2555 — Canonical source-occurrence tuple encoding

## Implemented

`requestTypeDerivationSourceEvidenceInventory.ts` now URI-encodes the source-file component before serializing `(file, start, end)` into an occurrence key. This makes the tuple serialization boundary explicit and prevents reserved delimiter characters in a file path from being emitted as structural separators. Route, resource, and request occurrence keys share this canonical operation.

## Verified by the phase audit

Run `node scripts/audits/audit-phase2555-canonical-occurrence-tuple.cjs`. It checks the identity encoding, its use by the three source domains, preservation of inventory binding, and the fact that the legacy array producer is not mislabeled as a verified judgment.

## Explicitly not claimed

This is a source-identity correction, not closure of the semantic judgment pipeline. The active CLI path still calls `requestTypeDerivationProjectionPipeline.derive()` and receives `RequestType[]`. The production reasoning implementation and independent verifier for all 32 laws remain unimplemented/unwired. No full TypeScript typecheck, build, or end-to-end CLI test is claimed because this workspace snapshot has no installed `node_modules`.
