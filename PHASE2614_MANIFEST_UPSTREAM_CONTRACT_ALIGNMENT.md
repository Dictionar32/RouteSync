# RouteSync Phase 2614 — Manifest/Upstream Contract Alignment

## Scope

Continue from Phase 2613 by checking the actual manifest composition implementation against its declared upstream workflow contract, then repair any mismatch at the owner rather than weakening the contract or adding a duplicate interface.

## Root cause found

`ControllerInvocationManifestCompositionReasoningContract.workflow` in `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts` declares a required ordered step:

`bind-each-read-result-and-blocker-to-the-exact-requested-source-file-identity-before-inventory-construction`

The concrete `CONTROLLER_INVOCATION_MANIFEST_COMPOSITION_REASONING_CONTRACT` in `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` omitted that step even though the implementation already called `sourceDocumentIdentityBinding.bind(...)` before invocation analysis. The executable sequence and the declared workflow had drifted apart. This was a contract alignment defect, not a missing identity-binding implementation.

## Change

Restored the missing workflow step in the concrete composition contract at the exact position used by the implementation: after source-document read and before source-document creation/analysis. The existing `PhpSourceDocumentIdentityBindingInterface` remains the operation owner; no duplicate interface or fallback was added.

Also corrected `audit:phase2592-cli-manifest-upstream-production-path` so its executable gate assertion follows the current standalone composition loader and program factory rather than an obsolete earlier implementation pattern.

Added `scripts/audits/audit-phase2614-manifest-upstream-contract-alignment.cjs` and registered `audit:phase2614-manifest-upstream-contract-alignment` in `package.json`.

## Trace

```text
Source project identity
  -> canonical root identity
  -> controller source discovery
  -> source document read result / blocker
  -> source-document identity binding
  -> reject identity mismatch before analysis
  -> invocation semantic pipeline
  -> invocation judgment authority
  -> complete inventory authority
  -> manifest builder preparation
  -> manifest composition result
  -> request-resolution preflight
  -> upstream RequestType semantic pipeline
  -> manifest projection
```

## Validation

- Phase 2614 manifest/upstream contract alignment: 7/7.
- Phase 2613 CLI/manifest/upstream structural + syntax audit: 14/14.
- Phase 2592 production-path root-cause audit: 6/6. The audit passes because it accurately identifies missing production semantic capabilities as a blocker, not because those capabilities are implemented.
- `package.json` JSON parse: passed.
- TypeScript syntax transpilation for the manifest composition implementation: passed through Phase 2613 audit.

## Explicit remaining blocker

The repository still does not provide a concrete production `RequestTypeDerivationSemanticReasoningInterface` implementation and a complete independent verifier for all 34 canonical derivation laws. The CLI correctly requires a host-owned composition and fails closed if it is absent. This phase does not claim typecheck, build, Vitest, or end-to-end Laravel execution; `node_modules` is absent in this workspace.

## Architecture decision

Keep source identity, inventory completeness, and semantic judgment as separate upstream-owned contracts. CLI should wire the returned closed judgments and execute projection; it must not infer missing semantic results, repair identity mismatches, or invent a legacy `RequestType[]` fallback.
