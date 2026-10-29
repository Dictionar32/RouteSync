# Phase 2870 — Fully Typed Runtime Scanner Operations

## Scope and honesty boundary

This phase models and audits the CLI → upstream manifest path using contracts already present in the repository. It does not claim that every export under `types/upstream` has been migrated, or that typecheck/build/e2e passed. The archive's prior Phase 2869 work is retained.

## Runtime trace: manifest construction

1. CLI consumer calls `controllerInvocationManifestBuilder.build(sourceProject, routeSelection)`.
2. `controllerInvocationManifestBuilder` is an exported const annotated with `ControllerInvocationManifestBuilderInterface`.
3. It constructs the explicit `controller_invocation_manifest_composition_input` and calls `routeSyncCliManifestScanOperationFactory.create(...).scan(input)`.
4. `routeSyncCliManifestScanOperationFactory` is annotated with `RouteSyncCliManifestScanOperationFactoryInterface`; its operation delegates to the injected `ControllerInvocationManifestCompositionAuthorityInterface.compose`.
5. Composition canonicalizes project identity. A blocked identity becomes `controller_invocation_manifest_source_project_identity_blocked`.
6. It discovers controller source files. A blocked discovery remains a distinct `controller_invocation_manifest_source_discovery_blocked` terminal.
7. It reads discovered source documents and binds each requested file identity. Identity rejections remain `controller_invocation_manifest_source_document_identity_rejected`; blocked reads remain `controller_invocation_manifest_source_documents_blocked`.
8. It runs the source invocation pipeline, delivers its results, and asks the invocation judgment authority to judge each result.
9. Inventory authority closes the source inventory. Rejected inventory remains `controller_invocation_manifest_inventory_rejected`; validated inventory is passed to `ManifestBuilderOperationPreparationInterface.prepare`.
10. The prepared `ManifestBuilderInterface.build()` returns the existing `ManifestBuilderJudgment`. `continueWith` on that judgment routes complete vs blocked outcomes; AST/source-model blockers remain distinguishable and are not normalized to an empty manifest.
11. The CLI terminal operation exposes `continueForDriftAudit(handlers)` so consumers continue through the terminal value's domain operation instead of dispatching on its `kind` themselves.

## Existing contracts to reuse

- CLI scan boundary: `RouteSyncCliManifestScanOperationInterface` and `RouteSyncCliManifestScanOperationFactoryInterface` in `packages/cli/src/manifestScanOperationInterface.ts`.
- Composition boundary and terminal outcomes: `ControllerInvocationManifestCompositionAuthorityInterface`, `ControllerInvocationManifestTerminalOperationInterface`, and `ControllerInvocationManifestTerminalOperationsFactoryInterface` in `packages/cli/src/parsers/php/controllerInvocationManifestCompositionInterface.ts`.
- Manifest build outcome and continuation: `ManifestBuilderInterface`, `ManifestBuilderJudgment`, `ManifestBuilderJudgmentHandlers`, and each outcome's `continueWith` in `packages/core/src/types/upstream/manifestBuilderInterface.ts`.
- Semantic dataflow value operations: `SemanticDependencyOperationsInterface`, `SemanticValueFlowOperationsInterface`, `SemanticDataFlowEdgeOperationsInterface`, `SemanticIdentifierOperationsInterface`, and `SemanticOperationOperationsInterface` in `semanticDataflowKnowledge.ts` (Phase 2869).

Do not create a second generic scan-result, relation, collection, or continuation abstraction while these domain contracts already cover the boundary.

## Runtime usage example

```ts
const manifest: ControllerInvocationManifest = await controllerInvocationManifestBuilder.build(
  sourceProject,
  routeSelection,
);

const auditResult = manifest.continueForDriftAudit({
  complete: completeJudgment => publishManifest(completeJudgment.manifest),
  manifestBlocked: blockedJudgment => stopForBlockedManifest(blockedJudgment),
  inventoryRejected: rejectedJudgment => stopForRejectedInventory(rejectedJudgment),
  sourceDiscoveryBlocked: blockedJudgment => stopForBlockedDiscovery(blockedJudgment),
  sourceProjectIdentityBlocked: blockedJudgment => stopForUncanonicalProject(blockedJudgment),
  sourceDocumentsBlocked: blockedJudgment => stopForBlockedReads(blockedJudgment),
  sourceDocumentIdentityRejected: rejectedJudgment => stopForIdentityRejections(rejectedJudgment),
});
```

The handler names above illustrate the existing contract's shape; adapt them to the concrete local handler interface and actual return types at the call site. Do not copy the example as a verified compile-ready snippet without checking those signatures.

## Migration rule for exported runtime values

Preferred public runtime operation:

```ts
export interface DomainOperationInterface {
  readonly execute: (input: DomainInput) => DomainJudgment;
}

export const domainOperation: DomainOperationInterface = Object.freeze({
  execute: (input: DomainInput): DomainJudgment => deriveDomainJudgment(input),
});
```

Avoid exported `function` declarations and exported arrow values without a named contract for domain operations. Do not add an interface to every pure value constructor/helper by rote: first classify the export as (a) domain operation, (b) value constructor, (c) constant/data, or (d) implementation-only helper. For (a), reuse/evolve the existing domain contract; for (b), use an existing domain factory contract if one exists; for (c), preserve the value's data type; for (d), consider making it non-exported. Do not hide decisions behind a generic helper interface.

## Remaining design debt discovered by source inspection

- The composition implementation still has local `if` decisions for canonicalization, discovery, identity rejection, and blocked reads. These are real control-flow branches, so this path is not yet “runtime without reasoning” in the strict sense. The next migration must move the decisions into existing upstream judgment operations where the domain contract has sufficient evidence; do not simply wrap the same branches in a new generic helper.
- The Phase 2869 source-regex audit counts exported arrows imperfectly and is not a TypeScript AST parser. Its results are an inventory aid, not proof that every export is interface-first.
- The upstream barrel `packages/core/src/index.ts` has explicit exports, but the export surface should be audited against all public declarations before claiming complete barrel coverage.
- `packages/core/src/types/upstream/collections.ts` remains intentionally empty (0 bytes).

## Verification status

This document is a source trace and migration model. It does not assert full typecheck, build, or end-to-end test success. Those require executing the repository's actual package scripts with its supported local dependencies and TypeScript version.
