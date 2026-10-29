# Phase2966 — Assembly ADT Domain Continuation

## Trace

The CLI upstream composition path is:

`routeSyncCliUpstreamCompositionFactory.compose`
→ `requestTypeDerivationProductionPipelineAssembler.assemble`
→ `RequestTypeDerivationSemanticPipelineAssemblyResult`
→ `routeSyncCliManifestScanOperationFactory.create`
→ `ControllerInvocationManifestCompositionAuthorityInterface.compose`.

## Change

The existing upstream assembly result was a data-only discriminated union (`assembled` / `rejected`), requiring the CLI composition factory to switch on `assembly.kind`. The existing contract in `packages/core/src/types/upstream/requestTypeDerivationInterface.ts` now gives both outcomes a `continueWith` domain operation and a typed handler contract. The assembler creates each outcome with its corresponding operation. The CLI composition factory consumes `assembly.continueWith(...)` instead of switching on the assembly tag.

No generic collection utility was added. The change reuses the existing upstream assembly contract and preserves the rejected mismatch evidence and assembled pipeline. The manifest composition authority remains injected; the CLI does not manufacture semantic reasoning or authority.

## Verification

Run `npm run audit:phase2966-assembly-domain-continuation --silent` for structural checks. This audit does not establish a successful project typecheck, build, unit suite, or CLI end-to-end run. Those broader checks are not claimed here.
