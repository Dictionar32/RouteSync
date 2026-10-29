# Phase2967 — Fully Explicit Typed Runtime Scanner: Upstream → CLI → Manifest

## Intent

Model the real runtime path and identify where knowledge is still represented as consumer-owned branching/callback protocol. Runtime entrypoints on this path must use an existing or newly justified interface as an explicit object type:

```ts
export interface OperationInterface {
  readonly execute: (input: OperationInput) => Promise<OperationJudgment>;
}

export const operation: OperationInterface = Object.freeze({
  execute: async (input: OperationInput): Promise<OperationJudgment> => {
    // delegate to upstream domain operations
  },
});
```

Do not mechanically convert every function in the repository. First establish that it is a runtime entrypoint, identify its contract and consumers, then migrate the whole traced path. Avoid `export function name(parameter: Parameter): Output` and avoid `export const name = (parameter: Parameter): Output => ...` for those entrypoints. Local pure helpers are not automatically runtime entrypoints.

## Canonical runtime trace

1. CLI `scan` / `sync` command obtains the injected `RouteSyncCliUpstreamCompositionInterface` and invokes its manifest scan operation.
2. `packages/cli/src/upstreamCompositionFactory.ts` assembles the semantic pipeline through `requestTypeDerivationProductionPipelineAssembler.assemble(...)`; the assembly ADT owns `continueWith(...)`, so the composition factory does not switch on `assembly.kind`.
3. `packages/cli/src/manifestScanOperationInterface.ts` creates the CLI manifest scan operation and delegates to the injected `ControllerInvocationManifestCompositionAuthorityInterface`.
4. `packages/cli/src/parsers/php/controllerInvocationManifestComposition.ts` composes the source discovery / invocation inventory authority and shared PHP source reader.
5. `packages/core/src/compiler/scanner/wiring/upstreamManifestBuilder.ts` prepares `ManifestBuilderInterface`, executes `LaravelSourceAstPipelineInterface`, preserves AST/source-model blockers as `ManifestBuilderJudgment`, and only creates a complete manifest from complete upstream evidence.
6. `packages/core/src/compiler/scanner/wiring/laravelSourceAstPipeline.ts` obtains source AST products and calls `LaravelRouteScannerInterface.prepare(...).execute()`.
7. `packages/core/src/compiler/scanner/wiring/laravelRouteScanner.ts` resolves route-source selection, observes selected/missing files, reads only the scannable inventory through `PhpSourceDocumentReaderInterface`, and folds read outcomes through `PhpSourceDocumentReadBatchFactory`.
8. `LaravelRouteScanOutcome` variants expose `continueToSourceAstProjection(...)` through `laravelRouteScanOutcomeOperations`; this is the correct direction because each terminal outcome retains its own evidence and owns the next domain action.
9. `ManifestBuilderJudgment` exposes `continueToFlow(...)`; blocked judgments return themselves as blocked scan judgments, while complete judgments project the canonical manifest flow.
10. `packages/core/src/compiler/scanner/orchestrator/upstreamManifestScanner.ts` provides the explicitly typed public facade `routeSyncManifestScanner` and operation factory. The CLI receives a typed operation rather than constructing manifest semantics itself.

## Interface-first runtime export audit

The principal runtime objects in this trace already use `export const name: ExistingInterface = Object.freeze({...})` or an equivalent interface-typed object:

- `routeSyncCliUpstreamCompositionFactory`
- `routeSyncManifestScanOperationFactory`
- `routeSyncManifestScanOperation`
- `routeSyncManifestScanner`
- `manifestBuilderOperationPreparation`
- `laravelSourceAstPipelineFactory`
- `laravelRouteScannerFactory`
- `laravelRouteScanOutcomeOperations`

This does not prove repository-wide completion. It means the next improvement should not blindly rewrite these declarations; it should close the remaining domain-operation gaps below and migrate any newly discovered runtime entrypoint only after checking its existing contract.

## Remaining gaps and recommended upstream changes

### P1 — Source-observation ADT still delegates its next action to consumer callbacks

`packages/core/src/types/upstream/laravelRouteSourceSelection.ts` exposes `LaravelRouteSourceObservationJudgment.continueWith({ onReady, onBlocked })`. The ADT carries `continueWithScannableSources()` and `preserveMissingSourceEvidence()`, but the consumer still supplies the main ready/blocked continuation. This is a domain-shaped handler protocol, not yet a fully owned operation.

