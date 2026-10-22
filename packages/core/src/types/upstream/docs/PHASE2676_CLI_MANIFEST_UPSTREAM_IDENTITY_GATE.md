# Phase 2676 — CLI / manifest / upstream identity gate

## Root cause

Phase 2675 introduced `requestTypeDerivationInventoryMatchesAst`, but its only mandatory call site was inside conflict-ledger closure. The verifier's successful contribution-replay branch could therefore attempt to accept a non-conflict judgment without first proving that canonical inventory identities still corresponded to raw AST occurrences and source provenance. That was an authority-boundary gap: the conflict path had the check, while the common verification entrypoint did not.

A second source defect was an escaped literal `\\n` embedded in the verifier import list. Structural audits that searched for identifiers did not establish that the TypeScript source was syntactically valid. The import is now a real line break.

## Implementation

`requestTypeDerivationProofVerifier.verify` now validates `inference.preparedInput` against its raw AST inventory before branching on judgment kind. A mismatch raises the typed `RequestTypeDerivationSemanticProducerGapError` at stage `verification`; it does not repair, normalize, or silently replace forged identities. The conflict closure retains its own local check as defense in depth.

The CLI route remains:

```text
CLI scan/sync
  -> injected manifestComposition
  -> complete upstream manifest judgment
  -> routeManifestRequestResolutionPreflight.evaluate(manifest)
  -> injected RequestTypeDerivationSemanticPipelineInterface
  -> proof verifier (now checks AST/inventory before judgment dispatch)
  -> authority-backed projection
  -> manifest lowering only for `projected`
```

Both CLI commands use the same injected pipeline and manifest authority. The projection composition only lowers a manifest for the `projected` branch and returns `manifest_projection_blocked` otherwise. No legacy RequestType array fallback is introduced.

## Audit scope and limits

`audit:phase2676-cli-manifest-upstream-identity-gate` checks source wiring and key invariants. It is a structural audit, not a TypeScript compile or runtime test. Runtime tests and full CLI `scan`/`sync` against `examples/ecommerce-shop-source` remain unverified because the project dependencies / Laravel vendor autoloader are not available in this workspace. The existing `verification_incomplete` status for the full canonical semantic-law set remains unchanged.
