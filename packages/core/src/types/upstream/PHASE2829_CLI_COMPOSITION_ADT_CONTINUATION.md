# Phase 2829 — CLI Composition ADT Domain Continuation and Manifest Trace

## Runtime change

`RouteSyncCliUpstreamCompositionResolution` now gives both closed outcomes a domain-owned `continueForCliComposition` operation. Its handlers are deliberately CLI-composition-specific (`compositionAvailable` and `semanticAssemblyRejected`), rather than introducing a generic reasoning/visitor primitive. The production CLI factory consumes this operation to create the program or preserve the exact upstream assembly rejection. The composition factory remains an interface-first frozen operation object.

The public CLI barrel exports the continuation-handler contract explicitly.

## Audited runtime trace

`RouteSyncCliProgramFactoryInterface.createFromSemanticComposition`
→ `routeSyncCliUpstreamCompositionFactory.compose`
→ existing `requestTypeDerivationProductionPipelineAssembler.assemble`
→ explicit `routesync_cli_upstream_composition_available | routesync_cli_upstream_semantic_assembly_rejected` ADT continuation
→ `routeSyncCliProgram.create(composition)` only for the available outcome
→ scan/sync commands
→ `RouteSyncCliManifestScanOperationInterface.scan(input)`
→ `ControllerInvocationManifestCompositionAuthorityInterface.compose(input)`
→ source-project identity canonicalization and controller discovery
→ source-document read and identity binding
→ upstream invocation pipeline delivery and inventory authority
→ manifest builder preparation and `ManifestBuilderJudgment`
→ semantic-dataflow manifest projection and downstream validation/serialization/persistence.

The authority remains the owner of source completeness and manifest validity. Discovery/read/identity/inventory rejections must remain blocked/rejected outcomes; they are not converted to empty successful manifests. The CLI composition ADT preserves the upstream assembly rejection as-is.

## Upstream contract review and recommendations

- Reuse the existing `RequestTypeDerivationSemanticPipelineCompositionInterface`, production pipeline assembler, manifest scan interface, and controller-invocation manifest authority. No replacement upstream contract was introduced.
- Continue interface-first runtime exports: `export const operation: ExistingInterface = Object.freeze({...})`; keep implementation callbacks private and route callers through the operation property.
- Keep domain follow-up behavior on the relevant ADT variant. Do not add generic reasoning primitives or generic relation dispatch to the CLI composition boundary.
- Treat `complete`/`blocked` and `assembled`/`rejected` as semantically distinct. Do not synthesize a successful-looking manifest after a blocked source pipeline.
- `packages/core/src/types/upstream/collections.ts` remains empty (0 bytes) as required.

## Validation limits

The focused structural audit checks the composition ADT, active consumer, manifest contract and upstream empty-file constraint. It does not establish TypeScript typecheck, package build, runtime tests or CLI E2E. Those remain unverified when dependencies/toolchain are unavailable.
