# Phase 2993 — Fully Explicit Simplicity Typed Runtime Scanner Operations

## Scope and rule

This phase audits the real Laravel/PHP runtime route from upstream controller semantics through CLI composition and manifest projection. The rule is scoped to runtime exports on this route: exported runtime operations must be `export const name: NameInterface = Object.freeze({...})`; a named `export function name(parameter: Parameter): Output` or an inferred exported arrow is not the preferred runtime boundary. This is not a mechanical rewrite of every unrelated helper in `core/src/types/upstream`.

The domain model must own its decisions and offer domain operations to continue from outcomes. An ADT that only transports `kind` and payload while callers repeatedly inspect the `kind` is not considered complete. Generic callback combinators are not a replacement for schema-, source-, or manifest-specific operations.

## Verified runtime trace

### Controller schema authority

```text
ControllerMethodAst.body.validations
  -> controllerBodySemanticJudgmentAuthority.judge
  -> ControllerBodySemanticJudgment.inlineSchemaEvidence + schema + validationEntries
  -> laravelControllerExecutionDependencies
  -> controllerActionSchemaSemanticJudgmentAuthority.judge
  -> ControllerActionSchemaSemanticJudgment.derivation.schema
  -> resolveControllerActionContract
  -> controller action semantic publication: semantic.schema
```

This is an explicit upstream semantic path. Source-owned `inlineSchemaEvidence` prevents the downstream schema authority from reconstructing evidence presence from four collection lengths. Remaining source recognition (`validations.length === 0`) is still a primitive at the raw-syntax boundary and is documented, not hidden.

### CLI → invocation manifest

```text
controllerInvocationManifestBuilder.build(input)
  -> routeSyncCliManifestScanOperationFactory.create(authority).scan(input)
  -> ControllerInvocationManifestCompositionAuthorityInterface.compose(input)
  -> project identity canonicalization
  -> Laravel controller-source discovery
  -> source document reads + identity binding
  -> PHP source invocation semantic pipeline
  -> invocation judgment preparation + inventory closure
  -> manifest builder preparation
  -> ControllerInvocationManifest terminal ADT
  -> terminal.continueForDriftAudit(domain handlers)
```

The CLI entry point in `packages/cli/src/commands/scan.ts` consumes the injected composition bundle and uses ADT-owned operations (`continueForDriftAudit`, `continue`, `continueWith`) rather than rebuilding a second upstream semantic path. The exported runtime boundaries inspected here already follow the interface-typed object pattern:

- `createScanCommand: ScanCommandFactoryInterface`
- `routeSyncCliManifestScanOperationFactory: RouteSyncCliManifestScanOperationFactoryInterface`
- `controllerInvocationManifestBuilder: ControllerInvocationManifestBuilderInterface`
- `manifestSerializationOperations: ManifestSerializationOperationsInterface`
- `controllerActionSchemaSemanticJudgmentAuthority: ControllerActionSchemaSemanticJudgmentAuthorityInterface<SourceFile>`
- `semanticDataflowIRProjection: SemanticDataflowIRProjectionInterface`

### Manifest serializer and IR

`ManifestSerializer.ts` preserves `serialized.request.body.schema` in the serialized endpoint contract. The CLI also emits semantic dataflow IR through `semanticDataflowIRProjection.project(result.analysis.interface)`, where the projection consumes `DataFlowAuthorityInterface` closure rather than deriving closure itself.

**Important boundary:** the source trace does not yet prove a field-by-field lineage edge from this particular `ControllerActionSchemaSemanticJudgment.derivation.schema` through `ControllerInvocationManifest` into `RouteManifest.contract.request.body.schema`. The invocation manifest and route manifest are distinct projections. Likewise, the dataflow IR output is a separate semantic-dataflow projection, not evidence that controller request schema fields reached IR. End-to-end schema provenance is therefore still open; this report does not claim closure.

## Findings and next implementation order

1. **Keep the typed runtime export boundary.** The named runtime exports above already use `export const name: Interface = Object.freeze({...})`; do not replace them with exported functions or inferred arrows.
2. **Prioritize the missing schema bridge, not broad syntax churn.** Find the adapter that converts controller invocation semantic judgments into route contracts. Give that adapter one explicit typed interface and carry source identity + schema derivation origin + validation entries through the projection.
3. **Make schema derivation ADTs executable at the domain boundary.** `ControllerActionSchemaDerivation` currently identifies the outcome and carries a schema, while the completed judgment's strongest domain operation is still upstream `judge`. Add schema-specific outcome operations at the schema ADT boundary when wiring the actual route-contract consumer; do not add a generic `fold` or a callback-only abstraction.
4. **Keep source facts single-owned.** `inlineSchemaEvidence` belongs to the controller-body source judgment. Do not re-derive it from field counts in the schema authority, CLI, serializer, or IR.
5. **Audit exported helper functions by reachability, not by filename alone.** The upstream directory contains many exported function-shaped factories, validators, and value constructors. They should be converted only when evidence shows they are runtime operations on this path; bulk conversion would create churn and could duplicate semantic ownership.
6. **Keep primitive recognition at the syntax boundary explicit.** The `validations.length === 0` check and request-evidence `switch` remain visible findings. The next change should move knowledge into source-owned typed judgments/domain operations, not delete parser control flow mechanically.

## Laravel basis

Laravel routing documentation distinguishes route declarations and controller dispatch from the controller/request behavior that performs validation. Form Request validation and inline `$request->validate(...)` are separate evidence sources; RouteSync must preserve their origin and make the combination policy explicit upstream. Official references: Laravel Routing, Controllers, and Validation documentation.

## Verification boundary

The accompanying audit script checks exact source declarations and trace anchors in this workspace. It is a structural source audit, not a full TypeScript typecheck, runtime integration test, or proof of the still-open schema-to-route-manifest lineage. The repository's local dependency/test setup is not assumed to be present.