**Recommendation:** evolve the existing source-observation contract with named source-domain operations for the next legal transitions, reusing the existing source-read batch and route-scan outcome contracts. The ready outcome should own the transition to source reading using an injected typed read/scan capability; the blocked outcome should own preservation of explicit missing-source evidence. Keep default optional absence distinct from explicitly selected missing files. Do not collapse either into an empty inventory or successful manifest. Update every constructor, producer, consumer, and test fixture together.

### P1 — Source inventory exposes callback-shaped traversal and materialization

`SourceFileInventoryOperations` in `packages/core/src/types/upstream/names.ts` exposes `continueWith(handlers)`, `toSourceFiles()`, `duplicateIdentities()`, and `format(...)`. `toSourceFiles()` materializes an array that callers often traverse again; callback traversal leaves consumers responsible for deciding what each source means.

**Recommendation:** add only domain-specific operations justified by real runtime consumers, such as source-read planning or source identity correspondence. Replace each traced use with the relevant domain operation; do not add a generic collection abstraction and keep `packages/core/src/types/upstream/collections.ts` empty. Preserve order, duplicates, and source identity evidence.

### P2 — Manifest judgment continuation still accepts a projection capability at the terminal

`ManifestBuilderCompleteJudgment.continueToFlow(projection)` and blocked variants share the same method shape. The blocked implementation returns the blocker unchanged; the complete implementation invokes `projection.project(manifest)`. This is safer than consumer-side discriminant branching, but the name/contract can be more precise about complete publication versus blocked preservation.

**Recommendation:** if downstream callers need stronger intent, evolve this existing ADT (not a parallel one) so completion explicitly publishes/projects a flow and blocked variants explicitly preserve the exact blocker. Keep the flow projection as an injected capability, not hidden semantic reasoning.

### P2 — Runtime style is scoped, not repository-wide

An interface-first export in one path does not prove all `export function` declarations have been removed. Run a repository-wide inventory, classify declarations into runtime entrypoints versus internal helpers, and migrate in bounded groups with existing interface contracts. Do not replace declarations with inferred `export const` arrows; the target is an explicitly typed object contract.

## Required invariants

- A source-read failure cannot become an empty successful manifest.
- An explicitly selected missing route file remains blocked; an absent conventional/default file may remain an optional absence only under the default selection intent.
- AST, semantic source-model, identity, correspondence, and manifest blockers retain exact evidence.
- ADTs own domain operations that continue or preserve results; consumers should not repeatedly inspect `kind` to decide domain meaning.
- No generic `Result`, generic visitor, or `collections.ts` workaround.
- Runtime exports use explicit interface-typed objects and typed inputs/outputs.
- Primitive `if`, equality checks, and loops are not removed mechanically. Where they encode domain knowledge, raise that knowledge into an upstream ADT/operation; where they implement lexical recognition or low-level mechanics, retain them until a stronger model legitimately replaces them.

## Verification boundary

This phase adds the trace/audit artifact and a structural audit of the documented path. It does not claim that the remaining source-observation/inventory gaps have been migrated. Full typecheck, unit tests, build, and CLI end-to-end execution remain unverified in this workspace because the prior Phase2966 verification reported missing `@types/node` and `vitest/globals` types and a global TypeScript version incompatible with the configured ES2025 target/lib.


## Phase2969 follow-up — source-observation blocker ownership

The former `{ onReady, onBlocked }` source-observation handler was reduced to the typed ready capability `scanReadyObservation`. An explicitly selected missing-source judgment now owns its blocked transition by producing `laravelRouteScanOutcomeOperations.sourceSelectionBlocked(blocked)` directly. The scanner no longer re-dispatches that variant through a consumer callback. This is a bounded ownership improvement, not a claim that the scanner is fully callback-free: ready-source reading, read-batch folding, and parsing remain scanner responsibilities. Structural checks now include blocker ownership and ready-only continuation.

## Phase2970 follow-up — ready observation owns source reading

`LaravelRouteSourceObservationJudgment.continueToRouteScan(reader, continuation)` now makes the ready variant responsible for reading its scannable inventory and constructing the typed `PhpSourceDocumentReadBatchJudgment`. The scanner no longer maps source files to `reader.read(...)` or constructs the read batch itself. The blocked variant still owns its `sourceSelectionBlocked` transition. See `PHASE2970_READY_SOURCE_READ_OWNERSHIP.md` and `PHASE2970_AUDIT.json` for the bounded scope and verification limits.

This phase does not restore the deleted relation foundation. The uploaded build log's unresolved imports remain a separate, repository-wide migration blocker; structural audit success is not a successful build claim.
