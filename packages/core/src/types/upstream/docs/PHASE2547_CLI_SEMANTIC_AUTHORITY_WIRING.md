# Phase 2547 — CLI Semantic Authority Wiring

## Audit finding

The manifest-lowering path imported `compiler/scanner/subscanners/SemanticTypeDeriver`, even though that file was only a compatibility facade over the already-existing `SemanticTypeDerivationAuthorityInterface` and `semanticTypeDerivationAuthority` operation. That made the active wiring look subscanner-owned and hid the canonical upstream authority boundary.

## Change

Both `routeManifestTypeLowering` and `routeManifestTypeLoweringAuthority` now invoke the existing interface-valued operation directly:

`semanticTypeDerivationAuthority.resolve({ resources, models, interner, routes }).result`

No new interface, duplicate authority, ADT variant, or semantic policy was introduced. The typed judgment is still validated by the existing authority implementation before its result is projected. The compatibility facade remains available for other legacy consumers but is no longer imported by these two lowering paths.

## Scope and remaining root cause

This closes the `SemanticTypeDeriver` facade dependency for semantic object-type derivation only. It does **not** close the larger RequestType derivation gap: the default lowering still calls `requestTypeDerivationProjectionPipeline`, whose implementation delegates to `createDerivationContext` and `aggregateRequestTypeGroups`; the CLI preflight gates that path but does not replace it with a production proof-producing `RequestTypeDerivationSemanticPipelineInterface`. The 32-law RequestType proof verifier and producer must be completed and wired before claiming RequestType derivation is interface-first end to end. No fake `derived` judgment is synthesized from `RequestType[]`.

## Verification

Run `npm run audit:phase2547-cli-semantic-authority-wiring` from the repository root. This is a structural source audit, not a package build or CLI end-to-end test.
