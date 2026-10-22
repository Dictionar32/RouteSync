# Phase 2703 — Fully Typed Runtime Scanner Operations

## Purpose

Continue the upstream CLI manifest runtime audit at the source of the semantic pipeline. This phase does not claim to complete the canonical 34-law proof verifier. It repairs a broken public-operation export, moves runtime operations onto interface-typed objects, and removes the branded primitive-string workaround from the composition-module source descriptor.

## Runtime trace

```text
ROUTESYNC_UPSTREAM_COMPOSITION_MODULE
  -> routeSyncStandaloneCompositionModuleSourceFactory.fromEnvironment
  -> RouteSyncStandaloneCompositionModuleSource
       | environment_not_configured
       | configured_module(location ADT)
  -> routeSyncStandaloneCompositionLoader.load
  -> validates exported requestTypeDerivationSemanticComposition
  -> routeSyncCliUpstreamCompositionFactory.compose
  -> requestTypeDerivationProductionPipelineAssembler.assemble
  -> routeSyncCliUpstreamCompositionInterface
       | manifestScanOperation
       | requestTypeDerivationPipeline
  -> CLI scan/sync: manifestScanOperation.scan
  -> routeManifestRequestResolutionPreflight.evaluate
  -> routeManifestProjectionCompositionFactory.create(pipeline).project
  -> semantic input preparation
  -> requestTypeDerivationSemanticReasoning.infer
  -> requestTypeDerivationProofVerifier.verify
  -> coverage / decision / authority / integrity
  -> manifest projection only if the semantic pipeline permits it
```

## Source-level changes applied

1. `packages/cli/src/standaloneCompositionLoader.ts`
   - Removed `RouteSyncStandaloneCompositionModuleSpecifier` and the `unique symbol` brand.
   - Replaced the branded primitive with `RouteSyncStandaloneCompositionModuleLocation`, a discriminated union of `absolute_filesystem_path`, `relative_filesystem_path`, and `package_specifier`.
   - The loader accepts the domain source ADT and exhaustively resolves its location variant.
2. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationSemanticReasoning.ts`
   - Replaced the loose exported identity-conflict checker function with `requestTypeDerivationIdentityConflictLedgerVerification: RequestTypeDerivationIdentityConflictLedgerVerificationInterface = Object.freeze({ matchesInput })`.
3. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProofVerifier.ts`
   - Verifier calls the named operation object at the identity-conflict ledger boundary.
4. `packages/core/src/compiler/semantic/request-type-derivation/requestTypeDerivationProductionComposition.ts`
   - Replaced exported callable assembler with `requestTypeDerivationProductionPipelineAssembler: RequestTypeDerivationProductionPipelineAssemblerInterface = Object.freeze({ assemble })`.
   - Replaced the callable requirement helper with the interface-typed `requestTypeDerivationSemanticPipelineRequirement` object.
   - Corrected stale comments: assembly is wiring, not proof completeness; the independent verifier is still partial.
5. `packages/cli/src/upstreamCompositionFactory.ts`
   - Calls `requestTypeDerivationProductionPipelineAssembler.assemble(semanticComposition)`.
6. `packages/core/src/upstream.ts` and `packages/core/src/index.ts`
   - Retired references to the nonexistent `requestTypeDerivationDuplicateIdentityRejectionMatchesInput` export.
   - Export the actual `requestTypeDerivationIdentityConflictLedgerVerification` object and its interface type.
7. `scripts/audits/audit-phase2659-identity-conflict-policy-alignment.cjs`
   - Updated stale assertions to check the current operation-object name and actual `manifestScanOperation.scan` runtime route.
8. Added `scripts/audits/audit-phase2703-upstream-runtime-interface-operations.cjs` and package script `audit:phase2703-upstream-runtime-interface-operations`.

## Audit results

- Phase 2659 structural audit: **14/14**.
- Phase 2660 structural audit: **10/10**.
- Phase 2661 structural audit: **6/6**.
- Phase 2702 structural audit: **7/7**.
- Phase 2703 upstream runtime interface audit: **9/9**.
- TypeScript syntax transpilation of 8 changed `.ts` files: **8/8** without syntax diagnostics.

These are source assertions and syntax transpilation, not a full typecheck or behavioral integration suite. The repository archive has no workspace `node_modules`; `tsc --noEmit -p tsconfig.json` cannot run successfully because built-in type definitions (`node`, `vitest/globals`) and required compiler/lib configuration are unavailable in this environment.

## Unresolved root semantic blocker

`requestTypeDerivationProofVerifier.verify` still returns `verification_incomplete` for the supported group-replay and identity-conflict slices and lists `REQUEST_TYPE_DERIVATION_LAW_IDS` as missing. The canonical contract contains **34 laws**. No complete independent verifier for all 34 laws was implemented in this phase, so the pipeline must continue to fail closed and must not project a verified RequestType manifest from partial evidence.

The remaining source-level task is to implement and test each independent law check against raw AST/input and producer receipts, build an exact verified/missing-law coverage result, and only allow the authority path when every required law is verified. This archive does not claim that task is complete.
