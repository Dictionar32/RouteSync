# RouteSync Phase 2567 — CLI Source Document Identity Binding

## Root cause

The CLI manifest composition trusted the result returned by `PhpSourceDocumentReaderInterface.read` and immediately admitted successful documents to the source inventory. The default reader preserves the requested source path, but the interface allows an injected reader implementation. Before this phase, there was no upstream operation proving that a returned complete document, a blocked read result, and its blocker all refer to the exact source file requested by discovery.

This left a hole in the evidence chain:

`discovery source identity → read request → returned document → invocation pipeline → judgment inventory`

The inventory authority can validate the identities it receives, but it cannot prove that the reader returned the document for the original discovery request if that relationship was discarded before inventory construction.

## Implemented change

- Added `PhpSourceDocumentIdentityBindingInterface` in `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingInterface.ts`.
- Added the named upstream operation `export const phpSourceDocumentIdentityBinding: PhpSourceDocumentIdentityBindingInterface` in `packages/core/src/types/upstream/phpSourceDocumentIdentityBindingAuthority.ts`.
- The operation returns a closed ADT: `php_source_document_identity_bound` or `php_source_document_identity_rejected`.
- Complete reads must retain the requested source identity. Blocked reads must retain it in both the read result and its blocker.
- Injected the operation into `ControllerInvocationManifestCompositionDependencies` and wired it in the existing composition root.
- CLI composition rejects mismatched identity evidence before invocation analysis, semantic judgments, inventory construction, or manifest building.
- `scan` and `sync` handle this rejection as a terminal result rather than treating it as an empty source set or proceeding with partial evidence.
- Exported the existing contract and operation through the core and upstream public barrels.
- Evolved the existing composition reasoning contract from version 10 to version 11, adding the identity-binding obligation and terminal rejection rule. No parallel legacy/v2 contract was created.
- Added a focused behavioral test for matching complete reads, mismatched complete reads, and mismatched blocker identity.

## Active path after this phase

`canonical project identity → closed controller discovery → source read → upstream source-document identity binding → source-bound invocation pipeline → injected delivery operation → invocation judgment authority → inventory closure authority → validated receipt → injected manifest builder preparation`

An identity rejection stops the chain before semantic analysis. It does not attempt to repair or reclassify the source identity.

## Validation evidence

- Phase 2552: 11/11
- Phase 2554: 20/20
- Phase 2556: 11/11
- Phase 2557: 12/12
- Phase 2558: 9/9
- Phase 2560: 14/14
- Phase 2561: 15/15
- Phase 2562: 10/10
- Phase 2563: 11/11
- Phase 2564: 13/13
- Phase 2565: 15/15
- Phase 2566: 16/16
- Phase 2567: 15/15

**Total structural assertions: 172/172 passed.**

Additional checks:
- Three direct runtime probes passed: matching complete read → bound; mismatched complete read → rejected; mismatched blocker identity → rejected.
- Syntax transpilation passed for all nine changed TypeScript implementation, test, and barrel files.
- `package.json` JSON parse passed.
- ZIP integrity passed.

## Checks not passed / not run

A full repository typecheck did not pass. The globally installed TypeScript compiler cannot parse the repository's configured `es2025` target/lib and also reports existing syntax errors in `packages/core/src/compiler/scanner/upstream/route/effectiveControllerActionPolicyResolver.phase921.test.ts`. A targeted strict compile of the upstream operation pulled in unrelated existing type errors elsewhere in core; it reported no diagnostics in the new identity-binding files themselves. Package build and Vitest were not run in this environment.

## Remaining root cause

The RequestType semantic pipeline still has no concrete production composition for source reasoning, the complete 32-law proof verifier, decision, and authority. The CLI correctly refuses to substitute the legacy bare `RequestType[]` solver, but a real production composition must still be implemented and connected before the full scan/sync route can complete. This phase does not claim that gap is solved.
